import express from 'express';
import { getDb } from '../services/db.js';

const router = express.Router();
const USER_ID = 1; // Mock auth

// Get profile
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT id, name, email, plan, created_at FROM users WHERE id = ?').get(USER_ID);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update profile
router.put('/', (req, res) => {
  try {
    const { name, email } = req.body;
    const db = getDb();
    
    db.prepare('UPDATE users SET name = coalesce(?, name), email = coalesce(?, email) WHERE id = ?').run(
      name, email, USER_ID
    );
    
    const user = db.prepare('SELECT id, name, email, plan, created_at FROM users WHERE id = ?').get(USER_ID);
    res.json(user);
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
