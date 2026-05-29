import { getDb } from './db.js';
import { createNotification } from '../routes/notifications.js';

/**
 * In-memory vector store using cosine similarity.
 * No native dependencies — works everywhere.
 */

// Map of paperId → Float32Array embedding
const store = new Map();

/**
 * Compute cosine similarity between two vectors.
 * Returns value between -1 and 1 (1 = identical).
 */
export function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    console.warn(`Vector dimension mismatch: ${a.length} vs ${b.length}. Skipping.`);
    return 0;
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Add an embedding to the in-memory store.
 */
export function addEmbedding(paperId, embedding) {
  const vec = new Float32Array(embedding);
  store.set(paperId, vec);
}

/**
 * Remove an embedding from the store.
 */
export function removeEmbedding(paperId) {
  store.delete(paperId);
}

/**
 * Search for the top K most similar papers to the query embedding.
 * Returns array of { paperId, score } sorted by descending similarity.
 */
export function search(queryEmbedding, topK = 5) {
  const queryVec = new Float32Array(queryEmbedding);
  const results = [];

  for (const [paperId, docVec] of store.entries()) {
    const score = cosineSimilarity(queryVec, docVec);
    results.push({ paperId, score });
  }

  // Sort by similarity descending
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, topK);
}

/**
 * Load all existing embeddings from SQLite into memory.
 * Called once on server startup.
 */
export function loadFromDatabase() {
  const db = getDb();
  const rows = db.prepare('SELECT id, embedding FROM papers WHERE embedding IS NOT NULL').all();

  let loaded = 0;
  for (const row of rows) {
    try {
      const embedding = JSON.parse(row.embedding);
      addEmbedding(row.id, embedding);
      loaded++;
    } catch (err) {
      console.warn(`Failed to load embedding for paper ${row.id}:`, err.message);
    }
  }

  console.log(`📦 Loaded ${loaded} embeddings into vector store`);
  return loaded;
}

/**
 * Get the number of embeddings in the store.
 */
export function getStoreSize() {
  return store.size;
}

/**
 * Re-index all papers using a specific model in the background.
 */
export async function reindexAll(modelName) {
  console.log(`Starting background re-indexing using model: ${modelName}`);
  const db = getDb();
  
  // Need dynamic import to avoid circular dependency since ai.js imports from here sometimes, though it doesn't currently. 
  // Actually we can just import it at the top or dynamically.
  const { generateEmbedding } = await import('./ai.js');
  
  const papers = db.prepare('SELECT id, title, abstract FROM papers').all();
  let updated = 0;

  store.clear();

  for (const paper of papers) {
    try {
      const textToEmbed = `Title: ${paper.title}\n\nAbstract: ${paper.abstract}`;
      const embedding = await generateEmbedding(textToEmbed, modelName);
      
      db.prepare('UPDATE papers SET embedding = ? WHERE id = ?').run(
        JSON.stringify(embedding),
        paper.id
      );
      
      addEmbedding(paper.id, embedding);
      updated++;
    } catch (err) {
      console.warn(`Failed to re-index paper ${paper.id}:`, err.message);
    }
  }

  console.log(`✅ Background re-indexing complete. ${updated} papers re-indexed.`);
  createNotification(1, 'info', 'Re-indexing Complete', `Successfully re-indexed ${updated} papers using ${modelName}.`);
  return updated;
}

export default {
  cosineSimilarity,
  addEmbedding,
  removeEmbedding,
  search,
  loadFromDatabase,
  getStoreSize,
  reindexAll,
};
