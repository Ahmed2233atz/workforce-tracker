const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// POST /api/hours - log hours for a day
router.post('/', (req, res) => {
  const { date, start_time, end_time, total_hours, notes, low_hours_reason } = req.body;

  if (!date || total_hours === undefined) {
    return res.status(400).json({ error: 'Date and total_hours are required' });
  }

  const today = new Date().toISOString().split('T')[0];
  const backfillDays = parseInt(
    (db.prepare("SELECT value FROM settings WHERE key = 'backfill_days'").get() || { value: '2' }).value
  );

  // Calculate minimum allowed date
  const minDate = new Date();
  minDate.setDate(minDate.getDate() - backfillDays);
  const minDateStr = minDate.toISOString().split('T')[0];

  // Workers can only log today or up to backfill_days back; admins can log any date
  if (req.user.role !== 'admin' && date < minDateStr) {
    return res.status(400).json({
      error: `You can only log hours for today or up to ${backfillDays} days back`,
    });
  }

  if (date > today) {
    return res.status(400).json({ error: 'Cannot log hours for future dates' });
  }

  const isBackfill = date < today ? 1 : 0;
  const backfillApproved = req.user.role === 'admin' ? 1 : (isBackfill ? 0 : 1);

  const parsedHours = parseFloat(total_hours);
  if (isNaN(parsedHours) || parsedHours < 0 || parsedHours > 24) {
    return res.status(400).json({ error: 'total_hours must be a number between 0 and 24' });
  }

  // Require low_hours_reason when total hours < 8
  const LOW_HOURS_THRESHOLD = 8;
  if (parsedHours > 0 && parsedHours < LOW_HOURS_THRESHOLD && !low_hours_reason?.trim()) {
    return res.status(400).json({
      error: `A reason is required when logging less than ${LOW_HOURS_THRESHOLD} hours`,
    });
  }

  const result = db.prepare(`
    INSERT INTO hours_logs (user_id, date, start_time, end_time, total_hours, notes, low_hours_reason, is_backfill, backfill_approved)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, date) DO UPDATE SET
      start_time = excluded.start_time,
      end_time = excluded.end_time,
      total_hours = excluded.total_hours,
      notes = excluded.notes,
      low_hours_reason = excluded.low_hours_reason,
      updated_at = datetime('now')
  `).run(req.user.id, date, start_time || null, end_time || null, parsedHours, notes || null, low_hours_reason?.trim() || null, isBackfill, backfillApproved);

  const log = db.prepare('SELECT * FROM hours_logs WHERE user_id = ? AND date = ?').get(req.user.id, date);

  return res.status(201).json(log);
});

// GET /api/hours - get current user's hours
router.get('/', (req, res) => {
  const { start_date, end_date, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = 'WHERE user_id = ?';
  const params = [req.user.id];

  if (start_date) {
    query += ' AND date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND date <= ?';
    params.push(end_date);
  }

  const total = db.prepare(`SELECT COUNT(*) AS count FROM hours_logs ${query}`).get(...params);
  const logs = db.prepare(`
    SELECT * FROM hours_logs ${query}
    ORDER BY date DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  return res.json({
    data: logs,
    total: total.count,
    page: parseInt(page),
    limit: parseInt(limit),
    total_pages: Math.ceil(total.count / parseInt(limit)),
  });
});

// GET /api/hours/today - get today's log for current user
router.get('/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const log = db.prepare('SELECT * FROM hours_logs WHERE user_id = ? AND date = ?').get(req.user.id, today);
  return res.json(log || null);
});

// GET /api/hours/streak - get current streak for current user
router.get('/streak', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const targetHours = parseFloat(
    (db.prepare("SELECT value FROM settings WHERE key = 'daily_target_hours'").get() || { value: '10' }).value
  );

  const logs = db.prepare(`
    SELECT date, total_hours FROM hours_logs
    WHERE user_id = ? AND date <= ?
    ORDER BY date DESC
    LIMIT 60
  `).all(req.user.id, today);

  if (!logs.length) return res.json({ streak: 0 });

  let streak = 0;
  let checkDate = new Date(today);

  for (let i = 0; i < 60; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const dayOfWeek = checkDate.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      checkDate.setDate(checkDate.getDate() - 1);
      continue;
    }

    const log = logs.find((l) => l.date === dateStr);
    if (log && log.total_hours >= targetHours) {
      streak++;
    } else {
      break;
    }

    checkDate.setDate(checkDate.getDate() - 1);
  }

  return res.json({ streak });
});

// GET /api/hours/pending-backfills - admin only
router.get('/pending-backfills', requireAdmin, (req, res) => {
  const backfills = db.prepare(`
    SELECT h.*, u.name AS worker_name, u.email AS worker_email, u.department
    FROM hours_logs h
    JOIN users u ON u.id = h.user_id
    WHERE h.is_backfill = 1 AND h.backfill_approved = 0
    ORDER BY h.date DESC
  `).all();

  return res.json(backfills);
});

// PUT /api/hours/:id/approve - admin only
router.put('/:id/approve', requireAdmin, (req, res) => {
  const { id } = req.params;

  const log = db.prepare('SELECT * FROM hours_logs WHERE id = ?').get(id);
  if (!log) {
    return res.status(404).json({ error: 'Hours log not found' });
  }

  db.prepare(`
    UPDATE hours_logs SET backfill_approved = 1, approved_by = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(req.user.id, id);

  const updated = db.prepare('SELECT * FROM hours_logs WHERE id = ?').get(id);
  return res.json(updated);
});

// PUT /api/hours/:id - update a specific hours log
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { start_time, end_time, total_hours, notes } = req.body;

  const log = db.prepare('SELECT * FROM hours_logs WHERE id = ?').get(id);
  if (!log) {
    return res.status(404).json({ error: 'Hours log not found' });
  }

  // Workers can only update their own logs; admins can update any
  if (req.user.role !== 'admin' && log.user_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only update your own hours' });
  }

  const today = new Date().toISOString().split('T')[0];
  const backfillDays = parseInt(
    (db.prepare("SELECT value FROM settings WHERE key = 'backfill_days'").get() || { value: '2' }).value
  );
  const minDate = new Date();
  minDate.setDate(minDate.getDate() - backfillDays);
  const minDateStr = minDate.toISOString().split('T')[0];

  if (req.user.role !== 'admin' && log.date < minDateStr) {
    return res.status(400).json({ error: 'This log is too old to edit' });
  }

  const parsedHours = total_hours !== undefined ? parseFloat(total_hours) : log.total_hours;
  if (isNaN(parsedHours) || parsedHours < 0 || parsedHours > 24) {
    return res.status(400).json({ error: 'total_hours must be a number between 0 and 24' });
  }

  db.prepare(`
    UPDATE hours_logs
    SET start_time = COALESCE(?, start_time),
        end_time = COALESCE(?, end_time),
        total_hours = ?,
        notes = COALESCE(?, notes),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(start_time || null, end_time || null, parsedHours, notes !== undefined ? notes : null, id);

  const updated = db.prepare('SELECT * FROM hours_logs WHERE id = ?').get(id);
  return res.json(updated);
});

module.exports = router;
