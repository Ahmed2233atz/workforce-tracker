const db = require('../db');
const { sendDailyReport, sendWeeklyReport } = require('./email');

const generateDailyReport = async (date) => {
  const reportDate = date || new Date().toISOString().split('T')[0];
  const targetHours = parseFloat(
    (db.prepare("SELECT value FROM settings WHERE key = 'daily_target_hours'").get() || { value: '10' }).value
  );

  const workers = db.prepare(
    "SELECT id, name, email, department, team FROM users WHERE role = 'worker' AND is_active = 1"
  ).all();

  const logs = db.prepare(
    'SELECT user_id, total_hours, start_time, end_time FROM hours_logs WHERE date = ?'
  ).all(reportDate);

  const workerResults = workers.map((w) => {
    const log = logs.find((l) => l.user_id === w.id);
    let status = 'not_logged';
    if (log) {
      status = log.total_hours >= targetHours ? 'completed' : 'incomplete';
    }
    return {
      ...w,
      total_hours: log ? log.total_hours : null,
      start_time: log ? log.start_time : null,
      end_time: log ? log.end_time : null,
      status,
    };
  });

  const completed = workerResults.filter((w) => w.status === 'completed').length;
  const incomplete = workerResults.filter((w) => w.status === 'incomplete').length;
  const not_logged = workerResults.filter((w) => w.status === 'not_logged').length;
  const total_hours = workerResults.reduce((sum, w) => sum + (w.total_hours || 0), 0);

  const content = {
    type: 'daily',
    date: reportDate,
    target_hours: targetHours,
    total_workers: workers.length,
    completed,
    incomplete,
    not_logged,
    total_hours: parseFloat(total_hours.toFixed(1)),
    workers: workerResults,
    generated_at: new Date().toISOString(),
  };

  // Save to DB (replace if exists for same date)
  const existing = db.prepare("SELECT id FROM reports WHERE type = 'daily' AND date = ?").get(reportDate);
  let reportId;

  if (existing) {
    db.prepare("UPDATE reports SET content = ?, created_at = datetime('now') WHERE id = ?").run(
      JSON.stringify(content),
      existing.id
    );
    reportId = existing.id;
  } else {
    const result = db.prepare(
      'INSERT INTO reports (type, date, content) VALUES (?, ?, ?)'
    ).run('daily', reportDate, JSON.stringify(content));
    reportId = result.lastInsertRowid;
  }

  // Send email
  try {
    await sendDailyReport(content);
  } catch (err) {
    console.error('Failed to send daily report email:', err.message);
  }

  return { id: reportId, ...content };
};

const generateWeeklyReport = async (date) => {
  const refDate = date || new Date().toISOString().split('T')[0];
  const weekStart = getWeekStart(refDate);
  const weekEnd = getWeekEnd(weekStart);
  const targetHours = parseFloat(
    (db.prepare("SELECT value FROM settings WHERE key = 'daily_target_hours'").get() || { value: '10' }).value
  );
  const weeklyTarget = targetHours * 5; // 5 working days

  const workerStats = db.prepare(`
    SELECT u.id, u.name, u.email, u.department, u.team,
           COALESCE(SUM(h.total_hours), 0) AS total_hours,
           COUNT(h.id) AS days_logged
    FROM users u
    LEFT JOIN hours_logs h ON h.user_id = u.id AND h.date >= ? AND h.date <= ?
    WHERE u.role = 'worker' AND u.is_active = 1
    GROUP BY u.id
    ORDER BY total_hours DESC
  `).all(weekStart, weekEnd);

  const total_hours = workerStats.reduce((sum, w) => sum + w.total_hours, 0);

  const workersWithTarget = workerStats.map((w) => ({
    ...w,
    total_hours: parseFloat(w.total_hours.toFixed(1)),
    target_achieved_pct: parseFloat(((w.total_hours / weeklyTarget) * 100).toFixed(1)),
  }));

  const content = {
    type: 'weekly',
    period: { start: weekStart, end: weekEnd },
    target_hours_per_day: targetHours,
    weekly_target: weeklyTarget,
    total_hours: parseFloat(total_hours.toFixed(1)),
    workers: workersWithTarget,
    generated_at: new Date().toISOString(),
  };

  const result = db.prepare(
    'INSERT INTO reports (type, date, content) VALUES (?, ?, ?)'
  ).run('weekly', refDate, JSON.stringify(content));

  try {
    await sendWeeklyReport(content);
  } catch (err) {
    console.error('Failed to send weekly report email:', err.message);
  }

  return { id: result.lastInsertRowid, ...content };
};

function getWeekStart(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date.toISOString().split('T')[0];
}

function getWeekEnd(weekStart) {
  const date = new Date(weekStart + 'T00:00:00');
  date.setDate(date.getDate() + 6);
  return date.toISOString().split('T')[0];
}

module.exports = { generateDailyReport, generateWeeklyReport };
