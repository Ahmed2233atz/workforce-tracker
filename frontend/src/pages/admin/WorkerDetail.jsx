import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer
} from 'recharts'
import { format, parseISO } from 'date-fns'
import api from '../../api/axios.js'
import StatCard from '../../components/StatCard.jsx'
import Avatar from '../../components/Avatar.jsx'

const TABS = ['Hours History', 'Credentials', 'Notes & Warnings', 'Pending Backfills']

function WorkerAvatarUpload({ worker, onUploaded }) {
  const fileRef = useRef()
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('avatar', file)
      const res = await api.post(`/avatars/worker/${worker.id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      onUploaded(res.data.avatar_url)
      toast.success('Photo updated!')
    } catch { toast.error('Upload failed') }
    finally { setUploading(false) }
  }

  return (
    <div className="relative cursor-pointer group flex-shrink-0" onClick={() => fileRef.current?.click()} title="Click to change photo">
      <Avatar name={worker.name} avatarUrl={worker.avatar_url} size={64} className="rounded-2xl" />
      <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-white text-sm">{uploading ? '⏳' : '📷'}</span>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}

export default function WorkerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [worker, setWorker] = useState(null)
  const [hours, setHours] = useState({ data: [], total: 0, page: 1, total_pages: 1 })
  const [notes, setNotes] = useState([])
  const [backfills, setBackfills] = useState([])
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [noteForm, setNoteForm] = useState({ note: '', type: 'note' })
  const [addingNote, setAddingNote] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const [credentials, setCredentials] = useState([])
  const [credForm, setCredForm] = useState({ platform: '', username: '', password: '', notes: '' })
  const [editCred, setEditCred] = useState(null)
  const [savingCred, setSavingCred] = useState(false)
  const [showCredForm, setShowCredForm] = useState(false)
  const [showPasswords, setShowPasswords] = useState({})

  const fetchAll = async () => {
    try {
      const [wRes, hRes, nRes, bRes, cRes] = await Promise.all([
        api.get(`/workers/${id}`),
        api.get(`/workers/${id}/hours`, { params: { page, limit: 15, start_date: startDate || undefined, end_date: endDate || undefined } }),
        api.get(`/workers/${id}/notes`),
        api.get('/hours/pending-backfills'),
        api.get(`/workers/${id}/credentials`),
      ])
      setWorker(wRes.data)
      setHours(hRes.data)
      setNotes(nRes.data)
      setBackfills(bRes.data.filter((b) => b.user_id === parseInt(id)))
      setCredentials(cRes.data)
    } catch {
      toast.error('Failed to load worker data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [id, page, startDate, endDate])

  const handleAddNote = async (e) => {
    e.preventDefault()
    if (!noteForm.note.trim()) return
    setAddingNote(true)
    try {
      await api.post(`/workers/${id}/notes`, noteForm)
      toast.success('Note added')
      setNoteForm({ note: '', type: 'note' })
      const nRes = await api.get(`/workers/${id}/notes`)
      setNotes(nRes.data)
    } catch {
      toast.error('Failed to add note')
    } finally {
      setAddingNote(false)
    }
  }

  const handleApproveBackfill = async (logId) => {
    try {
      await api.put(`/hours/${logId}/approve`)
      toast.success('Backfill approved')
      fetchAll()
    } catch {
      toast.error('Failed to approve')
    }
  }

  const handleSaveCred = async (e) => {
    e.preventDefault()
    if (!credForm.platform.trim()) { toast.error('Platform name is required'); return }
    setSavingCred(true)
    try {
      if (editCred) {
        await api.put(`/workers/${id}/credentials/${editCred.id}`, credForm)
        toast.success('Credentials updated')
      } else {
        await api.post(`/workers/${id}/credentials`, credForm)
        toast.success('Credentials added')
      }
      setCredForm({ platform: '', username: '', password: '', notes: '' })
      setEditCred(null)
      setShowCredForm(false)
      const cRes = await api.get(`/workers/${id}/credentials`)
      setCredentials(cRes.data)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save credentials')
    } finally {
      setSavingCred(false)
    }
  }

  const handleDeleteCred = async (credId) => {
    if (!confirm('Delete these credentials?')) return
    await api.delete(`/workers/${id}/credentials/${credId}`)
    setCredentials(prev => prev.filter(c => c.id !== credId))
    toast.success('Credentials deleted')
  }

  const startEditCred = (cred) => {
    setCredForm({ platform: cred.platform, username: cred.username || '', password: cred.password || '', notes: cred.notes || '' })
    setEditCred(cred)
    setShowCredForm(true)
  }

  const exportCsv = () => {
    const params = new URLSearchParams({ user_id: id })
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    window.open(`/api/reports/export/csv?${params}`, '_blank')
  }

  // Build chart data: last 30 days
  const chartData = hours.data
    .slice(0, 30)
    .reverse()
    .map((h) => ({
      date: format(parseISO(h.date), 'MM/dd'),
      hours: h.total_hours,
      target: 10,
    }))

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="card skeleton h-32" />
        <div className="card skeleton h-64" />
      </div>
    )
  }

  if (!worker) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-400">Worker not found</p>
        <button className="btn-secondary mt-4" onClick={() => navigate('/admin/workers')}>Back to Workers</button>
      </div>
    )
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Back + header */}
      <div>
        <button onClick={() => navigate('/admin/workers')} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4">
          ← Back to Workers
        </button>

        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <WorkerAvatarUpload worker={worker} onUploaded={(url) => setWorker(w => ({ ...w, avatar_url: url }))} />
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{worker.name}</h1>
                {worker.is_active ? (
                  <span className="badge-active">● Active</span>
                ) : (
                  <span className="badge-inactive">● Inactive</span>
                )}
              </div>
              <p className="text-gray-500 text-sm mt-0.5">{worker.email}</p>
              <div className="flex gap-3 mt-2 flex-wrap">
                {worker.department && <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">{worker.department}</span>}
                {worker.team && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{worker.team}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Days Logged" value={worker.stats?.total_logged_days || 0} icon="📅" color="blue" />
        <StatCard title="Avg Hours/Day" value={`${worker.stats?.avg_hours || 0}h`} icon="⏱️" color="indigo" />
        <StatCard title="Current Streak" value={`${worker.stats?.streak || 0} days`} icon="🔥" color="amber" />
        <StatCard title="This Week" value={`${worker.stats?.total_hours_this_week || 0}h`} icon="📊" color="green" />
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Hours — Recent History</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 12]} />
              <Tooltip formatter={(val) => [`${val}h`, 'Hours']} />
              <ReferenceLine y={10} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Target', position: 'right', fontSize: 10, fill: '#f59e0b' }} />
              <Line type="monotone" dataKey="hours" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3, fill: '#4f46e5' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabs */}
      <div className="card p-0 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === i
                  ? 'border-primary-600 text-primary-600 bg-primary-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab}
              {i === 3 && backfills.length > 0 && (
                <span className="ml-1.5 bg-warning-500 text-white text-xs rounded-full px-1.5 py-0.5">{backfills.length}</span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Hours History */}
          {activeTab === 0 && (
            <div>
              <div className="flex flex-wrap gap-3 mb-4 items-end">
                <div>
                  <label className="input-label">Start Date</label>
                  <input type="date" className="input w-auto" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1) }} />
                </div>
                <div>
                  <label className="input-label">End Date</label>
                  <input type="date" className="input w-auto" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1) }} />
                </div>
                <button className="btn-secondary text-sm" onClick={exportCsv}>📥 Export CSV</button>
              </div>

              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Hours</th>
                      <th>Time Range</th>
                      <th>Notes</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hours.data.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-8 text-gray-400">No logs found</td></tr>
                    ) : (
                      hours.data.map((h) => (
                        <tr key={h.id}>
                          <td className="font-medium">{format(parseISO(h.date), 'EEE, MMM d yyyy')}</td>
                          <td>
                            <span className={`font-semibold ${h.total_hours >= 10 ? 'text-success-600' : h.total_hours >= 6 ? 'text-warning-600' : 'text-danger-600'}`}>
                              {h.total_hours}h
                            </span>
                          </td>
                          <td className="text-gray-500 text-sm">
                            {h.start_time && h.end_time ? `${h.start_time} – ${h.end_time}` : '—'}
                          </td>
                          <td className="text-sm max-w-xs">
                            {h.low_hours_reason && (
                              <span className="block text-amber-700 font-medium text-xs mb-0.5">
                                ⚠️ {h.low_hours_reason}
                              </span>
                            )}
                            <span className="text-gray-500 truncate block">{h.notes || (!h.low_hours_reason ? '—' : '')}</span>
                          </td>
                          <td>
                            {h.is_backfill ? (
                              h.backfill_approved ? <span className="badge-backfill">Backfill ✓</span> : <span className="badge bg-yellow-100 text-yellow-700">Pending</span>
                            ) : (
                              <span className="text-gray-400 text-xs">Regular</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {hours.total_pages > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                  <span>Page {hours.page} of {hours.total_pages} ({hours.total} total)</span>
                  <div className="flex gap-2">
                    <button className="btn-secondary py-1 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                    <button className="btn-secondary py-1 text-xs" disabled={page === hours.total_pages} onClick={() => setPage(p => p + 1)}>Next →</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Credentials */}
          {activeTab === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Platform login credentials visible to this worker.</p>
                <button
                  className="btn-primary text-sm"
                  onClick={() => { setCredForm({ platform: '', username: '', password: '', notes: '' }); setEditCred(null); setShowCredForm(!showCredForm) }}
                >
                  + Add Credentials
                </button>
              </div>

              {showCredForm && (
                <form onSubmit={handleSaveCred} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                  <h3 className="font-medium text-gray-900">{editCred ? 'Edit Credentials' : 'Add New Credentials'}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="input-label">Platform Name *</label>
                      <input className="input" placeholder="e.g. Hubstaff" value={credForm.platform} onChange={e => setCredForm({...credForm, platform: e.target.value})} />
                    </div>
                    <div>
                      <label className="input-label">Username / Email</label>
                      <input className="input" placeholder="login@example.com" value={credForm.username} onChange={e => setCredForm({...credForm, username: e.target.value})} />
                    </div>
                    <div>
                      <label className="input-label">Password</label>
                      <input className="input" placeholder="Password" value={credForm.password} onChange={e => setCredForm({...credForm, password: e.target.value})} />
                    </div>
                    <div>
                      <label className="input-label">Notes (optional)</label>
                      <input className="input" placeholder="e.g. Use desktop app only" value={credForm.notes} onChange={e => setCredForm({...credForm, notes: e.target.value})} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary text-sm" disabled={savingCred}>{savingCred ? 'Saving...' : editCred ? 'Save Changes' : 'Add'}</button>
                    <button type="button" className="btn-secondary text-sm" onClick={() => { setShowCredForm(false); setEditCred(null) }}>Cancel</button>
                  </div>
                </form>
              )}

              {credentials.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No credentials added yet. Click "+ Add Credentials" to start.</p>
              ) : (
                <div className="space-y-3">
                  {credentials.map(cred => (
                    <div key={cred.id} className="border border-gray-200 rounded-xl p-4 bg-white">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 text-base">🔐 {cred.platform}</span>
                          </div>
                          {cred.username && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-500 w-20">Username:</span>
                              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-800">{cred.username}</span>
                            </div>
                          )}
                          {cred.password && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-500 w-20">Password:</span>
                              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-800">
                                {showPasswords[cred.id] ? cred.password : '••••••••'}
                              </span>
                              <button
                                type="button"
                                className="text-xs text-primary-600 hover:underline"
                                onClick={() => setShowPasswords(prev => ({...prev, [cred.id]: !prev[cred.id]}))}
                              >
                                {showPasswords[cred.id] ? 'Hide' : 'Show'}
                              </button>
                            </div>
                          )}
                          {cred.notes && <p className="text-xs text-gray-400 italic">{cred.notes}</p>}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button className="text-xs text-primary-600 hover:underline font-medium" onClick={() => startEditCred(cred)}>Edit</button>
                          <button className="text-xs text-danger-600 hover:underline font-medium" onClick={() => handleDeleteCred(cred.id)}>Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes & Warnings */}
          {activeTab === 2 && (
            <div>
              <form onSubmit={handleAddNote} className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3">Add Note or Warning</h3>
                <div className="flex gap-3 mb-3">
                  <label className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${noteForm.type === 'note' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                    <input type="radio" value="note" checked={noteForm.type === 'note'} onChange={(e) => setNoteForm({ ...noteForm, type: e.target.value })} className="hidden" />
                    📝 Note
                  </label>
                  <label className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${noteForm.type === 'warning' ? 'bg-warning-50 border-warning-300 text-warning-700' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                    <input type="radio" value="warning" checked={noteForm.type === 'warning'} onChange={(e) => setNoteForm({ ...noteForm, type: e.target.value })} className="hidden" />
                    ⚠️ Warning
                  </label>
                </div>
                <textarea
                  className="input resize-none"
                  rows={2}
                  placeholder="Enter note..."
                  value={noteForm.note}
                  onChange={(e) => setNoteForm({ ...noteForm, note: e.target.value })}
                />
                <button type="submit" className="btn-primary mt-2 text-sm" disabled={addingNote || !noteForm.note.trim()}>
                  {addingNote ? 'Adding...' : 'Add Note'}
                </button>
              </form>

              <div className="space-y-3">
                {notes.length === 0 ? (
                  <p className="text-gray-400 text-center py-6">No notes yet</p>
                ) : (
                  notes.map((n) => (
                    <div key={n.id} className={`p-4 rounded-xl border ${n.type === 'warning' ? 'bg-warning-50 border-warning-200' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`text-sm font-medium ${n.type === 'warning' ? 'text-warning-800' : 'text-blue-800'}`}>{n.note}</p>
                          <p className="text-xs text-gray-400 mt-1">By {n.admin_name} · {format(new Date(n.created_at), 'MMM d, yyyy')}</p>
                        </div>
                        {n.type === 'warning' ? <span className="badge-warning flex-shrink-0">⚠️ Warning</span> : <span className="badge-note flex-shrink-0">📝 Note</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Pending Backfills */}
          {activeTab === 3 && (
            <div>
              {backfills.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No pending backfill requests</p>
              ) : (
                <div className="space-y-3">
                  {backfills.map((b) => (
                    <div key={b.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <div>
                        <p className="font-medium text-gray-900">{format(parseISO(b.date), 'EEEE, MMMM d yyyy')}</p>
                        <p className="text-sm text-gray-500">{b.total_hours}h · {b.start_time && b.end_time ? `${b.start_time} – ${b.end_time}` : 'No time range'}</p>
                        {b.notes && <p className="text-xs text-gray-400 mt-0.5">{b.notes}</p>}
                      </div>
                      <button
                        className="btn-success text-sm"
                        onClick={() => handleApproveBackfill(b.id)}
                      >
                        ✓ Approve
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
