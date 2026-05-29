import { Router } from 'express';
import Fuse from 'fuse.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getDb } from '../services/db.js';
import { generateQueryEmbedding } from '../services/ai.js';
import { search, getStoreSize } from '../services/vectorStore.js';

const router = Router();

router.post('/', asyncHandler(async (req, res) => {
  const { query, topK = 5 } = req.body;

  if (!query || !query.trim()) {
    const err = new Error('Search query is required');
    err.status = 400;
    throw err;
  }

  const db = getDb();
  
  // 1. Get User Preferences
  const settings = db.prepare('SELECT searchStrategy, fuzzyMatching, similarityThreshold FROM user_preferences WHERE user_id = 1').get() || {
    searchStrategy: 'hybrid',
    fuzzyMatching: 1,
    similarityThreshold: 0.70
  };

  const allPapers = db.prepare('SELECT id, title, authors, abstract, year, created_at FROM papers').all();
  if (allPapers.length === 0) {
    return res.json({ results: [], message: 'No papers in the database.' });
  }

  const k = Math.min(Math.max(1, parseInt(topK)), 50);
  let finalScores = new Map(); // paperId -> score

  // 2. Keyword Search (Fuse.js)
  if (settings.searchStrategy === 'hybrid' || settings.searchStrategy === 'keyword') {
    const fuse = new Fuse(allPapers, {
      keys: ['title', 'authors', 'abstract'],
      includeScore: true,
      threshold: settings.fuzzyMatching ? 0.4 : 0.1, // more strict if fuzzy disabled
      ignoreLocation: true
    });
    
    const keywordResults = fuse.search(query.trim());
    keywordResults.forEach(res => {
      // fuse score: 0 is exact match, 1 is no match. We invert it to match vector similarity (higher is better)
      const score = Math.max(0, 1 - res.score);
      finalScores.set(res.item.id, score);
    });
  }

  // 3. Semantic Search
  if (settings.searchStrategy === 'hybrid' || settings.searchStrategy === 'semantic') {
    const embedding = await generateQueryEmbedding(query.trim());
    const matches = search(embedding, k * 2); // get more matches for hybrid combining
    
    matches.forEach(match => {
      if (match.score >= settings.similarityThreshold) {
        if (settings.searchStrategy === 'hybrid') {
          // Combine scores (e.g., 60% semantic, 40% keyword)
          const current = finalScores.get(match.paperId) || 0;
          finalScores.set(match.paperId, (match.score * 0.6) + (current * 0.4));
        } else {
          finalScores.set(match.paperId, match.score);
        }
      }
    });
  }

  // 4. Assemble Results
  const results = [];
  for (const [id, score] of finalScores.entries()) {
    if (score > 0) {
      const paper = allPapers.find(p => p.id === id);
      results.push({
        ...paper,
        score: Math.round(score * 10000) / 10000
      });
    }
  }

  results.sort((a, b) => b.score - a.score);

  res.json({
    query: query.trim(),
    totalPapersSearched: allPapers.length,
    strategy: settings.searchStrategy,
    results: results.slice(0, k),
  });
}));

export default router;
