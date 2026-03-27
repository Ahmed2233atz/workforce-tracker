const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/workers/:id/credentials — admin sees worker's credentials
router.get('/', authenticate, requireAdmin, (req, res) => {
  const creds = db.prepare('SELECT * FROM credentials WHERE worker_id = ? ORDER BY created_at ASC').all(req.params.id);
  return res.json(creds);
});

// GET /api/me/credentials — worker sees their own credentials
router.get('/me', authenticate, (req, res) => {
  const creds = db.prepare('SELECT * FROM credentials WHERE worker_id = ? ORDER BY created_at ASC').all(req.user.id);
  return res.json(creds);
});

// POST /api/workers/:id/credentials — admin adds credential
router.post('/', authenticate, requireAdmin, (req, res) => {
  const { platform, username, password, notes } = req.body;
  if (!platform) return res.status(400).json({ error: 'Platform name is required' });
  const result = db.prepare(`
    INSERT INTO credentials (worker_id, platform, username, password, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.id, platform.trim(), username || null, password || null, notes || null);
  const cred = db.prepare('SELECT * FROM credentials WHERE id = ?').get(result.lastInsertRowid);
  // Notify worker
  try {
    db.prepare(`INSERT INTO notifications (user_id, type, title, message) VALUES (?, 'credentials', 'Platform Credentials Added', ?)`)
      .run(req.params.id, `Your login credentials for ${platform} have been added. Check the Resources page.`);
  } catch (e) {}
  return res.status(201).json(cred);
});

// PUT /api/workers/:id/credentials/:credId — admin edits credential
router.put('/:credId', authenticate, requireAdmin, (req, res) => {
  const { platform, username, password, notes } = req.body;
  db.prepare(`
    UPDATE credentials SET
      platform = COALESCE(?, platform),
      username = COALESCE(?, username),
      password = COALESCE(?, password),
      notes = COALESCE(?, notes),
      updated_at = datetime('now')
    WHERE id = ? AND worker_id = ?
  `).run(platform || null, username !== undefined ? username : null, password !== undefined ? password : null, notes !== undefined ? notes : null, req.params.credId, req.params.id);
  const cred = db.prepare('SELECT * FROM credentials WHERE id = ?').get(req.params.credId);
  return res.json(cred);
});

// DELETE /api/workers/:id/credentials/:credId — admin deletes credential
router.delete('/:credId', authenticate, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM credentials WHERE id = ? AND worker_id = ?').run(req.params.credId, req.params.id);
  return res.json({ success: true });
});

module.exports = router;
