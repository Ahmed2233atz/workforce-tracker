import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'
import api from '../../api/axios.js'

export default function LogHours() {
  const today = new Date().toISOString().split('T')[0]
  const LOW_HOURS_THRESHOLD = 8

  const [form, setForm] = useState({
    date: today,
    start_time: '09:00',
    end_time: '19:00',
    notes: '',
    total_hours: '',
    low_hours_reason: '',
  })
  const [manualHours, setManualHours] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [existingLog, setExistingLog] = useState(null)
  const [backfillDays, setBackfillDays] = useState(2)
  const [loadingLog, setLoadingLog] = useState(false)

  useEffect(() => {
    // Load backfill days setting
    api.get('/settings').then((res) => {
      setBackfillDays(parseInt(res.data.backfill_days || '2'))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    // Load existing log when date changes
    setLoadingLog(true)
    setExistingLog(null)
    setSubmitted(false)

    api.get('/hours', { params: { start_date: form.date, end_date: form.date } })
      .then((res) => {
        if (res.data.data.length > 0) {
          const log = res.data.data[0]
          setExistingLog(log)
          setForm((f) => ({
            ...f,
            start_time: log.start_time || '09:00',
            end_time: log.end_time || '19:00',
            notes: log.notes || '',
            total_hours: log.total_hours,
            low_hours_reason: log.low_hours_reason || '',
          }))
        }
      })
      .catch(() => {})
      .finally(() => setLoadingLog(false))
  }, [form.date])

  const calcHours = () => {
    if (!form.start_time || !form.end_time) return 0
    const [sh, sm] = form.start_time.split(':').map(Number)
    const [eh, em] = form.end_time.split(':').map(Number)
    const diff = (eh * 60 + em) - (sh * 60 + sm)
    return diff > 0 ? parseFloat((diff / 60).toFixed(1)) : 0
  }

  const autoHours = calcHours()
  const effectiveHours = manualHours ? parseFloat(form.total_hours) || 0 : autoHours

  const isBackfill = form.date < today
  const minDate = (() => {
    const d = new Date()
    d.setDate(d.getDate() - backfillDays)
    return d.toISOString().split('T')[0]
  })()

  const getDateOptions = () => {
    const options = []
    for (let i = 0; i <= backfillDays; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : format(d, 'EEEE, MMM d')
      options.push({ value: dateStr, label })
    }
    return options
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (effectiveHours <= 0) {
      toast.error('Total hours must be greater than 0')
      return
    }
    if (effectiveHours > 24) {
      toast.error('Total hours cannot exceed 24')
      return
    }
    if (effectiveHours > 0 && effectiveHours < LOW_HOURS_THRESHOLD && !form.low_hours_reason.trim()) {
      toast.error('Please explain why your hours are below 8h')
      document.getElementById('low-hours-reason')?.focus()
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        total_hours: effectiveHours,
        notes: form.notes,
        low_hours_reason: effectiveHours < LOW_HOURS_THRESHOLD ? form.low_hours_reason.trim() : '',
      }
      await api.post('/hours', payload)
      toast.success(existingLog ? 'Hours updated successfully!' : 'Hours logged successfully!')
      setSubmitted(true)
      setExistingLog({ ...payload })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to log hours')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 fade-in max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Log Hours</h1>
        <p className="text-gray-500 text-sm mt-0.5">Record your work hours for the day</p>
      </div>

      {/* Success state */}
      {submitted && (
        <div className="card bg-success-50 border-2 border-success-200 text-center py-8">
          <div className="text-5xl mb-3">✅</div>
          <h3 className="text-xl font-bold text-success-700">
            {effectiveHours}h logged for {form.date === today ? 'today' : format(parseISO(form.date), 'MMM d')}
          </h3>
          {isBackfill && <p className="text-sm text-success-600 mt-1">Pending admin approval</p>}
          <div className="flex gap-3 justify-center mt-4">
            <button className="btn-secondary" onClick={() => { setSubmitted(false); setForm({ ...form, date: today, start_time: '09:00', end_time: '19:00', notes: '' }) }}>
              Log Another Day
            </button>
          </div>
        </div>
      )}

      {!submitted && (
        <div className="card">
          {/* Date selector */}
          <div className="mb-6">
            <label className="input-label">Date</label>
            <div className="grid grid-cols-1 gap-2">
              {getDateOptions().map(({ value, label }) => (
                <label
                  key={value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    form.date === value
                      ? 'border-primary-400 bg-primary-50 ring-1 ring-primary-400'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="date"
                    value={value}
                    checked={form.date === value}
                    onChange={() => setForm({ ...form, date: value })}
                    className="text-primary-600"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">{label}</span>
                    <span className="text-gray-400 text-xs ml-2">{value}</span>
                  </div>
                  {value < today && <span className="badge-backfill">Backfill</span>}
                  {loadingLog && value === form.date && <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />}
                </label>
              ))}
            </div>
          </div>

          {/* Backfill warning */}
          {isBackfill && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">⚠️</span>
              <div>
                <p className="text-sm font-medium text-amber-800">Backfill Request</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  This is a backfill for <strong>{format(parseISO(form.date), 'MMMM d, yyyy')}</strong>.
                  It will be <strong>pending admin approval</strong> before it counts toward your stats.
                </p>
              </div>
            </div>
          )}

          {/* Existing log notice */}
          {existingLog && !loadingLog && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2">
              <span className="text-blue-500">ℹ️</span>
              <p className="text-sm text-blue-700">
                You already logged <strong>{existingLog.total_hours}h</strong> for this date.
                Submitting will overwrite the existing entry.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Mode toggle */}
            <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-gray-100 p-1 gap-1">
              <button
                type="button"
                onClick={() => setManualHours(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  !manualHours
                    ? 'bg-white shadow text-primary-700 border border-primary-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                ⏱ Start / End Time
              </button>
              <button
                type="button"
                onClick={() => setManualHours(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  manualHours
                    ? 'bg-white shadow text-primary-700 border border-primary-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                ✏️ Enter Hours Manually
              </button>
            </div>

            {/* Time pickers — shown only in time mode */}
            {!manualHours && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Start Time</label>
                  <input
                    type="time"
                    className="input text-lg py-3"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  />
                </div>
                <div>
                  <label className="input-label">End Time</label>
                  <input
                    type="time"
                    className="input text-lg py-3"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Manual hours input — shown only in manual mode */}
            {manualHours && (
              <div className="bg-primary-50 border border-primary-200 rounded-xl p-5">
                <label className="input-label mb-2">How many hours did you work?</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    className="input w-32 text-center text-2xl font-bold py-3"
                    value={form.total_hours}
                    onChange={(e) => setForm({ ...form, total_hours: e.target.value })}
                    placeholder="0"
                    autoFocus
                  />
                  <span className="text-gray-600 text-lg font-medium">hours</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">You can enter decimals, e.g. 7.5 for 7 hours 30 minutes</p>
              </div>
            )}

            {/* Total hours summary */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Total Hours</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-3xl font-bold ${effectiveHours >= 10 ? 'text-success-600' : effectiveHours >= 6 ? 'text-warning-600' : 'text-gray-600'}`}>
                  {effectiveHours || 0}
                </span>
                <span className="text-gray-500">hours</span>
                {effectiveHours >= 10 && <span className="badge-done">✓ On target!</span>}
                {effectiveHours > 0 && effectiveHours < 10 && (
                  <span className="text-xs text-gray-400">{(10 - effectiveHours).toFixed(1)}h to target</span>
                )}
              </div>
              <div className="mt-3 progress-bar">
                <div
                  className={`progress-fill ${effectiveHours >= 10 ? 'bg-success-500' : effectiveHours >= 6 ? 'bg-warning-500' : 'bg-danger-400'}`}
                  style={{ width: `${Math.min((effectiveHours / 10) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Low hours reason — required when < 8h */}
            {effectiveHours > 0 && effectiveHours < LOW_HOURS_THRESHOLD && (
              <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-amber-500 text-lg">⚠️</span>
                  <label htmlFor="low-hours-reason" className="font-semibold text-amber-800 text-sm">
                    Reason for low hours — <span className="text-red-500">Required</span>
                  </label>
                </div>
                <p className="text-xs text-amber-700">
                  You're logging <strong>{effectiveHours}h</strong>, which is below the 8-hour minimum.
                  Please explain why so your admin is informed.
                </p>
                <textarea
                  id="low-hours-reason"
                  required
                  className="input resize-none border-amber-300 focus:ring-amber-400 focus:border-amber-400 bg-white"
                  rows={3}
                  placeholder="e.g. Doctor's appointment, power outage, half-day leave, client cancelled meeting…"
                  value={form.low_hours_reason}
                  onChange={(e) => setForm({ ...form, low_hours_reason: e.target.value })}
                />
                {!form.low_hours_reason.trim() && (
                  <p className="text-xs text-red-500 font-medium">* This field is required before you can submit.</p>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="input-label">Notes (optional)</label>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="What did you work on? (e.g., Feature development, Code review, Bug fixes)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-4 text-base"
              disabled={
                submitting ||
                effectiveHours <= 0 ||
                (effectiveHours > 0 && effectiveHours < LOW_HOURS_THRESHOLD && !form.low_hours_reason.trim())
              }
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Logging...
                </span>
              ) : existingLog ? (
                `Update Hours (${effectiveHours}h)`
              ) : (
                `Log ${effectiveHours}h for ${form.date === today ? 'Today' : format(parseISO(form.date), 'MMM d')}`
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
