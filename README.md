# WorkForce Tracker

A full-stack workforce hours tracking application for managing and monitoring employee work hours. Built with Node.js/Express (backend) and React/Vite (frontend).

## Features

- **Admin Dashboard**: Real-time overview of all workers, today's status, weekly performance charts, department stats, and activity heatmap
- **Worker Dashboard**: Personal progress tracking, streak counter, weekly chart, and leaderboard
- **Hours Logging**: Quick and easy time logging with start/end time picker and auto-calculated hours
- **Backfill System**: Workers can submit hours for past days (configurable) with admin approval workflow
- **Reports**: Daily, weekly, and monthly reports with CSV export
- **Leaderboard**: Optional weekly ranking to motivate workers
- **Admin Notes**: Admins can add notes and warnings to worker profiles
- **Email Notifications**: Automated daily/weekly reports via SMTP (optional)
- **JWT Authentication**: Secure login with 7-day tokens

## Prerequisites

- Node.js 18 or higher
- npm 9 or higher

## Setup Instructions

### 1. Clone or Download

```bash
git clone <repo-url>
cd workforce-tracker
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Copy the example environment file and configure it:

```bash
cp .env.example .env
# Edit .env with your settings (optional - defaults work out of the box)
```

Seed the database with sample data:

```bash
node seed.js
```

Start the backend server:

```bash
npm run dev       # Development (auto-reload)
# or
npm start         # Production
```

The API will be available at `http://localhost:3001`

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the App

Navigate to `http://localhost:5173` in your browser.

## Demo Accounts

| Role   | Email                  | Password   |
|--------|------------------------|------------|
| Admin  | admin@company.com      | admin123   |
| Worker | alice@company.com      | worker123  |
| Worker | bob@company.com        | worker123  |
| Worker | carol@company.com      | worker123  |
| Worker | david@company.com      | worker123  |
| Worker | eve@company.com        | worker123  |

## API Endpoints

| Method | Endpoint                         | Description                       |
|--------|----------------------------------|-----------------------------------|
| POST   | /api/auth/login                  | Login and receive JWT token       |
| GET    | /api/auth/me                     | Get current user info             |
| GET    | /api/dashboard/admin             | Admin dashboard data              |
| GET    | /api/dashboard/worker            | Worker dashboard data             |
| GET    | /api/workers                     | List all workers (admin)          |
| POST   | /api/workers                     | Create worker (admin)             |
| GET    | /api/workers/:id                 | Worker detail + stats (admin)     |
| PUT    | /api/workers/:id                 | Update worker (admin)             |
| GET    | /api/workers/:id/hours           | Worker hours history (admin)      |
| POST   | /api/workers/:id/notes           | Add note to worker (admin)        |
| POST   | /api/hours                       | Log hours (worker/admin)          |
| GET    | /api/hours                       | Get own hours history             |
| GET    | /api/hours/today                 | Get today's log                   |
| GET    | /api/hours/streak                | Get current streak                |
| GET    | /api/hours/pending-backfills     | List pending backfills (admin)    |
| PUT    | /api/hours/:id/approve           | Approve backfill (admin)          |
| GET    | /api/reports                     | List reports (admin)              |
| POST   | /api/reports/generate            | Generate report (admin)           |
| GET    | /api/reports/export/csv          | Export CSV (admin)                |
| GET    | /api/reports/leaderboard         | Get weekly leaderboard            |
| GET    | /api/settings                    | Get settings (admin)              |
| PUT    | /api/settings                    | Update settings (admin)           |

## Configuration

Edit `backend/.env` to configure the application:

```env
PORT=3001                          # API server port
JWT_SECRET=your-secret-key         # JWT signing secret (change in production!)
FRONTEND_URL=http://localhost:5173 # Frontend URL for CORS
SMTP_HOST=smtp.gmail.com           # Email server
SMTP_PORT=587                      # Email port
SMTP_USER=your-email@gmail.com     # Email address
SMTP_PASS=your-app-password        # Email password / app password
ADMIN_EMAIL=admin@company.com      # Where reports are sent
```

Email configuration is optional. If SMTP is not configured, reports are logged to the console instead.

## Application Settings (Admin Panel)

- **Daily Target Hours**: Hours required to be "on target" (default: 10)
- **Alert Threshold**: Hours below which an alert is sent (default: 6)
- **Report Time**: When to send automated daily reports (default: 23:00)
- **Backfill Days**: How many past days workers can submit hours for (default: 2)
- **Leaderboard**: Toggle weekly rankings visibility for workers

## Deployment Notes

### Backend
- Set `NODE_ENV=production` and a strong `JWT_SECRET`
- The SQLite database file (`workforce.db`) is created automatically in the backend directory
- For production, consider using a process manager like PM2: `pm2 start server.js`

### Frontend
```bash
cd frontend
npm run build
```
The `dist/` folder can be served by any static file server (Nginx, Vercel, Netlify, etc.). Configure your server to proxy `/api/*` requests to the backend.

### Nginx Example
```nginx
location /api {
    proxy_pass http://localhost:3001;
}
location / {
    root /path/to/frontend/dist;
    try_files $uri $uri/ /index.html;
}
```

## Tech Stack

- **Backend**: Node.js, Express, better-sqlite3, bcryptjs, jsonwebtoken, node-cron, nodemailer
- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, React Router v6, Axios, react-hot-toast, date-fns
