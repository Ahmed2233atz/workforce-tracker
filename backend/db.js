// Uses Node.js 22+ built-in sqlite (no native compilation needed)
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'workforce.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign keys for better performance and integrity
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'worker' CHECK(role IN ('admin', 'worker')),
    department TEXT,
    team TEXT,
    timezone TEXT DEFAULT 'UTC',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS hours_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    start_time TEXT,
    end_time TEXT,
    total_hours REAL NOT NULL,
    notes TEXT,
    is_backfill INTEGER NOT NULL DEFAULT 0,
    backfill_approved INTEGER NOT NULL DEFAULT 0,
    approved_by INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, date),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS admin_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_id INTEGER NOT NULL,
    admin_id INTEGER NOT NULL,
    note TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'note' CHECK(type IN ('note', 'warning')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (worker_id) REFERENCES users(id),
    FOREIGN KEY (admin_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('daily', 'weekly', 'monthly')),
    date TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Insert default settings
const defaultSettings = [
  ['daily_target_hours', '10'],
  ['alert_threshold_hours', '6'],
  ['report_time', '23:00'],
  ['leaderboard_enabled', 'true'],
  ['backfill_days', '2'],
];

const insertSetting = db.prepare(
  'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
);

for (const [key, value] of defaultSettings) {
  insertSetting.run(key, value);
}

module.exports = db;
