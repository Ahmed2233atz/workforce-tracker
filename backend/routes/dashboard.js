const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/dashboard/admin
router.get('/admin', authenticate, requireAdmin, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const weekStart = getWeekStart(today);
  const targetHours = parseFloat(
    (db.prepare("SELECT value FROM settings WHERE key = 'daily_target_hours'").get() || { value: '10' }).value
  );

  // Today's stats
  const allWorkers = db.prepare("SELECT id, name, department, team FROM users WHERE role = 'worker' AND is_active = 1").all();
  const todayLogs = db.prepare(`
    SELECT h.user_id, h.total_hours, h.start_time, h.end_time
    FROM hours_logs h
    WHERE h.date = ?
  `).all(today);

  const loggedToday = todayLogs.length;
  const notLogged = allWorkers.length - loggedToday;
  const incomplete = todayLogs.filter((l) => l.total_hours < targetHours).length;
  const onTarget = todayLogs.filter((l) => l.total_hours >= targetHours).length;
  const totalHoursToday = todayLogs.reduce((sum, l) => sum + l.total_hours, 0);

  // Workers status for today
  const workersStatus = allWorkers.map((w) => {
    const log = todayLogs.find((l) => l.user_id === w.id);
    let status = 'not_logged';
    if (log) {
      status = log.total_hours >= targetHours ? 'done' : 'incomplete';
    }
    return {
      ...w,
      today_hours: log ? log.total_hours : null,
      today_start: log ? log.start_time : null,
      today_end: log ? log.end_time : null,
      today_status: status,
    };
  });

  // Weekly summary: hours per day per worker
  const weekDays = getWeekDays(weekStart, today);
  const weeklyLogs = db.prepare(`
    SELECT h.user_id, h.date, h.total_hours
    FROM hours_logs h
    WHERE h.date >= ? AND h.date <= ?
  `).all(weekStart, today);

  const weeklySummary = allWorkers.map((w) => {
    const days = {};
    weekDays.forEach((d) => {
      const log = weeklyLogs.find((l) => l.user_id === w.id && l.date === d);
      days[d] = log ? log.total_hours : 0;
    });
    const total = Object.values(days).reduce((sum, h) => sum + h, 0);
    return { ...w, days, total_this_week: parseFloat(total.toFixed(1)) };
  });

  // Department stats for current week
  const deptStats = db.prepare(`
    SELECT u.department, SUM(h.total_hours) AS total_hours, COUNT(DISTINCT u.id) AS worker_count
    FROM hours_logs h
    JOIN users u ON u.id = h.user_id
    WHERE h.date >= ? AND h.date <= ? AND u.is_active = 1
    GROUP BY u.department
    ORDER BY total_hours DESC
  `).all(weekStart, today);

  // Daily totals for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  const dailyTotals = db.prepare(`
    SELECT date, SUM(total_hours) AS total_hours, COUNT(*) AS worker_count
    FROM hours_logs
    WHERE date >= ? AND date <= ?
    GROUP BY date
    ORDER BY date ASC
  `).all(thirtyDaysAgoStr, today);

  // Top performers this week
  const topPerformers = db.prepare(`
    SELECT u.id, u.name, u.department, u.team, SUM(h.total_hours) AS total_hours
    FROM hours_logs h
    JOIN users u ON u.id = h.user_id
    WHERE h.date >= ? AND h.date <= ? AND u.is_active = 1
    GROUP BY u.id
    ORDER BY total_hours DESC
    LIMIT 5
  `).all(weekStart, today);

  // Weekly invoice: all workers' hours this week × their department rate
  const HOURLY_RATES = {
    'Russian Data Annotator': 8,
    'Chinese Data Annotator': 8,
    'English Data Annotator': 5,
    'Egyptian English Data Annotator': 3,
  };
  const weeklyWorkerHours = db.prepare(`
    SELECT u.id, u.name, u.department, SUM(h.total_hours) AS total_hours
    FROM hours_logs h
    JOIN users u ON u.id = h.user_id
    WHERE h.date >= ? AND h.date <= ? AND u.is_active = 1
    GROUP BY u.id
  `).all(weekStart, today);
  const weeklyInvoiceTotal = weeklyWorkerHours.reduce((sum, w) => {
    const rate = HOURLY_RATES[w.department] || 0;
    return sum + (w.total_hours || 0) * rate;
  }, 0);

  return res.json({
    today_stats: {
      total_workers: allWorkers.length,
      logged_today: loggedToday,
      not_logged: notLogged,
      incomplete,
      on_target: onTarget,
      total_hours_today: parseFloat(totalHoursToday.toFixed(1)),
    },
    workers_status: workersStatus,
    weekly_summary: weeklySummary,
    department_stats: deptStats,
    daily_totals_last_30_days: dailyTotals,
    top_performers: topPerformers,
    weekly_invoice_total: parseFloat(weeklyInvoiceTotal.toFixed(2)),
  });
});

// GET /api/dashboard/worker
router.get('/worker', authenticate, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const weekStart = getWeekStart(today);
  const monthStart = today.substring(0, 7) + '-01';
  const targetHours = parseFloat(
    (db.prepare("SELECT value FROM settings WHERE key = 'daily_target_hours'").get() || { value: '10' }).value
  );
  const leaderboardEnabled =
    (db.prepare("SELECT value FROM settings WHERE key = 'leaderboard_enabled'").get() || { value: 'true' }).value === 'true';

  // Today's log
  const todayLog = db.prepare('SELECT * FROM hours_logs WHERE user_id = ? AND date = ?').get(req.user.id, today);

  // Streak
  const streak = calculateStreak(req.user.id, today, targetHours);

  // Weekly hours
  const weeklyHours = db.prepare(`
    SELECT COALESCE(SUM(total_hours), 0) AS total
    FROM hours_logs
    WHERE user_id = ? AND date >= ? AND date <= ?
  `).get(req.user.id, weekStart, today).total;

  // Count working days this week (Mon-today, excluding weekends)
  const weekDays = getWeekDays(weekStart, today);
  const workingDays = weekDays.filter((d) => {
    const dow = new Date(d).getDay();
    return dow !== 0 && dow !== 6;
  }).length;
  const weeklyTarget = targetHours * workingDays;

  // Monthly hours
  const monthlyHours = db.prepare(`
    SELECT COALESCE(SUM(total_hours), 0) AS total
    FROM hours_logs
    WHERE user_id = ? AND date >= ? AND date <= ?
  `).get(req.user.id, monthStart, today).total;

  // Recent logs (last 7 days)
  const recentLogs = db.prepare(`
    SELECT * FROM hours_logs
    WHERE user_id = ? AND date <= ?
    ORDER BY date DESC
    LIMIT 7
  `).all(req.user.id, today);

  // Weekly chart: Mon-Sun
  const allWeekDays = getFullWeekDays(weekStart);
  const weeklyLogs = db.prepare(`
    SELECT date, total_hours FROM hours_logs
    WHERE user_id = ? AND date >= ? AND date <= ?
  `).all(req.user.id, weekStart, allWeekDays[allWeekDays.length - 1]);

  const weeklyChart = allWeekDays.map((d) => {
    const log = weeklyLogs.find((l) => l.date === d);
    const dow = new Date(d).getDay();
    return {
      date: d,
      day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dow],
      hours: log ? log.total_hours : 0,
      target: targetHours,
      is_weekend: dow === 0 || dow === 6,
    };
  });

  // Rank (leaderboard)
  let rank = null;
  if (leaderboardEnabled) {
    const leaderboard = db.prepare(`
      SELECT u.id, COALESCE(SUM(h.total_hours), 0) AS total_hours
      FROM users u
      LEFT JOIN hours_logs h ON h.user_id = u.id AND h.date >= ? AND h.date <= ?
      WHERE u.role = 'worker' AND u.is_active = 1
      GROUP BY u.id
      ORDER BY total_hours DESC
    `).all(weekStart, today);

    const myRankIdx = leaderboard.findIndex((l) => l.id === req.user.id);
    rank = myRankIdx >= 0 ? myRankIdx + 1 : null;
  }

  return res.json({
    today: todayLog || null,
    streak,
    weekly_hours: parseFloat(weeklyHours.toFixed(1)),
    weekly_target: weeklyTarget,
    monthly_hours: parseFloat(monthlyHours.toFixed(1)),
    recent_logs: recentLogs,
    weekly_chart: weeklyChart,
    rank,
    target_hours: targetHours,
    leaderboard_enabled: leaderboardEnabled,
  });
});

// Helper functions
function getWeekStart(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date.toISOString().split('T')[0];
}

function getWeekDays(weekStart, upTo) {
  const days = [];
  const current = new Date(weekStart + 'T00:00:00');
  const end = new Date(upTo + 'T00:00:00');
  while (current <= end) {
    days.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return days;
}

function getFullWeekDays(weekStart) {
  const days = [];
  const current = new Date(weekStart + 'T00:00:00');
  for (let i = 0; i < 7; i++) {
    days.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return days;
}

function calculateStreak(userId, today, targetHours) {
  const logs = db.prepare(`
    SELECT date, total_hours FROM hours_logs
    WHERE user_id = ? AND date <= ?
    ORDER BY date DESC
    LIMIT 60
  `).all(userId, today);

  if (!logs.length) return 0;

  let streak = 0;
  let checkDate = new Date(today + 'T00:00:00');

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

  return streak;
}

module.exports = router;
