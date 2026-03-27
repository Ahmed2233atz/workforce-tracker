const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const db       = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// ── Storage directory ────────────────────────────────────────────────────────
// Use same base dir as the database so avatars live on the persistent volume.
const dbPath    = process.env.DATABASE_PATH || path.join(__dirname, '..', 'workforce.db');
const avatarDir = path.join(path.dirname(dbPath), 'avatars');
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

// ── Multer config ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarDir),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase() || '.jpg';
    const name = `user-${req.targetUserId || req.user.id}-${Date.now()}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only image files are allowed (jpg, png, webp, gif)'));
  },
});

// ── Helper: serve an avatar file ─────────────────────────────────────────────
router.get('/:filename', (req, res) => {
  const file = path.join(avatarDir, path.basename(req.params.filename));
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Not found' });
  res.sendFile(file);
});

// ── Upload own avatar ─────────────────────────────────────────────────────────
router.post('/me', authenticate, (req, res, next) => {
  req.targetUserId = req.user.id;
  next();
}, upload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  // Delete old avatar file if it exists
  const old = db.prepare('SELECT avatar_url FROM users WHERE id = ?').get(req.user.id);
  if (old?.avatar_url) {
    const oldFile = path.join(avatarDir, path.basename(old.avatar_url));
    if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
  }

  const avatarUrl = `/api/avatars/${req.file.filename}`;
  db.prepare("UPDATE users SET avatar_url = ?, updated_at = datetime('now') WHERE id = ?")
    .run(avatarUrl, req.user.id);

  return res.json({ avatar_url: avatarUrl });
});

// ── Admin: upload avatar for a worker ────────────────────────────────────────
router.post('/worker/:id', authenticate, requireAdmin, (req, res, next) => {
  req.targetUserId = req.params.id;
  next();
}, upload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const workerId = req.params.id;

  // Delete old avatar
  const old = db.prepare('SELECT avatar_url FROM users WHERE id = ?').get(workerId);
  if (old?.avatar_url) {
    const oldFile = path.join(avatarDir, path.basename(old.avatar_url));
    if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
  }

  const avatarUrl = `/api/avatars/${req.file.filename}`;
  db.prepare("UPDATE users SET avatar_url = ?, updated_at = datetime('now') WHERE id = ?")
    .run(avatarUrl, workerId);

  return res.json({ avatar_url: avatarUrl });
});

// ── Admin: delete a worker's avatar ──────────────────────────────────────────
router.delete('/worker/:id', authenticate, requireAdmin, (req, res) => {
  const { id } = req.params;
  const row = db.prepare('SELECT avatar_url FROM users WHERE id = ?').get(id);
  if (row?.avatar_url) {
    const file = path.join(avatarDir, path.basename(row.avatar_url));
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
  db.prepare("UPDATE users SET avatar_url = NULL, updated_at = datetime('now') WHERE id = ?").run(id);
  return res.json({ message: 'Avatar removed' });
});

// ── Delete own avatar ─────────────────────────────────────────────────────────
router.delete('/me', authenticate, (req, res) => {
  const row = db.prepare('SELECT avatar_url FROM users WHERE id = ?').get(req.user.id);
  if (row?.avatar_url) {
    const file = path.join(avatarDir, path.basename(row.avatar_url));
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
  db.prepare("UPDATE users SET avatar_url = NULL, updated_at = datetime('now') WHERE id = ?")
    .run(req.user.id);
  return res.json({ message: 'Avatar removed' });
});

module.exports = router;
