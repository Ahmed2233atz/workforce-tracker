const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { generateDailyReport, generateWeeklyReport } = require('../services/reports');

// GET /api/reports - list all reports (admin)
router.get('/', authenticate, requireAdmin, (req, res) => {
  const reports = db.prepare('SELECT * FROM reports ORDER BY created_at DESC').all();
  const parsed = reports.map((r) => ({
    ...r,
    content: JSON.parse(r.content),
  }));
  return res.json(parsed);
});

// POST /api/reports/generate - generate report on demand (admin)
router.post('/generate', authenticate, requireAdmin, async (req, res) => {
  const { type, date } = req.body;

  if (!type || !['daily', 'weekly', 'monthly'].includes(type)) {
    return res.status(400).json({ error: 'Type must be daily, weekly, or monthly' });
  }

  try {
    let report;
    if (type === 'daily') {
      report = await generateDailyReport(date);
    } else if (type === 'weekly') {
      report = await generateWeeklyReport(date);
    } else {
      // Monthly: generate a daily report for each day of the month
      const targetDate = date || new Date().toISOString().split('T')[0];
      const monthStart = targetDate.substring(0, 7) + '-01';
      const monthEnd = targetDate;

      const monthlyLogs = db.prepare(`
        SELECT u.id, u.name, u.department, u.team,
               COUNT(*) AS days_logged,
               SUM(h.total_hours) AS total_hours,
               AVG(h.total_hours) AS avg_hours
        FROM hours_logs h
        JOIN users u ON u.id = h.user_id
        WHERE h.date >= ? AND h.date <= ? AND u.is_active = 1
        GROUP BY u.id
        ORDER BY total_hours DESC
      `).all(monthStart, monthEnd);

      const content = {
        type: 'monthly',
        period: { start: monthStart, end: monthEnd },
        workers: monthlyLogs,
        total_hours: monthlyLogs.reduce((s, w) => s + (w.total_hours || 0), 0),
        generated_at: new Date().toISOString(),
      };

      const result = db.prepare(
        'INSERT INTO reports (type, date, content) VALUES (?, ?, ?)'
      ).run('monthly', targetDate, JSON.stringify(content));

      report = { id: result.lastInsertRowid, ...content };
    }

    return res.json(report);
  } catch (err) {
    console.error('Report generation error:', err);
    return res.status(500).json({ error: 'Failed to generate report' });
  }
});

// GET /api/reports/export/csv - export CSV (admin)
router.get('/export/csv', authenticate, requireAdmin, (req, res) => {
  const { start_date, end_date, user_id } = req.query;

  let query = `
    SELECT h.date, u.name, u.email, u.department, u.team,
           h.start_time, h.end_time, h.total_hours, h.notes,
           h.is_backfill, h.backfill_approved
    FROM hours_logs h
    JOIN users u ON u.id = h.user_id
    WHERE 1=1
  `;
  const params = [];

  if (start_date) {
    query += ' AND h.date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND h.date <= ?';
    params.push(end_date);
  }
  if (user_id) {
    query += ' AND h.user_id = ?';
    params.push(user_id);
  }

  query += ' ORDER BY h.date DESC, u.name ASC';

  const rows = db.prepare(query).all(...params);

  const header = 'Date,Name,Email,Department,Team,Start Time,End Time,Total Hours,Notes,Is Backfill,Backfill Approved\n';
  const csvRows = rows.map((r) => {
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    return [
      escapeCsv(r.date),
      escapeCsv(r.name),
      escapeCsv(r.email),
      escapeCsv(r.department),
      escapeCsv(r.team),
      escapeCsv(r.start_time),
      escapeCsv(r.end_time),
      escapeCsv(r.total_hours),
      escapeCsv(r.notes),
      r.is_backfill ? 'Yes' : 'No',
      r.backfill_approved ? 'Yes' : 'No',
    ].join(',');
  });

  const csv = header + csvRows.join('\n');
  const filename = `hours-export-${start_date || 'all'}-to-${end_date || 'all'}.csv`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(csv);
});

// GET /api/reports/leaderboard - leaderboard for current week
router.get('/leaderboard', authenticate, (req, res) => {
  const leaderboardEnabled =
    (db.prepare("SELECT value FROM settings WHERE key = 'leaderboard_enabled'").get() || { value: 'true' }).value === 'true';

  if (!leaderboardEnabled) {
    return res.json({ enabled: false, data: [] });
  }

  const today = new Date().toISOString().split('T')[0];
  const weekStart = getWeekStart(today);

  const leaderboard = db.prepare(`
    SELECT u.id, u.name, u.department, u.team,
           COALESCE(SUM(h.total_hours), 0) AS total_hours,
           COUNT(h.id) AS days_logged
    FROM users u
    LEFT JOIN hours_logs h ON h.user_id = u.id AND h.date >= ? AND h.date <= ?
    WHERE u.role = 'worker' AND u.is_active = 1
    GROUP BY u.id
    ORDER BY total_hours DESC
  `).all(weekStart, today);

  return res.json({ enabled: true, data: leaderboard });
});

// GET /api/reports/:id - get specific report
router.get('/:id', authenticate, requireAdmin, (req, res) => {
  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  return res.json({ ...report, content: JSON.parse(report.content) });
});

function getWeekStart(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date.toISOString().split('T')[0];
}

module.exports = router;
