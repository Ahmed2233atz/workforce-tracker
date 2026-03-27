const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/notifications
router.get('/', (req, res) => {
  const notifications = db.prepare(`
    SELECT * FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 30
  `).all(req.user.id);
  const unread_count = notifications.filter(n => !n.is_read).length;
  return res.json({ notifications, unread_count });
});

// PUT /api/notifications/read-all
router.put('/read-all', (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  return res.json({ success: true });
});

// PUT /api/notifications/:id/read
router.put('/:id/read', (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  return res.json({ success: true });
});

module.exports = router;
