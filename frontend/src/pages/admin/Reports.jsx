import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'
import api from '../../api/axios.js'

function ReportCard({ report, expanded, onToggle }) {
  const c = report.content
  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${expanded ? 'border-primary-300' : 'border-gray-200'}`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-4 text-left transition-colors ${expanded ? 'bg-primary-50' : 'hover:bg-gray-50'}`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">
            {report.type === 'daily' ? '📅' : report.type === 'weekly' ? '📆' : '🗓️'}
          </span>
          <div>
            <p className="font-semibold text-gray-900 capitalize">{report.type} Report</p>
            <p className="text-sm text-gray-500">{format(new Date(report.created_at), 'MMM d, yyyy h:mm a')}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {c.completed !== undefined && (
            <div className="hidden sm:flex gap-4 text-sm">
              <span className="text-success-600 font-medium">✓ {c.completed}</span>
              <span className="text-warning-600 font-medium">◑ {c.incomplete}</span>
              <span className="text-danger-600 font-medium">○ {c.not_logged}</span>
            </div>
          )}
          {c.total_hours !== undefined && (
            <span className="text-primary-700 font-semibold text-sm">{parseFloat(c.total_hours).toFixed(1)}h total</span>
          )}
          <span className="text-gray-400">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="p-4 border-t border-gray-100 bg-white">
          {c.workers && (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Worker</th>
                    <th>Department</th>
                    <th>Hours</th>
                    {c.days_logged !== undefined && <th>Days</th>}
                    {c.type === 'daily' && <th>Status</th>}
                  </tr>
                </thead>
                <tbody>
                  {c.workers.map((w) => (
                    <tr key={w.id}>
                      <td className="font-medium">{w.name}</td>
                      <td className="text-gray-500">{w.department || '—'}</td>
                      <td>
                        {w.total_hours !== null && w.total_hours !== undefined
                          ? <span className="font-medium">{parseFloat(w.total_hours).toFixed(1)}h</span>
                          : <span className="text-gray-400">—</span>}
                      </td>
                      {w.days_logged !== undefined && <td>{w.days_logged}</td>}
                      {c.type === 'daily' && (
                        <td>
                          {w.status === 'completed' ? <span className="badge-done">Done</span>
                            : w.status === 'incomplete' ? <span className="badge-incomplete">Incomplete</span>
                            : <span className="badge-not-logged">Not Logged</span>}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Reports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [typeFilter, setTypeFilter] = useState('all')
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [genForm, setGenForm] = useState({ type: 'daily', date: new Date().toISOString().split('T')[0] })
  const [generating, setGenerating] = useState(false)
  const [csvForm, setCsvForm] = useState({ start_date: '', end_date: '', user_id: '' })
  const [workers, setWorkers] = useState([])
  const [leaderboard, setLeaderboard] = useState({ enabled: true, data: [] })

  const fetchReports = async () => {
    try {
      const [rRes, wRes, lRes] = await Promise.all([
        api.get('/reports'),
        api.get('/workers'),
        api.get('/reports/leaderboard'),
      ])
      setReports(rRes.data)
      setWorkers(wRes.data)
      setLeaderboard(lRes.data)
    } catch {
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReports() }, [])

  const handleGenerate = async (e) => {
    e.preventDefault()
    setGenerating(true)
    try {
      await api.post('/reports/generate', genForm)
      toast.success('Report generated successfully')
      setShowGenerateModal(false)
      fetchReports()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate report')
    } finally {
      setGenerating(false)
    }
  }

  const handleExportCsv = () => {
    const params = new URLSearchParams()
    if (csvForm.start_date) params.append('start_date', csvForm.start_date)
    if (csvForm.end_date) params.append('end_date', csvForm.end_date)
    if (csvForm.user_id) params.append('user_id', csvForm.user_id)
    window.open(`/api/reports/export/csv?${params}`, '_blank')
  }

  const toggleLeaderboard = async () => {
    try {
      await api.put('/settings', { leaderboard_enabled: !leaderboard.enabled })
      setLeaderboard({ ...leaderboard, enabled: !leaderboard.enabled })
      toast.success(`Leaderboard ${leaderboard.enabled ? 'disabled' : 'enabled'}`)
    } catch {
      toast.error('Failed to update setting')
    }
  }

  const filtered = reports.filter((r) => typeFilter === 'all' || r.type === typeFilter)

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-0.5">{reports.length} reports generated</p>
        </div>
        <button className="btn-primary" onClick={() => setShowGenerateModal(true)}>
          + Generate Report
        </button>
      </div>

      {/* Export CSV card */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">📥 Export Hours Data (CSV)</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="input-label">Start Date</label>
            <input type="date" className="input w-auto" value={csvForm.start_date} onChange={(e) => setCsvForm({ ...csvForm, start_date: e.target.value })} />
          </div>
          <div>
            <label className="input-label">End Date</label>
            <input type="date" className="input w-auto" value={csvForm.end_date} onChange={(e) => setCsvForm({ ...csvForm, end_date: e.target.value })} />
          </div>
          <div>
            <label className="input-label">Worker (optional)</label>
            <select className="input w-auto" value={csvForm.user_id} onChange={(e) => setCsvForm({ ...csvForm, user_id: e.target.value })}>
              <option value="">All Workers</option>
              {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <button className="btn-success" onClick={handleExportCsv}>
            📥 Download CSV
          </button>
        </div>
      </div>

      {/* Leaderboard toggle */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">🏆 Worker Leaderboard</h2>
            <p className="text-sm text-gray-500 mt-0.5">When enabled, workers can see each other's weekly hours ranking</p>
          </div>
          <div
            className={`toggle cursor-pointer ${leaderboard.enabled ? 'bg-primary-600' : 'bg-gray-300'}`}
            onClick={toggleLeaderboard}
          >
            <span className={`toggle-thumb ${leaderboard.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </div>
        </div>

        {leaderboard.enabled && leaderboard.data.length > 0 && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-600 mb-3">This Week's Rankings</p>
            <div className="space-y-2">
              {leaderboard.data.map((w, i) => (
                <div key={w.id} className="flex items-center gap-3 py-2">
                  <span className="text-lg w-6 text-center">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{w.name}</span>
                      <span className="text-sm font-bold text-primary-700">{parseFloat(w.total_hours).toFixed(1)}h</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full"
                        style={{ width: `${Math.min((w.total_hours / 50) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reports list */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Report History</h2>
          <select className="input w-auto text-sm py-1.5" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All Types</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">📋</div>
            <p>No reports yet. Generate your first report above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <ReportCard
                key={r.id}
                report={r}
                expanded={expanded === r.id}
                onToggle={() => setExpanded(expanded === r.id ? null : r.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="modal-backdrop" onClick={() => setShowGenerateModal(false)}>
          <div className="modal fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-gray-900">Generate Report</h3>
              <button onClick={() => setShowGenerateModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleGenerate}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="input-label">Report Type</label>
                  <select className="input" value={genForm.type} onChange={(e) => setGenForm({ ...genForm, type: e.target.value })}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Date</label>
                  <input
                    type="date"
                    className="input"
                    value={genForm.date}
                    onChange={(e) => setGenForm({ ...genForm, date: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowGenerateModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={generating}>
                  {generating ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
