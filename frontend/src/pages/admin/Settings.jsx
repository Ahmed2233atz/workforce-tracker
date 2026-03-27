import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import api from '../../api/axios.js'

export default function Settings() {
  const [settings, setSettings] = useState({
    daily_target_hours: '10',
    alert_threshold_hours: '6',
    report_time: '23:00',
    leaderboard_enabled: 'true',
    backfill_days: '2',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    api.get('/settings')
      .then((res) => setSettings(res.data))
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/settings', {
        daily_target_hours: parseFloat(settings.daily_target_hours),
        alert_threshold_hours: parseFloat(settings.alert_threshold_hours),
        report_time: settings.report_time,
        leaderboard_enabled: settings.leaderboard_enabled === 'true',
        backfill_days: parseInt(settings.backfill_days),
      })
      toast.success('Settings saved successfully')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleResetHours = async () => {
    if (!window.confirm('Are you sure you want to delete ALL hours logs? This cannot be undone.')) return
    setResetting(true)
    try {
      await api.delete('/settings/reset-hours')
      toast.success('All hours data has been reset successfully')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset data')
    } finally {
      setResetting(false)
    }
  }

  const handleResetAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL workers and hours data? Only admin accounts will remain. This cannot be undone.')) return
    if (!window.confirm('FINAL WARNING: This will permanently delete everything. Are you absolutely sure?')) return
    setResetting(true)
    try {
      await api.delete('/settings/reset-all')
      toast.success('All data has been reset. Only admin accounts remain.')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset data')
    } finally {
      setResetting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-32 rounded" />
        <div className="card skeleton h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6 fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Configure application behavior</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Application Settings */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 text-lg mb-1">Application Settings</h2>
          <p className="text-sm text-gray-500 mb-6">Configure work hours targets and system behavior</p>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="input-label">Daily Target Hours</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="24"
                    step="0.5"
                    className="input pr-12"
                    value={settings.daily_target_hours}
                    onChange={(e) => setSettings({ ...settings, daily_target_hours: e.target.value })}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">hours</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Number of hours required to be "on target"</p>
              </div>

              <div>
                <label className="input-label">Alert Threshold Hours</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    className="input pr-12"
                    value={settings.alert_threshold_hours}
                    onChange={(e) => setSettings({ ...settings, alert_threshold_hours: e.target.value })}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">hours</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Send alert when worker logs below this amount</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="input-label">Daily Report Time</label>
                <input
                  type="time"
                  className="input"
                  value={settings.report_time}
                  onChange={(e) => setSettings({ ...settings, report_time: e.target.value })}
                />
                <p className="text-xs text-gray-400 mt-1">When to send the automated daily report</p>
              </div>

              <div>
                <label className="input-label">Backfill Days Allowed</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    className="input pr-12"
                    value={settings.backfill_days}
                    onChange={(e) => setSettings({ ...settings, backfill_days: e.target.value })}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">days</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">How many past days workers can submit hours for</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <p className="font-medium text-gray-900">Enable Leaderboard</p>
                <p className="text-sm text-gray-500 mt-0.5">Show workers their weekly ranking relative to teammates</p>
              </div>
              <div
                className={`toggle cursor-pointer ${settings.leaderboard_enabled === 'true' ? 'bg-primary-600' : 'bg-gray-300'}`}
                onClick={() => setSettings({
                  ...settings,
                  leaderboard_enabled: settings.leaderboard_enabled === 'true' ? 'false' : 'true'
                })}
              >
                <span className={`toggle-thumb ${settings.leaderboard_enabled === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Email Configuration info */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 text-lg mb-1">Email Configuration</h2>
          <p className="text-sm text-gray-500 mb-4">SMTP settings are configured via environment variables</p>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3 text-sm">
            {[
              { key: 'SMTP_HOST', desc: 'Mail server hostname (e.g. smtp.gmail.com)' },
              { key: 'SMTP_PORT', desc: 'Mail server port (587 for TLS, 465 for SSL)' },
              { key: 'SMTP_USER', desc: 'Sender email address' },
              { key: 'SMTP_PASS', desc: 'Email password or app password' },
              { key: 'ADMIN_EMAIL', desc: 'Where daily/weekly reports are sent' },
            ].map(({ key, desc }) => (
              <div key={key} className="flex gap-3">
                <code className="font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs flex-shrink-0">{key}</code>
                <span className="text-gray-500">{desc}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
            <span>💡</span>
            <span>Edit <code className="font-mono">backend/.env</code> to configure email. Restart the server after changes.</span>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary px-8" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="card border-2 border-red-200 bg-red-50">
        <h2 className="font-semibold text-red-700 text-lg mb-1">⚠️ Danger Zone</h2>
        <p className="text-sm text-red-600 mb-6">These actions are permanent and cannot be undone.</p>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-red-200">
            <div>
              <p className="font-medium text-gray-900">Reset All Hours Data</p>
              <p className="text-sm text-gray-500 mt-0.5">Delete all logged hours for all workers. Worker accounts are kept.</p>
            </div>
            <button
              type="button"
              onClick={handleResetHours}
              disabled={resetting}
              className="btn px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {resetting ? 'Resetting...' : '🗑️ Reset Hours'}
            </button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-red-200">
            <div>
              <p className="font-medium text-gray-900">Reset Everything</p>
              <p className="text-sm text-gray-500 mt-0.5">Delete all workers and hours. Only admin accounts (Ahmed & Abdo) will remain.</p>
            </div>
            <button
              type="button"
              onClick={handleResetAll}
              disabled={resetting}
              className="btn px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {resetting ? 'Resetting...' : '💥 Reset Everything'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
