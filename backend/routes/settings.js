const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/settings - get all settings (authenticated users)
router.get('/', authenticate, (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return res.json(settings);
});

// PUT /api/settings - update settings (admin)
router.put('/', authenticate, requireAdmin, (req, res) => {
  const {
    daily_target_hours,
    alert_threshold_hours,
    report_time,
    leaderboard_enabled,
    backfill_days,
  } = req.body;

  const updateSetting = db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `);

  const updates = [];

  if (daily_target_hours !== undefined) {
    const val = parseFloat(daily_target_hours);
    if (isNaN(val) || val < 1 || val > 24) {
      return res.status(400).json({ error: 'daily_target_hours must be between 1 and 24' });
    }
    updateSetting.run('daily_target_hours', String(val));
    updates.push('daily_target_hours');
  }

  if (alert_threshold_hours !== undefined) {
    const val = parseFloat(alert_threshold_hours);
    if (isNaN(val) || val < 0 || val > 24) {
      return res.status(400).json({ error: 'alert_threshold_hours must be between 0 and 24' });
    }
    updateSetting.run('alert_threshold_hours', String(val));
    updates.push('alert_threshold_hours');
  }

  if (report_time !== undefined) {
    if (!/^\d{2}:\d{2}$/.test(report_time)) {
      return res.status(400).json({ error: 'report_time must be in HH:MM format' });
    }
    updateSetting.run('report_time', report_time);
    updates.push('report_time');
  }

  if (leaderboard_enabled !== undefined) {
    updateSetting.run('leaderboard_enabled', leaderboard_enabled ? 'true' : 'false');
    updates.push('leaderboard_enabled');
  }

  if (backfill_days !== undefined) {
    const val = parseInt(backfill_days);
    if (isNaN(val) || val < 0 || val > 30) {
      return res.status(400).json({ error: 'backfill_days must be between 0 and 30' });
    }
    updateSetting.run('backfill_days', String(val));
    updates.push('backfill_days');
  }

  // Return updated settings
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }

  return res.json({ message: 'Settings updated successfully', settings });
});

// DELETE /api/settings/reset-hours - delete all hours logs (admin only)
router.delete('/reset-hours', authenticate, requireAdmin, (req, res) => {
  db.exec('DELETE FROM hours_logs');
  return res.json({ message: 'All hours data has been reset successfully' });
});

// DELETE /api/settings/reset-all - delete all workers and hours (keep admins only)
router.delete('/reset-all', authenticate, requireAdmin, (req, res) => {
  db.exec('DELETE FROM hours_logs');
  db.exec('DELETE FROM admin_notes');
  db.prepare("DELETE FROM users WHERE role = 'worker'").run();
  return res.json({ message: 'All worker data and hours have been reset. Admin accounts remain.' });
});

module.exports = router;
