// Load environment variables
const path = require('path');
try {
  require('fs').accessSync(path.join(__dirname, '.env'));
  const envContent = require('fs').readFileSync(path.join(__dirname, '.env'), 'utf8');
  envContent.split('\n').forEach((line) => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length && !process.env[key.trim()]) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  });
} catch (e) {
  // .env file not found - using defaults
}

const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { generateDailyReport, generateWeeklyReport } = require('./services/reports');

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    const allowed = [
      FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:5174',
    ].filter(Boolean);
    if (allowed.includes(origin) || FRONTEND_URL === '*') {
      return callback(null, true);
    }
    // In production allow all origins if FRONTEND_URL not set
    if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/workers', require('./routes/workers'));
app.use('/api/hours', require('./routes/hours'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/leaderboard', require('./routes/leaderboard'));

// Serve frontend static files in production
const frontendDist = path.join(__dirname, 'public');
if (require('fs').existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // For any non-API route, serve index.html (React SPA routing)
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Cron jobs
// Daily report at 11:00 PM
cron.schedule('0 23 * * *', async () => {
  console.log('[CRON] Generating daily report...');
  try {
    await generateDailyReport();
    console.log('[CRON] Daily report generated successfully');
  } catch (err) {
    console.error('[CRON] Daily report error:', err.message);
  }
});

// Weekly report every Sunday at 10:00 PM
cron.schedule('0 22 * * 0', async () => {
  console.log('[CRON] Generating weekly report...');
  try {
    await generateWeeklyReport();
    console.log('[CRON] Weekly report generated successfully');
  } catch (err) {
    console.error('[CRON] Weekly report error:', err.message);
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler (API routes only)
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ WorkForce Tracker API running on http://localhost:${PORT}`);
  console.log(`   Frontend URL: ${FRONTEND_URL}`);
});
