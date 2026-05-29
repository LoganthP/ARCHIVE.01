import express from 'express';
import { getDb } from '../services/db.js';
import { reindexAll } from '../services/vectorStore.js';

const router = express.Router();

// Get settings for user 1 (mock auth)
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const settings = db.prepare('SELECT * FROM user_preferences WHERE user_id = 1').get();
    
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }
    
    // Convert 1/0 back to boolean
    res.json({
      ...settings,
      fuzzyMatching: !!settings.fuzzyMatching,
      notificationsEnabled: !!settings.notificationsEnabled,
      emailNotifications: !!settings.emailNotifications
    });
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update settings
router.put('/', (req, res) => {
  try {
    const db = getDb();
    const currentSettings = db.prepare('SELECT * FROM user_preferences WHERE user_id = 1').get();
    
    const {
      theme,
      typography,
      searchStrategy,
      fuzzyMatching,
      notificationsEnabled,
      emailNotifications,
      semanticModel,
      similarityThreshold,
      chunkSize,
      chunkOverlap
    } = req.body;

    const stmt = db.prepare(`
      UPDATE user_preferences SET
        theme = coalesce(?, theme),
        typography = coalesce(?, typography),
        searchStrategy = coalesce(?, searchStrategy),
        fuzzyMatching = coalesce(?, fuzzyMatching),
        notificationsEnabled = coalesce(?, notificationsEnabled),
        emailNotifications = coalesce(?, emailNotifications),
        semanticModel = coalesce(?, semanticModel),
        similarityThreshold = coalesce(?, similarityThreshold),
        chunkSize = coalesce(?, chunkSize),
        chunkOverlap = coalesce(?, chunkOverlap)
      WHERE user_id = 1
    `);

    stmt.run(
      theme,
      typography,
      searchStrategy,
      fuzzyMatching === undefined ? null : (fuzzyMatching ? 1 : 0),
      notificationsEnabled === undefined ? null : (notificationsEnabled ? 1 : 0),
      emailNotifications === undefined ? null : (emailNotifications ? 1 : 0),
      semanticModel,
      similarityThreshold,
      chunkSize,
      chunkOverlap
    );

    // If semantic model changed, trigger background re-indexing
    if (semanticModel && currentSettings && semanticModel !== currentSettings.semanticModel) {
      reindexAll(semanticModel).catch(err => {
        console.error('Background re-indexing failed:', err);
      });
    }

    const updatedSettings = db.prepare('SELECT * FROM user_preferences WHERE user_id = 1').get();
    
    res.json({
      ...updatedSettings,
      fuzzyMatching: !!updatedSettings.fuzzyMatching,
      notificationsEnabled: !!updatedSettings.notificationsEnabled,
      emailNotifications: !!updatedSettings.emailNotifications
    });
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
