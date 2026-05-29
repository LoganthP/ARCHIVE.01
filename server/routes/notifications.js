import express from 'express';
import { getDb } from '../services/db.js';

const router = express.Router();

// Get notifications for user 1
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = 1 ORDER BY created_at DESC LIMIT 50').all();
    
    // Map to frontend expected format
    const formatted = notifications.map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      time: n.created_at, // Could use date-fns on frontend for relative time
      unread: n.is_read === 0,
      icon: n.type === 'success' ? 'check_circle' : n.type === 'warning' ? 'warning' : 'info',
      color: n.type === 'success' ? 'text-green-500' : n.type === 'warning' ? 'text-orange-500' : 'text-secondary'
    }));
    
    res.json(formatted);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark all as read
router.put('/read-all', (req, res) => {
  try {
    const db = getDb();
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = 1').run();
    res.json({ success: true });
  } catch (err) {
    console.error('Error marking notifications as read:', err);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// Create a notification (Internal use helper)
export function createNotification(userId, type, title, message) {
  try {
    const db = getDb();
    const prefs = db.prepare('SELECT notificationsEnabled FROM user_preferences WHERE user_id = ?').get(userId);
    
    if (prefs && prefs.notificationsEnabled) {
      db.prepare('INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)').run(
        userId, type, title, message
      );
    }
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}

export default router;
