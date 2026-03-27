const db = require('./db');
const bcrypt = require('bcryptjs');

console.log('🌱 Seeding database...');

// Clear existing data
db.exec('DELETE FROM hours_logs');
db.exec('DELETE FROM admin_notes');
db.exec('DELETE FROM users');
db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users', 'hours_logs', 'admin_notes')");

// Create admin users only
const adminHash = bcrypt.hashSync('01021851321', 10);
const insertUser = db.prepare(`
  INSERT INTO users (name, email, password_hash, role, department, team, is_active)
  VALUES (?, ?, ?, ?, ?, ?, 1)
`);

insertUser.run('Ahmed', 'Ahmed@One6.AI', adminHash, 'admin', 'Management', 'Leadership');
insertUser.run('Abdo', 'Abdo@One6.AI', adminHash, 'admin', 'Management', 'Leadership');

console.log('✅ Database seeded successfully!');
console.log('   - Ahmed (Ahmed@One6.AI / 01021851321)');
console.log('   - Abdo  (Abdo@One6.AI  / 01021851321)');
