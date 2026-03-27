import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../api/axios.js'

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const departments = ['English Data Annotator', 'Russian Data Annotator', 'Egyptian English Data Annotator']

function WorkerForm({ form, setForm, errors, submitting, onSubmit, onCancel, isEdit = false }) {
  return (
    <form onSubmit={onSubmit}>
      <div className="modal-body space-y-4">
        <div>
          <label className="input-label">Full Name *</label>
          <input
            className={`input ${errors.name ? 'border-danger-400 focus:ring-danger-400' : ''}`}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Jane Smith"
          />
          {errors.name && <p className="text-danger-600 text-xs mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="input-label">Email Address *</label>
          <input
            type="email"
            className={`input ${errors.email ? 'border-danger-400 focus:ring-danger-400' : ''}`}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="jane@company.com"
          />
          {errors.email && <p className="text-danger-600 text-xs mt-1">{errors.email}</p>}
        </div>
        {!isEdit && (
          <div>
            <label className="input-label">Password *</label>
            <input
              type="password"
              className={`input ${errors.password ? 'border-danger-400 focus:ring-danger-400' : ''}`}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Minimum 6 characters"
            />
            {errors.password && <p className="text-danger-600 text-xs mt-1">{errors.password}</p>}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="input-label">Department</label>
            <select className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
              <option value="">Select...</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Team</label>
            <input className="input" value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })} placeholder="e.g. Frontend" />
          </div>
        </div>
        <div>
          <label className="input-label">Instructions (optional)</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Task instructions, guidelines, or notes for this worker..."
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
          />
          <p className="text-xs text-gray-400 mt-1">Workers will see this on their dashboard. A notification will be sent when updated.</p>
        </div>
        {!isEdit && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
            💡 After adding the worker, open their profile to add platform credentials (Hubstaff, etc.)
          </div>
        )}
      </div>
      <div className="modal-footer">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Worker'}
        </button>
      </div>
    </form>
  )
}

export default function Workers() {
  const navigate = useNavigate()
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [deptFilter, setDeptFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editWorker, setEditWorker] = useState(null)
  const [confirmDeactivate, setConfirmDeactivate] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '', team: '', instructions: '' })
  const [errors, setErrors] = useState({})

  const fetchWorkers = async () => {
    try {
      const res = await api.get('/workers')
      setWorkers(res.data)
    } catch {
      toast.error('Failed to load workers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchWorkers() }, [])

  const validate = (isEdit = false) => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email'
    if (!isEdit && !form.password) errs.password = 'Password is required'
    else if (!isEdit && form.password.length < 6) errs.password = 'Minimum 6 characters'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      await api.post('/workers', form)
      toast.success('Worker added successfully')
      setShowAddModal(false)
      setForm({ name: '', email: '', password: '', department: '', team: '', instructions: '' })
      fetchWorkers()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add worker')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    if (!validate(true)) return
    setSubmitting(true)
    try {
      await api.put(`/workers/${editWorker.id}`, {
        name: form.name,
        email: form.email,
        department: form.department,
        team: form.team,
        instructions: form.instructions,
      })
      toast.success('Worker updated successfully')
      setEditWorker(null)
      fetchWorkers()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update worker')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeactivate = async (worker) => {
    try {
      if (worker.is_active) {
        await api.delete(`/workers/${worker.id}`)
        toast.success(`${worker.name} deactivated`)
      } else {
        await api.put(`/workers/${worker.id}`, { is_active: true })
        toast.success(`${worker.name} reactivated`)
      }
      fetchWorkers()
    } catch {
      toast.error('Operation failed')
    } finally {
      setConfirmDeactivate(null)
    }
  }

  const openEdit = (w) => {
    setForm({ name: w.name, email: w.email, password: '', department: w.department || '', team: w.team || '', instructions: w.instructions || '' })
    setErrors({})
    setEditWorker(w)
  }

  const uniqueDepts = ['all', ...new Set(workers.map((w) => w.department).filter(Boolean))]

  const filtered = workers.filter((w) => {
    const matchSearch = !search || w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.email.toLowerCase().includes(search.toLowerCase()) ||
      (w.department || '').toLowerCase().includes(search.toLowerCase())
    const matchDept = deptFilter === 'all' || w.department === deptFilter
    const matchActive = showInactive ? true : w.is_active
    return matchSearch && matchDept && matchActive
  })

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workers</h1>
          <p className="text-gray-500 text-sm mt-0.5">{workers.filter(w => w.is_active).length} active workers</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm({ name: '', email: '', password: '', department: '', team: '', instructions: '' }); setErrors({}); setShowAddModal(true) }}>
          + Add Worker
        </button>
      </div>

      {/* Filters */}
      <div className="card py-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              className="input pl-9"
              placeholder="Search by name, email, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input w-auto" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            {uniqueDepts.map((d) => <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>)}
          </select>
          <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap text-sm text-gray-600">
            <div
              className={`toggle ${showInactive ? 'bg-primary-600' : 'bg-gray-300'}`}
              onClick={() => setShowInactive(!showInactive)}
            >
              <span className={`toggle-thumb ${showInactive ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
            Show inactive
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Worker</th>
                <th>Email</th>
                <th>Department / Team</th>
                <th>Today</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <div className="text-4xl mb-2">👤</div>
                    No workers found
                  </td>
                </tr>
              ) : (
                filtered.map((w) => (
                  <tr key={w.id} className={!w.is_active ? 'opacity-60' : ''}>
                    <td>
                      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(`/admin/workers/${w.id}`)}>
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-xs font-bold flex-shrink-0">
                          {w.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="font-medium text-gray-900 hover:text-primary-600">{w.name}</span>
                      </div>
                    </td>
                    <td className="text-gray-500 text-sm">{w.email}</td>
                    <td>
                      {w.department && <span className="text-gray-700 text-sm">{w.department}</span>}
                      {w.team && <span className="text-gray-400 text-xs block">{w.team}</span>}
                    </td>
                    <td>
                      {w.today_hours !== null ? (
                        <span className="font-medium text-gray-900">{w.today_hours}h</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td>
                      {w.is_active ? (
                        <span className="badge-active">● Active</span>
                      ) : (
                        <span className="badge-inactive">● Inactive</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          className="text-xs text-primary-600 hover:underline font-medium"
                          onClick={() => navigate(`/admin/workers/${w.id}`)}
                        >
                          View
                        </button>
                        <button
                          className="text-xs text-gray-600 hover:underline font-medium"
                          onClick={() => openEdit(w)}
                        >
                          Edit
                        </button>
                        <button
                          className={`text-xs font-medium hover:underline ${w.is_active ? 'text-danger-600' : 'text-success-600'}`}
                          onClick={() => setConfirmDeactivate(w)}
                        >
                          {w.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <Modal title="Add New Worker" onClose={() => setShowAddModal(false)}>
          <WorkerForm
            form={form} setForm={setForm} errors={errors}
            submitting={submitting} onSubmit={handleAdd}
            onCancel={() => setShowAddModal(false)}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {editWorker && (
        <Modal title={`Edit: ${editWorker.name}`} onClose={() => setEditWorker(null)}>
          <WorkerForm
            form={form} setForm={setForm} errors={errors}
            submitting={submitting} onSubmit={handleEdit}
            onCancel={() => setEditWorker(null)} isEdit
          />
        </Modal>
      )}

      {/* Deactivate Confirm */}
      {confirmDeactivate && (
        <div className="modal-backdrop">
          <div className="modal fade-in max-w-sm">
            <div className="modal-body text-center">
              <div className="text-4xl mb-3">{confirmDeactivate.is_active ? '⚠️' : '✅'}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {confirmDeactivate.is_active ? 'Deactivate' : 'Reactivate'} Worker?
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                {confirmDeactivate.is_active
                  ? `${confirmDeactivate.name} will no longer be able to log in.`
                  : `${confirmDeactivate.name} will regain access to the system.`}
              </p>
              <div className="flex gap-3 justify-center">
                <button className="btn-secondary" onClick={() => setConfirmDeactivate(null)}>Cancel</button>
                <button
                  className={confirmDeactivate.is_active ? 'btn-danger' : 'btn-success'}
                  onClick={() => handleDeactivate(confirmDeactivate)}
                >
                  {confirmDeactivate.is_active ? 'Deactivate' : 'Reactivate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
