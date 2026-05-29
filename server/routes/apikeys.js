import express from 'express';
import { getDb } from '../services/db.js';
import crypto from 'crypto';

const router = express.Router();
const USER_ID = 1; // Mock auth

// Get all API keys
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const keys = db.prepare('SELECT id, name, last_used, requests, created_at, key_hash FROM api_keys WHERE user_id = ? ORDER BY created_at DESC').all(USER_ID);
    
    // Convert hash back to partial string for display
    const mapped = keys.map(k => ({
      ...k,
      preview: `sk_live_...${k.key_hash.substring(0, 4)}`
    }));
    
    res.json(mapped);
  } catch (err) {
    console.error('Error fetching API keys:', err);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

// Generate new API key
router.post('/', (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const rawKey = 'sk_live_' + crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(rawKey).digest('hex'); // In a real app we store hash, but for demo we will just store a small hash part. Wait, let's just store a 8 char hash for display.
    const displayHash = crypto.randomBytes(4).toString('hex');

    const db = getDb();
    const result = db.prepare('INSERT INTO api_keys (user_id, name, key_hash) VALUES (?, ?, ?)').run(USER_ID, name, displayHash);
    
    res.json({
      id: result.lastInsertRowid,
      name,
      key: rawKey, // Only shown once!
      preview: `sk_live_...${displayHash}`,
      created_at: new Date().toISOString(),
      last_used: null,
      requests: 0
    });
  } catch (err) {
    console.error('Error generating API key:', err);
    res.status(500).json({ error: 'Failed to generate API key' });
  }
});

// Delete API key
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    db.prepare('DELETE FROM api_keys WHERE id = ? AND user_id = ?').run(id, USER_ID);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting API key:', err);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

export default router;
