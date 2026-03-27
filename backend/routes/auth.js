const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (!user.is_active) {
    return res.status(403).json({ error: 'Account is deactivated. Contact your administrator.' });
  }

  const passwordMatch = bcrypt.compareSync(password, user.password_hash);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      team: user.team,
    },
  });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  return res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    department: req.user.department,
    team: req.user.team,
    timezone: req.user.timezone,
    is_active: req.user.is_active,
    created_at: req.user.created_at,
    instructions: req.user.instructions,
  });
});

// PUT /api/auth/profile — update own name / email / password
router.put('/profile', authenticate, (req, res) => {
  const { name, email, current_password, new_password } = req.body;

  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

  // Fetch full user row (middleware strips password_hash for security)
  const fullUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!fullUser) return res.status(404).json({ error: 'User not found' });

  // If changing password, verify current password first
  if (new_password) {
    if (!current_password) return res.status(400).json({ error: 'Current password is required to set a new password' });
    const ok = bcrypt.compareSync(current_password, fullUser.password_hash);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });
    if (new_password.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  // Check email uniqueness if changed
  const newEmail = email ? email.toLowerCase().trim() : fullUser.email;
  if (newEmail !== fullUser.email) {
    const clash = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(newEmail, req.user.id);
    if (clash) return res.status(409).json({ error: 'Email already in use' });
  }

  const newHash = new_password ? bcrypt.hashSync(new_password, 10) : fullUser.password_hash;

  db.prepare(`
    UPDATE users SET name = ?, email = ?, password_hash = ?, updated_at = datetime('now') WHERE id = ?
  `).run(name.trim(), newEmail, newHash, req.user.id);

  const updated = db.prepare('SELECT id, name, email, role, department, team FROM users WHERE id = ?').get(req.user.id);
  return res.json(updated);
});

// POST /api/auth/refresh
router.post('/refresh', authenticate, (req, res) => {
  const token = jwt.sign(
    { id: req.user.id, email: req.user.email, role: req.user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    token,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      department: req.user.department,
      team: req.user.team,
    },
  });
});

module.exports = router;
