const db = require('./db');
const bcrypt = require('bcryptjs');

console.log('🌱 Seeding database...');

// Clear existing data
db.exec('DELETE FROM hours_logs');
db.exec('DELETE FROM admin_notes');
db.exec('DELETE FROM users');
db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users', 'hours_logs', 'admin_notes')");

// Create admin users only
const adminHash = bcrypt.hashSync('admin123', 10);
const insertUser = db.prepare(`
  INSERT INTO users (name, email, password_hash, role, department, team, is_active)
  VALUES (?, ?, ?, ?, ?, ?, 1)
`);

insertUser.run('Ahmed', 'ahmed@company.com', adminHash, 'admin', 'Management', 'Leadership');
insertUser.run('Abdo', 'abdo@company.com', adminHash, 'admin', 'Management', 'Leadership');

console.log('✅ Database seeded successfully!');
console.log('   - Ahmed (ahmed@company.com / admin123)');
console.log('   - Abdo  (abdo@company.com  / admin123)');
