import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import { errorHandler } from './middleware/errorHandler.js';
import { getDb, closeDb } from './services/db.js';
import { loadFromDatabase } from './services/vectorStore.js';
import papersRouter from './routes/papers.js';
import searchRouter from './routes/search.js';
import settingsRouter from './routes/settings.js';
import notificationsRouter from './routes/notifications.js';
import authRouter from './routes/auth.js';
import profileRouter from './routes/profile.js';
import apikeysRouter from './routes/apikeys.js';
import supportRouter from './routes/support.js';
import chatRouter from './routes/chat.js';

// ─── Preflight Checks ────────────────────────────────────────────────
const REQUIRED_ENV = ['GROQ_API_KEY'];
REQUIRED_ENV.forEach(key => {
  if (!process.env[key]) {
    console.error(`❌ Missing required env var: ${key}`);
    process.exit(1);
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

// ─── API Routes ──────────────────────────────────────────────────────
app.use('/api/papers', papersRouter);
app.use('/api/search', searchRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/apikeys', apikeysRouter);
app.use('/api/support', supportRouter);
app.use('/api/chat', chatRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// ─── Static Files (Production) ──────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));

  // SPA fallback — serve index.html for any non-API route
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ─── Error Handler ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ─── Start Server ───────────────────────────────────────────────────
async function start() {
  try {
    // Initialize database
    console.log('🗄️  Initializing database...');
    getDb();

    // Load embeddings into memory
    console.log('🔄 Loading embeddings into vector store...');
    loadFromDatabase();

    app.listen(PORT, () => {
      console.log('');
      console.log('╔══════════════════════════════════════════════════════════╗');
      console.log(`║  🚀 Research Tracker API running on port ${PORT}            ║`);
      console.log(`║  📡 http://localhost:${PORT}                               ║`);
      console.log('╚══════════════════════════════════════════════════════════╝');
      console.log('');
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  closeDb();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  closeDb();
  process.exit(0);
});

start();
