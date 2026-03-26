const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// GET /api/leaderboard
router.get('/', authenticate, (req, res) => {
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

  return res.json({ enabled: true, data: leaderboard, week_start: weekStart, week_end: today });
});

function getWeekStart(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date.toISOString().split('T')[0];
}

module.exports = router;
