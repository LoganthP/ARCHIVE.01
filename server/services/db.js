import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '..', 'research.db');

let db;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS papers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      authors TEXT,
      abstract TEXT NOT NULL,
      full_text TEXT,
      year INTEGER,
      embedding TEXT,
      summary TEXT,
      analyzed_at TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      plan TEXT DEFAULT 'Free',
      two_factor_secret TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id INTEGER PRIMARY KEY,
      theme TEXT DEFAULT 'archive-light',
      typography TEXT DEFAULT 'Playfair',
      searchStrategy TEXT DEFAULT 'hybrid',
      fuzzyMatching BOOLEAN DEFAULT 1,
      notificationsEnabled BOOLEAN DEFAULT 1,
      emailNotifications BOOLEAN DEFAULT 1,
      semanticModel TEXT DEFAULT 'text-embedding-3-small',
      similarityThreshold REAL DEFAULT 0.70,
      chunkSize INTEGER DEFAULT 512,
      chunkOverlap INTEGER DEFAULT 50,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      browser TEXT,
      device TEXT,
      ip TEXT,
      country TEXT,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      key_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      last_used DATETIME,
      requests INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS support_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      priority TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'Open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      sources TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(chat_id) REFERENCES chats(id) ON DELETE CASCADE
    );
  `);

  // Ensure default user exists
  const stmt = db.prepare('SELECT id FROM users WHERE id = 1');
  if (!stmt.get()) {
    db.prepare("INSERT INTO users (id, name, email, plan) VALUES (1, 'Archive Researcher', 'researcher@archive01.net', 'Pro Tier')").run();
    db.prepare(`
      INSERT INTO user_preferences (user_id) VALUES (1)
    `).run();
  }

  // Migrations for existing DB (add column if missing):
  try {
    db.exec(`ALTER TABLE papers ADD COLUMN summary TEXT`);
  } catch (e) {
    // Column already exists — ignore
  }

  try {
    db.exec(`ALTER TABLE papers ADD COLUMN full_text TEXT`);
  } catch (e) {
    // Column already exists — ignore
  }

  try {
    db.exec(`ALTER TABLE papers ADD COLUMN analyzed_at TEXT`);
  } catch (e) {
    // Column already exists — ignore
  }

  // Create index for faster lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_papers_year ON papers(year);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  `);
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

export default { getDb, closeDb };
