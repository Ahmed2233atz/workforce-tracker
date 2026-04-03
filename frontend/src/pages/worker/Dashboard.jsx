import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { useAuth } from '../../context/AuthContext.jsx'
import StatCard from '../../components/StatCard.jsx'
import api from '../../api/axios.js'

const HOURLY_RATES = {
  'Russian Data Annotator': 8,
  'Chinese Data Annotator': 8,
  'English Data Annotator': 5,
  'Egyptian English Data Annotator': 3,
}

export default function WorkerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [leaderboard, setLeaderboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchData = async () => {
    try {
      const [dRes, lRes, nRes] = await Promise.all([
        api.get('/dashboard/worker'),
        api.get('/reports/leaderboard'),
        api.get('/notifications'),
      ])
      setData(dRes.data)
      setLeaderboard(lRes.data)
      setNotifications(nRes.data.notifications || [])
      setUnreadCount(nRes.data.unread_count || 0)
    } catch {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllRead = async () => {
    await api.put('/notifications/read-all')
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })))
    setUnreadCount(0)
  }

  useEffect(() => { fetchData() }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="card skeleton h-24" />)}
        </div>
        <div className="card skeleton h-48" />
      </div>
    )
  }

  const today = data?.today
  const targetHours = data?.target_hours || 10
  const progressPct = today ? Math.min((today.total_hours / targetHours) * 100, 100) : 0
  const progressColor = !today ? 'bg-gray-300' : today.total_hours >= targetHours ? 'bg-success-500' : today.total_hours >= 6 ? 'bg-warning-500' : 'bg-danger-400'

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-6 fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting()}, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-gray-500 text-sm mt-0.5">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        {user?.worker_code && (
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2 flex-shrink-0">
            <span className="text-lg">🪪</span>
            <div>
              <p className="text-xs text-indigo-500 font-medium leading-tight">Your Worker ID</p>
              <p className="font-bold text-indigo-800 font-mono tracking-wider text-base leading-tight">{user.worker_code}</p>
            </div>
          </div>
        )}
      </div>

      {/* Notifications */}
      {notifications.filter(n => !n.is_read).length > 0 && (
        <div className="space-y-2">
          {notifications.filter(n => !n.is_read).map(n => (
            <div key={n.id} className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">🔔</span>
                <div>
                  <p className="font-semibold text-blue-900 text-sm">{n.title}</p>
                  <p className="text-blue-700 text-sm mt-0.5">{n.message}</p>
                </div>
              </div>
              <button
                onClick={() => markRead(n.id)}
                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 whitespace-nowrap font-medium"
              >
                ✓ Confirm
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Today's progress */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900 text-lg">Today's Progress</h2>
            <p className="text-sm text-gray-400">{format(new Date(), 'EEEE, MMMM d')}</p>
          </div>
          {today && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Start – End</p>
              <p className="text-sm font-medium text-gray-700">
                {today.start_time} – {today.end_time || '...'}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-end gap-4 mb-3">
          <div>
            <span className={`text-5xl font-bold ${today ? (today.total_hours >= targetHours ? 'text-success-600' : 'text-warning-600') : 'text-gray-300'}`}>
              {today ? today.total_hours : '0'}
            </span>
            <span className="text-2xl text-gray-400">/{targetHours}h</span>
          </div>
          {today?.total_hours >= targetHours && (
            <div className="mb-2">
              <span className="badge-done text-sm px-3 py-1">✓ Target reached!</span>
            </div>
          )}
        </div>

        <div className="progress-bar mb-2">
          <div className={`progress-fill ${progressColor}`} style={{ width: `${progressPct}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>0h</span>
          <span className="text-gray-500 font-medium">{progressPct.toFixed(0)}% of daily target</span>
          <span>{targetHours}h</span>
        </div>

        {today?.notes && (
          <div className="mt-3 bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
            📝 {today.notes}
          </div>
        )}
      </div>

      {/* Streak banner */}
      {data?.streak > 0 ? (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-3xl">🔥</span>
          <div>
            <p className="font-semibold text-orange-800">{data.streak} day streak! Keep it up!</p>
            <p className="text-sm text-orange-600">You've hit your daily target {data.streak} days in a row</p>
          </div>
        </div>
      ) : !today ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="font-medium text-blue-800">No hours logged yet today</p>
              <p className="text-sm text-blue-600">Log your hours below to start your streak</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="This Week"
          value={`${data?.weekly_hours || 0}h`}
          subtitle={`Target: ${data?.weekly_target || 0}h`}
          icon="📅"
          color="indigo"
        />
        <StatCard
          title="Current Streak"
          value={`${data?.streak || 0} days`}
          subtitle={data?.streak > 0 ? '🔥 Keep going!' : 'Start your streak!'}
          icon="⚡"
          color="amber"
        />
        <StatCard
          title="This Month"
          value={`${data?.monthly_hours || 0}h`}
          subtitle="Total logged hours"
          icon="📈"
          color="green"
        />
        <StatCard
          title="Weekly Earnings"
          value={`$${((data?.weekly_hours || 0) * (HOURLY_RATES[user?.department] || 0)).toFixed(2)}`}
          subtitle={HOURLY_RATES[user?.department] ? `$${HOURLY_RATES[user?.department]}/hr · ${user?.department}` : 'Rate not set for your project'}
          icon="💰"
          color="emerald"
        />
      </div>

{/* Personal Instructions */}
      {user?.instructions && (
        <div className="card border-l-4 border-l-primary-500">
          <h2 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span>📋</span> Your Instructions
          </h2>
          <p className="text-gray-700 text-sm whitespace-pre-wrap">{user.instructions}</p>
        </div>
      )}

      {/* Log hours shortcut */}
      <div className="flex justify-end">
        <button
          className="btn-primary text-sm"
          onClick={() => navigate('/worker/log-hours')}
        >
          {today ? '✏️ Update Today\'s Hours' : '⏱️ Log Today\'s Hours'}
        </button>
      </div>

      {/* Weekly chart */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">This Week</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data?.weekly_chart || []} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} domain={[0, Math.max(targetHours + 2, 12)]} />
            <Tooltip formatter={(val) => [`${val}h`, 'Hours']} />
            <ReferenceLine y={targetHours} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Target', position: 'right', fontSize: 10, fill: '#f59e0b' }} />
            <Bar dataKey="hours" radius={[4, 4, 0, 0]} maxBarSize={50}>
              {(data?.weekly_chart || []).map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.is_weekend ? '#e5e7eb' : entry.hours >= targetHours ? '#22c55e' : entry.hours > 0 ? '#f59e0b' : '#e5e7eb'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs text-gray-400 justify-end">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-success-500 inline-block" /> On target</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-warning-400 inline-block" /> Partial</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 inline-block" /> Not logged</span>
        </div>
      </div>

      {/* Recent history */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Recent History</h2>
        {!data?.recent_logs?.length ? (
          <p className="text-gray-400 text-sm text-center py-4">No history yet</p>
        ) : (
          <div className="space-y-2">
            {data.recent_logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{format(parseISO(log.date), 'EEE, MMM d')}</p>
                  <p className="text-xs text-gray-400">
                    {log.start_time && log.end_time ? `${log.start_time} – ${log.end_time}` : ''}
                    {log.notes && ` · ${log.notes}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${log.total_hours >= targetHours ? 'text-success-600' : log.total_hours >= 6 ? 'text-warning-600' : 'text-danger-500'}`}>
                    {log.total_hours}h
                  </span>
                  {log.total_hours >= targetHours
                    ? <span className="badge-done text-xs">Done</span>
                    : <span className="badge-incomplete text-xs">Partial</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leaderboard */}
      {leaderboard?.enabled && leaderboard.data.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-1">🏆 This Week's Leaderboard</h2>
          <p className="text-sm text-gray-400 mb-4">Weekly hours ranking</p>
          <div className="space-y-3">
            {leaderboard.data.map((w, i) => (
              <div
                key={w.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${w.id === user?.id ? 'bg-primary-50 border border-primary-200' : 'hover:bg-gray-50'}`}
              >
                <span className="text-lg w-8 text-center flex-shrink-0">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium truncate ${w.id === user?.id ? 'text-primary-700' : 'text-gray-800'}`}>
                      {w.name} {w.id === user?.id && <span className="text-xs text-primary-500">(you)</span>}
                    </p>
                  </div>
                  <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${w.id === user?.id ? 'bg-primary-500' : 'bg-gray-300'}`}
                      style={{ width: `${Math.min((w.total_hours / 50) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <span className={`font-bold text-sm flex-shrink-0 ${w.id === user?.id ? 'text-primary-700' : 'text-gray-700'}`}>
                  {parseFloat(w.total_hours).toFixed(1)}h
                </span>
              </div>
            ))}
          </div>
          {data?.rank && (
            <div className="mt-4 pt-3 border-t border-gray-100 text-sm text-gray-500 text-center">
              You are ranked <span className="font-bold text-primary-700">#{data.rank}</span> out of {leaderboard.data.length} workers this week
            </div>
          )}
        </div>
      )}
    </div>
  )
}
