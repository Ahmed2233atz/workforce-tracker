const db = require('./db');
const bcrypt = require('bcryptjs');

console.log('🌱 Seeding database...');

// Clear existing data in correct order
db.exec('DELETE FROM hours_logs');
db.exec('DELETE FROM admin_notes');
db.exec('DELETE FROM users');

// Reset auto-increment
db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users', 'hours_logs', 'admin_notes')");

// Create admin users
const adminHash = bcrypt.hashSync('admin123', 10);
const insertUser = db.prepare(`
  INSERT INTO users (name, email, password_hash, role, department, team, is_active)
  VALUES (?, ?, ?, ?, ?, ?, 1)
`);

insertUser.run('Ahmed', 'ahmed@company.com', adminHash, 'admin', 'Management', 'Leadership');
insertUser.run('Abdo', 'abdo@company.com', adminHash, 'admin', 'Management', 'Leadership');

// Create workers
const workerHash = bcrypt.hashSync('worker123', 10);
const workers = [
  { name: 'Alice Johnson', email: 'alice@company.com', department: 'Engineering', team: 'Frontend' },
  { name: 'Bob Smith', email: 'bob@company.com', department: 'Engineering', team: 'Backend' },
  { name: 'Carol White', email: 'carol@company.com', department: 'Design', team: 'UI/UX' },
  { name: 'David Brown', email: 'david@company.com', department: 'Marketing', team: 'Growth' },
  { name: 'Eve Davis', email: 'eve@company.com', department: 'Engineering', team: 'DevOps' },
];

const workerIds = [];
for (const w of workers) {
  const result = insertUser.run(w.name, w.email, workerHash, 'worker', w.department, w.team);
  workerIds.push(result.lastInsertRowid);
}

// Seed 14 days of historical hours for each worker
const insertHours = db.prepare(`
  INSERT OR REPLACE INTO hours_logs (user_id, date, start_time, end_time, total_hours, notes, is_backfill, backfill_approved)
  VALUES (?, ?, ?, ?, ?, ?, 0, 1)
`);

const notesByDept = {
  Engineering: [
    'Feature development', 'Bug fixes', 'Code review', 'Sprint planning',
    'Refactoring', 'Unit testing', 'API integration', 'Performance optimization',
    'Documentation', 'Architecture discussion'
  ],
  Design: [
    'UI mockups', 'Design review', 'User research', 'Wireframing',
    'Prototype iteration', 'Design system updates', 'Component library', 'Accessibility audit'
  ],
  Marketing: [
    'Campaign planning', 'Campaign work', 'Content creation', 'Analytics review',
    'SEO optimization', 'Social media strategy', 'Market research', 'Email campaign'
  ],
  DevOps: [
    'CI/CD pipeline', 'Infrastructure setup', 'Monitoring setup', 'Deployment',
    'Security audit', 'Container orchestration', 'Log analysis', 'Backup configuration'
  ],
  Management: [
    'Team meetings', 'Performance reviews', 'Strategy planning', 'Stakeholder updates'
  ]
};

const getRandomNote = (department) => {
  const notes = notesByDept[department] || notesByDept['Engineering'];
  return notes[Math.floor(Math.random() * notes.length)];
};

const formatTime = (hour, minute) => {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const workerDetails = workers.map((w, i) => ({ ...w, id: workerIds[i] }));

for (const worker of workerDetails) {
  for (let daysAgo = 13; daysAgo >= 1; daysAgo--) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    // Skip weekends for realism
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    // 80% chance the worker logged hours on any given weekday
    const didLog = Math.random() < 0.80;
    if (!didLog) continue;

    // Determine hours type distribution:
    // 50% chance of hitting target (8-11 hours)
    // 30% chance of incomplete (5-7.5 hours)
    // 20% chance of very short (3-4.9 hours)
    const rand = Math.random();
    let totalHours;
    let startHour, startMin, endHour, endMin;

    if (rand < 0.50) {
      // On-target: 8-11 hours
      totalHours = parseFloat((8 + Math.random() * 3).toFixed(1));
      startHour = 8 + Math.floor(Math.random() * 2);
      startMin = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
      const totalMinutes = Math.round(totalHours * 60);
      const endTotalMinutes = startHour * 60 + startMin + totalMinutes;
      endHour = Math.floor(endTotalMinutes / 60);
      endMin = endTotalMinutes % 60;
    } else if (rand < 0.80) {
      // Incomplete: 5-7.5 hours
      totalHours = parseFloat((5 + Math.random() * 2.5).toFixed(1));
      startHour = 9 + Math.floor(Math.random() * 2);
      startMin = [0, 30][Math.floor(Math.random() * 2)];
      const totalMinutes = Math.round(totalHours * 60);
      const endTotalMinutes = startHour * 60 + startMin + totalMinutes;
      endHour = Math.floor(endTotalMinutes / 60);
      endMin = endTotalMinutes % 60;
    } else {
      // Short: 3-4.9 hours
      totalHours = parseFloat((3 + Math.random() * 1.9).toFixed(1));
      startHour = 10 + Math.floor(Math.random() * 2);
      startMin = [0, 30][Math.floor(Math.random() * 2)];
      const totalMinutes = Math.round(totalHours * 60);
      const endTotalMinutes = startHour * 60 + startMin + totalMinutes;
      endHour = Math.floor(endTotalMinutes / 60);
      endMin = endTotalMinutes % 60;
    }

    const dateStr = date.toISOString().split('T')[0];
    const startTime = formatTime(startHour, startMin);
    const endTime = formatTime(endHour, endMin);
    const note = getRandomNote(worker.department);

    insertHours.run(worker.id, dateStr, startTime, endTime, totalHours, note);
  }
}

// Add admin notes for each worker
const insertNote = db.prepare(`
  INSERT INTO admin_notes (worker_id, admin_id, note, type)
  VALUES (?, 1, ?, ?)
`);

const adminNotesData = [
  { note: 'Great performance this month, consistently meeting targets.', type: 'note' },
  { note: 'Please ensure hours are logged by end of day.', type: 'warning' },
  { note: 'Excellent collaboration with team, valuable contributor.', type: 'note' },
  { note: 'Hours fell below threshold for 3 consecutive days - please check in.', type: 'warning' },
  { note: 'Strong technical skills, nominated for team lead position.', type: 'note' },
  { note: 'Needs improvement in documentation practices.', type: 'note' },
  { note: 'Outstanding work on the Q1 project delivery.', type: 'note' },
  { note: 'Repeated late log submissions - please log hours same day.', type: 'warning' },
];

for (const workerId of workerIds) {
  // Assign 2-3 notes per worker
  const noteCount = 2 + Math.floor(Math.random() * 2);
  const shuffled = [...adminNotesData].sort(() => Math.random() - 0.5);
  for (let i = 0; i < noteCount; i++) {
    insertNote.run(workerId, shuffled[i].note, shuffled[i].type);
  }
}

console.log('✅ Database seeded successfully!');
console.log(`   - 2 admin users: ahmed@company.com, abdo@company.com (password: admin123)`);
console.log(`   - ${workers.length} workers (password: worker123)`);
console.log(`   - Historical hours data for last 14 days`);
console.log(`   - Admin notes for each worker`);
