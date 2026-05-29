import express from 'express';
import { getDb } from '../services/db.js';
import crypto from 'crypto';

const router = express.Router();

// Mock current user ID
const USER_ID = 1;

// Get active sessions
router.get('/sessions', (req, res) => {
  try {
    const db = getDb();
    const sessions = db.prepare('SELECT * FROM sessions WHERE user_id = ? ORDER BY last_active DESC').all(USER_ID);
    
    // If no sessions exist, let's insert a mock one for demonstration of the UI
    if (sessions.length === 0) {
      const sessionId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO sessions (id, user_id, browser, device, ip, country)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(sessionId, USER_ID, 'Chrome 125.0', 'Mac OS', '192.168.1.1', 'US');
      
      const newSession = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
      return res.json([newSession]);
    }
    
    res.json(sessions);
  } catch (err) {
    console.error('Error fetching sessions:', err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Terminate a session
router.delete('/sessions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    db.prepare('DELETE FROM sessions WHERE id = ? AND user_id = ?').run(id, USER_ID);
    res.json({ success: true });
  } catch (err) {
    console.error('Error terminating session:', err);
    res.status(500).json({ error: 'Failed to terminate session' });
  }
});

// Toggle 2FA
router.post('/2fa/toggle', (req, res) => {
  try {
    const { enabled } = req.body;
    const db = getDb();
    const secret = enabled ? crypto.randomBytes(20).toString('hex') : null;
    db.prepare('UPDATE users SET two_factor_secret = ? WHERE id = ?').run(secret, USER_ID);
    res.json({ success: true, enabled, secret });
  } catch (err) {
    console.error('Error toggling 2FA:', err);
    res.status(500).json({ error: 'Failed to toggle 2FA' });
  }
});

// Update password
router.post('/password', (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const db = getDb();
    // Normally we'd verify oldPassword, but we mock it here.
    const hash = crypto.createHash('sha256').update(newPassword).digest('hex');
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, USER_ID);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating password:', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

export default router;
