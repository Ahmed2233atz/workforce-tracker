const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@company.com';

let transporter = null;

if (SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST || 'smtp.gmail.com',
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

const sendMail = async (to, subject, html) => {
  if (!transporter) {
    console.log(`[EMAIL FALLBACK] To: ${to}`);
    console.log(`[EMAIL FALLBACK] Subject: ${subject}`);
    console.log(`[EMAIL FALLBACK] Content: (HTML omitted for brevity)`);
    return;
  }
  try {
    await transporter.sendMail({
      from: `"WorkForce Tracker" <${SMTP_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('Email send error:', err.message);
  }
};

const sendDailyReport = async (reportData) => {
  const { date, completed, incomplete, not_logged, workers } = reportData;

  const workerRows = (workers || [])
    .map(
      (w) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;">${w.name}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;">${w.department || '-'}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;">${w.total_hours != null ? w.total_hours + 'h' : '-'}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;">
        <span style="color:${w.status === 'completed' ? '#16a34a' : w.status === 'incomplete' ? '#d97706' : '#dc2626'};">
          ${w.status === 'completed' ? 'Done' : w.status === 'incomplete' ? 'Incomplete' : 'Not Logged'}
        </span>
      </td>
    </tr>`
    )
    .join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#3730a3;color:white;padding:20px;border-radius:8px 8px 0 0;">
        <h2 style="margin:0;">Daily Hours Report - ${date}</h2>
      </div>
      <div style="background:#f9fafb;padding:20px;">
        <div style="display:flex;gap:16px;margin-bottom:20px;">
          <div style="background:white;padding:16px;border-radius:8px;flex:1;text-align:center;border-left:4px solid #16a34a;">
            <div style="font-size:28px;font-weight:bold;color:#16a34a;">${completed || 0}</div>
            <div style="color:#6b7280;">Completed</div>
          </div>
          <div style="background:white;padding:16px;border-radius:8px;flex:1;text-align:center;border-left:4px solid #d97706;">
            <div style="font-size:28px;font-weight:bold;color:#d97706;">${incomplete || 0}</div>
            <div style="color:#6b7280;">Incomplete</div>
          </div>
          <div style="background:white;padding:16px;border-radius:8px;flex:1;text-align:center;border-left:4px solid #dc2626;">
            <div style="font-size:28px;font-weight:bold;color:#dc2626;">${not_logged || 0}</div>
            <div style="color:#6b7280;">Not Logged</div>
          </div>
        </div>
        <table style="width:100%;background:white;border-radius:8px;border-collapse:collapse;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="padding:10px;text-align:left;">Name</th>
              <th style="padding:10px;text-align:left;">Department</th>
              <th style="padding:10px;text-align:left;">Hours</th>
              <th style="padding:10px;text-align:left;">Status</th>
            </tr>
          </thead>
          <tbody>${workerRows}</tbody>
        </table>
      </div>
      <div style="background:#e5e7eb;padding:12px;text-align:center;font-size:12px;color:#6b7280;border-radius:0 0 8px 8px;">
        WorkForce Tracker - Automated Daily Report
      </div>
    </div>
  `;

  await sendMail(ADMIN_EMAIL, `Daily Hours Report - ${date}`, html);
};

const sendWeeklyReport = async (reportData) => {
  const { period, workers, total_hours } = reportData;

  const workerRows = (workers || [])
    .map(
      (w) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;">${w.name}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;">${w.department || '-'}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;">${(w.total_hours || 0).toFixed(1)}h</td>
      <td style="padding:8px;border-bottom:1px solid #eee;">${w.days_logged || 0} days</td>
    </tr>`
    )
    .join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#3730a3;color:white;padding:20px;border-radius:8px 8px 0 0;">
        <h2 style="margin:0;">Weekly Hours Report</h2>
        <p style="margin:8px 0 0;opacity:0.8;">${period ? period.start + ' to ' + period.end : ''}</p>
      </div>
      <div style="background:#f9fafb;padding:20px;">
        <div style="background:white;padding:16px;border-radius:8px;text-align:center;margin-bottom:16px;">
          <div style="font-size:36px;font-weight:bold;color:#3730a3;">${(total_hours || 0).toFixed(1)}h</div>
          <div style="color:#6b7280;">Total Team Hours This Week</div>
        </div>
        <table style="width:100%;background:white;border-radius:8px;border-collapse:collapse;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="padding:10px;text-align:left;">Name</th>
              <th style="padding:10px;text-align:left;">Department</th>
              <th style="padding:10px;text-align:left;">Total Hours</th>
              <th style="padding:10px;text-align:left;">Days Logged</th>
            </tr>
          </thead>
          <tbody>${workerRows}</tbody>
        </table>
      </div>
      <div style="background:#e5e7eb;padding:12px;text-align:center;font-size:12px;color:#6b7280;border-radius:0 0 8px 8px;">
        WorkForce Tracker - Automated Weekly Report
      </div>
    </div>
  `;

  await sendMail(ADMIN_EMAIL, `Weekly Hours Report - ${period ? period.start + ' to ' + period.end : ''}`, html);
};

const sendThresholdAlert = async (worker, hours) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#dc2626;color:white;padding:20px;border-radius:8px 8px 0 0;">
        <h2 style="margin:0;">Hours Alert</h2>
      </div>
      <div style="background:#fef2f2;padding:20px;border-radius:0 0 8px 8px;">
        <p><strong>${worker.name}</strong> (${worker.department || 'N/A'}) has logged only <strong>${hours}h</strong> today, which is below the alert threshold.</p>
        <p>Email: ${worker.email}</p>
      </div>
    </div>
  `;
  await sendMail(ADMIN_EMAIL, `Hours Alert: ${worker.name} logged ${hours}h`, html);
};

const sendChatNotification = async (workerName, message) => {
  const html = `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:24px;border-radius:12px 12px 0 0;">
        <h2 style="color:white;margin:0;font-size:18px">💬 New Support Message</h2>
        <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px;">One 6.AI — Workforce Tracker</p>
      </div>
      <div style="background:#f9fafb;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
        <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">Message from:</p>
        <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#111827;">${workerName}</p>
        <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:16px;">
          <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">${message}</p>
        </div>
        <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">
          Open the app → <strong>Support</strong> page to reply.
        </p>
      </div>
    </div>
  `;
  await sendMail(ADMIN_EMAIL, `💬 Support message from ${workerName}`, html);
};

module.exports = { sendDailyReport, sendWeeklyReport, sendThresholdAlert, sendChatNotification };
