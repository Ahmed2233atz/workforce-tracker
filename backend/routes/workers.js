const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// GET /api/workers - list all workers with today's hours summary
router.get('/', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const targetHours = parseFloat(
    (db.prepare("SELECT value FROM settings WHERE key = 'daily_target_hours'").get() || { value: '10' }).value
  );

  const workers = db.prepare(`
    SELECT
      u.id, u.name, u.email, u.department, u.team, u.role, u.is_active,
      u.created_at,
      h.total_hours AS today_hours,
      h.start_time AS today_start,
      h.end_time AS today_end
    FROM users u
    LEFT JOIN hours_logs h ON h.user_id = u.id AND h.date = ?
    WHERE u.role = 'worker'
    ORDER BY u.name ASC
  `).all(today);

  const result = workers.map((w) => {
    let today_status = 'not_logged';
    if (w.today_hours !== null) {
      today_status = w.today_hours >= targetHours ? 'done' : 'incomplete';
    }
    return { ...w, today_status };
  });

  return res.json(result);
});

// POST /api/workers - create a new worker
router.post('/', (req, res) => {
  const { name, email, password, department, team, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) {
    return res.status(409).json({ error: 'A user with this email already exists' });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const workerRole = role === 'admin' ? 'admin' : 'worker';

  const result = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, department, team, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `).run(name.trim(), email.toLowerCase().trim(), password_hash, workerRole, department || null, team || null);

  const newUser = db.prepare('SELECT id, name, email, role, department, team, is_active, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

  return res.status(201).json(newUser);
});

// GET /api/workers/:id - get single worker with stats
router.get('/:id', (req, res) => {
  const { id } = req.params;

  const worker = db.prepare('SELECT id, name, email, role, department, team, is_active, created_at FROM users WHERE id = ? AND role = ?').get(id, 'worker');
  if (!worker) {
    return res.status(404).json({ error: 'Worker not found' });
  }

  const today = new Date().toISOString().split('T')[0];
  const weekStart = getWeekStart(today);
  const monthStart = today.substring(0, 7) + '-01';

  const stats = db.prepare(`
    SELECT
      COUNT(*) AS total_logged_days,
      AVG(total_hours) AS avg_hours,
      SUM(CASE WHEN date >= ? AND date <= ? THEN total_hours ELSE 0 END) AS total_hours_this_week,
      SUM(CASE WHEN date >= ? AND date <= ? THEN total_hours ELSE 0 END) AS total_hours_this_month
    FROM hours_logs
    WHERE user_id = ?
  `).get(weekStart, today, monthStart, today, id);

  // Calculate streak
  const streak = calculateStreak(id, today);

  return res.json({
    ...worker,
    stats: {
      total_logged_days: stats.total_logged_days || 0,
      avg_hours: stats.avg_hours ? parseFloat(stats.avg_hours.toFixed(1)) : 0,
      streak,
      total_hours_this_week: parseFloat((stats.total_hours_this_week || 0).toFixed(1)),
      total_hours_this_month: parseFloat((stats.total_hours_this_month || 0).toFixed(1)),
    },
  });
});

// PUT /api/workers/:id - update worker
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, department, team, is_active } = req.body;

  const worker = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!worker) {
    return res.status(404).json({ error: 'Worker not found' });
  }

  if (email) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email.toLowerCase().trim(), id);
    if (existing) {
      return res.status(409).json({ error: 'Email already in use by another user' });
    }
  }

  db.prepare(`
    UPDATE users
    SET name = COALESCE(?, name),
        email = COALESCE(?, email),
        department = COALESCE(?, department),
        team = COALESCE(?, team),
        is_active = COALESCE(?, is_active),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(
    name ? name.trim() : null,
    email ? email.toLowerCase().trim() : null,
    department !== undefined ? department : null,
    team !== undefined ? team : null,
    is_active !== undefined ? (is_active ? 1 : 0) : null,
    id
  );

  const updated = db.prepare('SELECT id, name, email, role, department, team, is_active, created_at FROM users WHERE id = ?').get(id);
  return res.json(updated);
});

// DELETE /api/workers/:id - deactivate (soft delete)
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const worker = db.prepare('SELECT id FROM users WHERE id = ? AND role = ?').get(id, 'worker');
  if (!worker) {
    return res.status(404).json({ error: 'Worker not found' });
  }

  db.prepare("UPDATE users SET is_active = 0, updated_at = datetime('now') WHERE id = ?").run(id);
  return res.json({ message: 'Worker deactivated successfully' });
});

// GET /api/workers/:id/hours - paginated hours history
router.get('/:id/hours', (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20, start_date, end_date } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = 'WHERE user_id = ?';
  const params = [id];

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

// POST /api/workers/:id/notes - add admin note
router.post('/:id/notes', (req, res) => {
  const { id } = req.params;
  const { note, type = 'note' } = req.body;

  if (!note) {
    return res.status(400).json({ error: 'Note content is required' });
  }

  if (!['note', 'warning'].includes(type)) {
    return res.status(400).json({ error: 'Type must be note or warning' });
  }

  const worker = db.prepare('SELECT id FROM users WHERE id = ? AND role = ?').get(id, 'worker');
  if (!worker) {
    return res.status(404).json({ error: 'Worker not found' });
  }

  const result = db.prepare(`
    INSERT INTO admin_notes (worker_id, admin_id, note, type) VALUES (?, ?, ?, ?)
  `).run(id, req.user.id, note, type);

  const newNote = db.prepare(`
    SELECT n.*, u.name AS admin_name FROM admin_notes n
    JOIN users u ON u.id = n.admin_id
    WHERE n.id = ?
  `).get(result.lastInsertRowid);

  return res.status(201).json(newNote);
});

// GET /api/workers/:id/notes - get all notes for worker
router.get('/:id/notes', (req, res) => {
  const { id } = req.params;

  const notes = db.prepare(`
    SELECT n.*, u.name AS admin_name
    FROM admin_notes n
    JOIN users u ON u.id = n.admin_id
    WHERE n.worker_id = ?
    ORDER BY n.created_at DESC
  `).all(id);

  return res.json(notes);
});

// Helper: get start of current week (Monday)
function getWeekStart(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  date.setDate(date.getDate() + diff);
  return date.toISOString().split('T')[0];
}

// Helper: calculate streak for a worker
function calculateStreak(userId, today) {
  const targetHours = parseFloat(
    (db.prepare("SELECT value FROM settings WHERE key = 'daily_target_hours'").get() || { value: '10' }).value
  );

  const logs = db.prepare(`
    SELECT date, total_hours FROM hours_logs
    WHERE user_id = ? AND date <= ?
    ORDER BY date DESC
    LIMIT 60
  `).all(userId, today);

  if (!logs.length) return 0;

  let streak = 0;
  let checkDate = new Date(today);

  for (let i = 0; i < 60; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const dayOfWeek = checkDate.getDay();

    // Skip weekends
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

  return streak;
}

module.exports = router;
