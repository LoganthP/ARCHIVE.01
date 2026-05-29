import { Router } from 'express';
import { getDb } from '../services/db.js';
import { summarizePaper, generateEmbedding, generateQueryEmbedding } from '../services/ai.js';
import { addEmbedding, removeEmbedding } from '../services/vectorStore.js';
import multer from 'multer';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { cleanPaperText, extractAbstractOnly } from '../services/textCleaner.js';
import { createNotification } from './notifications.js';

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

const router = Router();

function cleanExtractedText(raw) {
  return raw
    // Fix common PDF ligature encoding issues
    .replace(/ﬁ/g, 'fi').replace(/ﬂ/g, 'fl').replace(/ﬀ/g, 'ff')
    .replace(/ﬃ/g, 'ffi').replace(/ﬄ/g, 'ffl').replace(/ﬅ/g, 'st')
    // Remove footnote symbols mixed into text
    .replace(/[†‡§¶*ø∗]/g, '')
    // Fix broken hyphenated words across lines (e.g. "recog-\nnition" → "recognition")
    .replace(/(\w+)-\s*\n\s*(\w+)/g, '$1$2')
    // Normalize whitespace
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    // Remove lines that are just numbers (page numbers)
    .replace(/^\s*\d+\s*$/gm, '')
    .trim();
}

function extractAbstractClean(fullText) {
  const cleaned = cleanExtractedText(fullText);

  // Strategy 1: Look for "Abstract" keyword with colon or newline
  const s1 = cleaned.match(
    /\bAbstract[:\s—\-]+([^\n]{50,}(?:\n(?!\n)[^\n]{10,}){0,20})/i
  );
  if (s1) {
    let abs = s1[1]
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    // Cut off at Keywords section
    abs = abs.replace(/\s*Keywords?[:\s].*/i, '').trim();
    if (abs.length > 100) return abs;
  }

  // Strategy 2: Find text block between title area and "1. Introduction"
  const s2 = cleaned.match(
    /(?:Keywords|Abstract)[^\n]*\n+([\s\S]{200,3000}?)(?=\n\s*(?:1\.|Introduction|Keywords))/i
  );
  if (s2) {
    return s2[1].replace(/\s+/g, ' ').trim();
  }

  // Strategy 3: Skip first 800 chars (title/authors area), take next 3000
  const fallback = cleaned.substring(800, 3800).replace(/\s+/g, ' ').trim();
  // Remove anything that looks like author/affiliation lines (short lines < 60 chars)
  return fallback
    .split('. ')
    .filter(s => s.length > 40)
    .join('. ')
    .trim();
}

function extractAuthorsClean(fullText) {
  const cleaned = cleanExtractedText(fullText).substring(0, 2000);
  
  // Remove footnote markers and affiliation symbols
  const noSymbols = cleaned.replace(/[†‡§*\d,ø∗]/g, ' ');

  // Strategy 1: Look for "and" pattern — "Name, Name and Name"
  const s1 = noSymbols.match(
    /([A-Z][a-z]+ [A-Z][a-z]+(?:\s*,\s*[A-Z][a-z]+ [A-Z][a-z]+)*\s+and\s+[A-Z][a-z]+ [A-Z][a-z]+)/
  );
  if (s1) return s1[1].replace(/\s+/g, ' ').trim();

  // Strategy 2: Comma-separated capitalized names
  const s2 = noSymbols.match(
    /([A-Z][a-z]+ [A-Z][a-z]+(?:\s*[,;]\s*[A-Z][a-z]+ [A-Z][a-z]+){1,10})/
  );
  if (s2) return s2[1].replace(/\s+/g, ' ').trim();

  return '';
}

/**
 * POST /api/papers — Add a new paper
 * Body: { title, authors, abstract, year }
 */
router.post('/', upload.single('pdf'), async (req, res, next) => {
  try {
    let extractedText = '';
    let abstract = req.body.abstract?.trim() || '';
    let title    = req.body.title?.trim()    || '';
    let authors  = req.body.authors?.trim()  || '';
    let year     = req.body.year             || new Date().getFullYear();
    let fullContext = '';

    if (req.file && req.file.buffer) {
      try {
        const pdf = await pdfParse(req.file.buffer);
        extractedText = pdf.text?.replace(/\s+/g, ' ').trim() || '';
        console.log(`PDF extracted: ${extractedText.length} chars`);
      } catch (e) {
        console.warn('PDF parse failed:', e.message);
      }
    }

    // If we got real text from the PDF, use it
    if (extractedText.length > 200) {
      const cleanedFull = cleanExtractedText(extractedText);
      if (!abstract || abstract.includes('[Please') || abstract.length < 80) {
        abstract = extractAbstractClean(extractedText);
      }
      if (!authors || authors.toLowerCase().includes('unknown') || !authors.trim()) {
        authors = extractAuthorsClean(extractedText);
      }
      // Store cleaned version
      fullContext = cleanedFull.substring(0, 8000);

      // AUTO-EXTRACT title from first 1000 chars if user left it blank
      if (!title || title.toLowerCase().includes('unknown')) {
        const titleMatch = extractedText.substring(0, 1000).match(
          /(?:^|\n)\s*([A-Z][^\n]{20,120})\s*\n/
        );
        if (titleMatch) title = titleMatch[1].trim();
      }

      // AUTO-EXTRACT year from text if not provided
      if (!year || year === new Date().getFullYear()) {
        const yearMatch = extractedText.match(
          /(?:Published|Accepted|Received|©|Copyright)[:\s]+.*?(20\d{2}|19\d{2})/i
        );
        if (yearMatch) year = parseInt(yearMatch[1]);
      }
    }

    // Final validation
    if (!abstract || abstract.includes('[Please refine') || abstract.length < 50) {
      return res.status(400).json({
        error: 'Could not extract abstract from PDF. Please paste the abstract manually in the form.'
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const textForEmbedding = abstract.substring(0, 7000);

    const db = getDb();

    // Generate embedding from title + abstract
    const embeddingText = `${title}. ${abstract}`;
    const embeddingValues = await generateEmbedding(embeddingText);
    const embeddingJson = JSON.stringify(embeddingValues);

    // Insert into database
    const stmt = db.prepare(`
      INSERT INTO papers (title, authors, abstract, full_text, year, embedding)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      title.trim(),
      authors?.trim() || null,
      abstract.trim(),
      fullContext || null,
      year ? parseInt(year, 10) : null,
      embeddingJson
    );

    const paperId = result.lastInsertRowid;

    // Add to in-memory vector store
    addEmbedding(Number(paperId), embeddingValues);

    // Fetch and return the created paper
    const paper = db.prepare('SELECT * FROM papers WHERE id = ?').get(paperId);

    createNotification(1, 'success', 'Paper Uploaded', `Successfully ingested "${title.substring(0, 30)}..." and generated embedding.`);

    res.status(201).json({
      message: 'Paper added successfully',
      paper: formatPaper(paper),
      embeddingGenerated: true,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/papers — List all papers (paginated)
 * Query: ?page=1&limit=20
 */
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const db = getDb();

    const total = db.prepare('SELECT COUNT(*) as count FROM papers').get().count;
    const papers = db.prepare(
      'SELECT * FROM papers ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).all(limit, offset);

    res.json({
      papers: papers.map(formatPaper),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/papers/embeddings — Return all paper embeddings for visualization
 * Must appear BEFORE /:id to avoid being swallowed by the wildcard route.
 */
router.get('/embeddings', async (req, res, next) => {
  try {
    const db = getDb();
    const rows = db.prepare(
      'SELECT id, title, authors, year, abstract, embedding FROM papers WHERE embedding IS NOT NULL'
    ).all();

    const result = rows.map(row => {
      let embedding = [];
      try { embedding = JSON.parse(row.embedding); } catch {}
      return {
        id: row.id,
        title: row.title,
        authors: row.authors || '',
        year: row.year || null,
        abstract: row.abstract || '',
        embedding,
      };
    });

    res.json({ embeddings: result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/papers/:id — Get a single paper by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const paper = db.prepare('SELECT * FROM papers WHERE id = ?').get(id);
    if (!paper) {
      const err = new Error(`Paper with ID ${id} not found`);
      err.status = 404;
      throw err;
    }

    res.json({ paper: formatPaper(paper) });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/papers/:id — Delete a paper
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const paper = db.prepare('SELECT id FROM papers WHERE id = ?').get(id);
    if (!paper) {
      const err = new Error(`Paper with ID ${id} not found`);
      err.status = 404;
      throw err;
    }

    db.prepare('DELETE FROM papers WHERE id = ?').run(id);
    removeEmbedding(Number(id));

    res.json({ message: 'Paper deleted successfully' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/summarize/:id — Structured research analysis via Groq
 */
router.post('/summarize/:id', async (req, res, next) => {
  try {
    const db = getDb();
    const paper = db.prepare('SELECT * FROM papers WHERE id = ?').get(req.params.id);
    if (!paper) return res.status(404).json({ error: 'Paper not found' });

    const textForAnalysis = paper.full_text || paper.abstract;
    const analysis = await summarizePaper(textForAnalysis, paper.title, paper.authors);
    const analyzedAt = new Date().toISOString();

    db.prepare(`
      UPDATE papers SET summary = ?, analyzed_at = ? WHERE id = ?
    `).run(JSON.stringify(analysis), analyzedAt, paper.id);

    res.json({ 
      summary: analysis, 
      analyzedAt 
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Format a paper row for API response.
 * Strips the raw embedding data to keep responses lean.
 */
/**
 * PATCH /api/papers/:id/metadata — Update metadata and re-generate embedding
 */
router.patch('/:id/metadata', async (req, res, next) => {
  try {
    const { title, authors, abstract, year } = req.body;
    const db = getDb();
    
    // We should make sure the paper exists
    const paper = db.prepare('SELECT id FROM papers WHERE id = ?').get(req.params.id);
    if (!paper) return res.status(404).json({ error: 'Paper not found' });

    // Update metadata and clear summary
    db.prepare(`
      UPDATE papers SET title = ?, authors = ?, abstract = ?, year = ?, summary = NULL
      WHERE id = ?
    `).run(
      title.trim(),
      authors?.trim() || null,
      abstract.trim(),
      year ? parseInt(year, 10) : null,
      req.params.id
    );

    // Re-generate embedding with corrected abstract
    const embeddingText = `${title}. ${abstract}`;
    const embeddingValues = await generateEmbedding(embeddingText);
    const embeddingJson = JSON.stringify(embeddingValues);

    db.prepare('UPDATE papers SET embedding = ? WHERE id = ?')
      .run(embeddingJson, req.params.id);

    // Update in-memory vector store as well!
    addEmbedding(Number(req.params.id), embeddingValues);

    res.json({ success: true, message: 'Metadata updated and re-embedded.' });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/clean-abstracts', async (req, res, next) => {
  try {
    const db = getDb();
    const papers = db.prepare('SELECT id, abstract FROM papers').all();
    let cleaned = 0;
    for (const paper of papers) {
      if (
        paper.abstract?.includes('JOURNAL OF L A T E X') ||
        paper.abstract?.includes('CLASS FILES') ||
        paper.abstract?.includes('[1]') ||
        paper.abstract?.includes('Index Terms') ||
        paper.abstract?.length > 5000
      ) {
        const cleanedAbstract = cleanPaperText(paper.abstract)
          .replace(/\[\d+(?:[,–\-]\d+)*\]/g, '')
          .replace(/^(?:Index Terms|Keywords?)[:\s—].+$/gim, '')
          .replace(/JOURNAL OF.+?(?=\n[A-Z])/s, '')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 4000);

        db.prepare('UPDATE papers SET abstract = ? WHERE id = ?')
          .run(cleanedAbstract, paper.id);
        cleaned++;
      }
    }
    res.json({ success: true, cleaned, total: papers.length });
  } catch (err) {
    next(err);
  }
});

function formatPaper(paper) {
  return {
    id: paper.id,
    title: paper.title,
    authors: paper.authors,
    abstract: paper.abstract,
    year: paper.year,
    hasEmbedding: !!paper.embedding,
    summary: paper.summary ? JSON.parse(paper.summary) : null,
    analyzed_at: paper.analyzed_at || null,
    createdAt: paper.created_at,
  };
}

export default router;
