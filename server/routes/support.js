import express from 'express';
import { getDb } from '../services/db.js';

const router = express.Router();
const USER_ID = 1; // Mock auth

// Get all support tickets
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const tickets = db.prepare('SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC').all(USER_ID);
    res.json(tickets);
  } catch (err) {
    console.error('Error fetching tickets:', err);
    res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
});

// Create a new support ticket
router.post('/', (req, res) => {
  try {
    const { title, category, priority, description } = req.body;
    
    if (!title || !category || !priority || !description) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO support_tickets (user_id, title, category, priority, description)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(USER_ID, title, category, priority, description);
    
    const newTicket = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newTicket);
  } catch (err) {
    console.error('Error creating ticket:', err);
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

// Resolve/Close a support ticket
router.patch('/:id/resolve', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    
    // Check if the ticket belongs to the user
    const ticket = db.prepare('SELECT * FROM support_tickets WHERE id = ? AND user_id = ?').get(id, USER_ID);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    db.prepare("UPDATE support_tickets SET status = 'Resolved' WHERE id = ?").run(id);
    
    const updatedTicket = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(id);
    res.json(updatedTicket);
  } catch (err) {
    console.error('Error resolving ticket:', err);
    res.status(500).json({ error: 'Failed to resolve support ticket' });
  }
});

export default router;
