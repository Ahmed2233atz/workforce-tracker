const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Worker: GET /api/chat/messages — full conversation history
router.get('/messages', authenticate, (req, res) => {
  if (req.user.role !== 'worker') return res.status(403).json({ error: 'Workers only' });

  const messages = db.prepare(`
    SELECT m.*, u.name AS sender_name
    FROM chat_messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.sender_id = ? OR m.receiver_id = ?
    ORDER BY m.created_at ASC
  `).all(req.user.id, req.user.id);

  // Mark admin replies as read
  db.prepare(`
    UPDATE chat_messages SET is_read = 1
    WHERE receiver_id = ? AND is_read = 0
  `).run(req.user.id);

  return res.json(messages);
});

// Worker: POST /api/chat/messages — send a message to support
router.post('/messages', authenticate, (req, res) => {
  if (req.user.role !== 'worker') return res.status(403).json({ error: 'Workers only' });

  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

  const result = db.prepare(`
    INSERT INTO chat_messages (sender_id, receiver_id, message, is_read)
    VALUES (?, NULL, ?, 0)
  `).run(req.user.id, message.trim());

  const msg = db.prepare(`
    SELECT m.*, u.name AS sender_name
    FROM chat_messages m JOIN users u ON u.id = m.sender_id
    WHERE m.id = ?
  `).get(result.lastInsertRowid);

  return res.status(201).json(msg);
});

// Worker: GET /api/chat/unread — unread count (admin replies)
router.get('/unread', authenticate, (req, res) => {
  if (req.user.role !== 'worker') return res.status(403).json({ error: 'Workers only' });

  const row = db.prepare(`
    SELECT COUNT(*) AS count FROM chat_messages
    WHERE receiver_id = ? AND is_read = 0
  `).get(req.user.id);

  return res.json({ unread_count: row.count });
});

// Admin: GET /api/chat/conversations — list of workers with messages
router.get('/conversations', authenticate, requireAdmin, (req, res) => {
  const convos = db.prepare(`
    SELECT
      u.id   AS worker_id,
      u.name AS worker_name,
      ( SELECT message    FROM chat_messages
        WHERE sender_id = u.id OR receiver_id = u.id
        ORDER BY created_at DESC LIMIT 1 ) AS last_message,
      ( SELECT created_at FROM chat_messages
        WHERE sender_id = u.id OR receiver_id = u.id
        ORDER BY created_at DESC LIMIT 1 ) AS last_message_at,
      ( SELECT COUNT(*) FROM chat_messages
        WHERE sender_id = u.id AND is_read = 0 ) AS unread_count
    FROM users u
    WHERE u.role = 'worker'
      AND EXISTS (
        SELECT 1 FROM chat_messages
        WHERE sender_id = u.id OR receiver_id = u.id
      )
    ORDER BY last_message_at DESC
  `).all();

  return res.json(convos);
});

// Admin: GET /api/chat/conversations/:workerId — full thread with one worker
router.get('/conversations/:workerId', authenticate, requireAdmin, (req, res) => {
  const { workerId } = req.params;

  const messages = db.prepare(`
    SELECT m.*, u.name AS sender_name
    FROM chat_messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.sender_id = ? OR m.receiver_id = ?
    ORDER BY m.created_at ASC
  `).all(workerId, workerId);

  // Mark worker messages as read
  db.prepare(`
    UPDATE chat_messages SET is_read = 1 WHERE sender_id = ? AND is_read = 0
  `).run(workerId);

  return res.json(messages);
});

// Admin: POST /api/chat/reply/:workerId — reply to a worker
router.post('/reply/:workerId', authenticate, requireAdmin, (req, res) => {
  const { workerId } = req.params;
  const { message } = req.body;

  if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

  const result = db.prepare(`
    INSERT INTO chat_messages (sender_id, receiver_id, message, is_read)
    VALUES (?, ?, ?, 0)
  `).run(req.user.id, workerId, message.trim());

  const msg = db.prepare(`
    SELECT m.*, u.name AS sender_name
    FROM chat_messages m JOIN users u ON u.id = m.sender_id
    WHERE m.id = ?
  `).get(result.lastInsertRowid);

  return res.status(201).json(msg);
});

// Admin: GET /api/chat/total-unread — badge for admin nav
router.get('/total-unread', authenticate, requireAdmin, (req, res) => {
  const row = db.prepare(`
    SELECT COUNT(*) AS count FROM chat_messages
    WHERE is_read = 0 AND receiver_id IS NULL
  `).get();
  return res.json({ unread_count: row.count });
});

module.exports = router;
