import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { useAuth } from '../../context/AuthContext.jsx'
import StatCard from '../../components/StatCard.jsx'
import api from '../../api/axios.js'

function StatusBadge({ status }) {
  if (status === 'done') return <span className="badge-done">✓ Done</span>
  if (status === 'incomplete') return <span className="badge-incomplete">◑ Incomplete</span>
  return <span className="badge-not-logged">○ Not Logged</span>
}

function SkeletonRow() {
  return (
    <tr>
      {[...Array(5)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-4 rounded w-24" />
        </td>
      ))}
    </tr>
  )
}

function getHoursColor(hours, target) {
  if (hours === null || hours === undefined) return 'bg-gray-100'
  if (hours >= target) return 'bg-primary-500'
  if (hours >= target * 0.6) return 'bg-primary-300'
  if (hours > 0) return 'bg-primary-100'
  return 'bg-gray-100'
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const TARGET = 10

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/dashboard/admin')
      setData(res.data)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const departments = data
    ? ['all', ...new Set(data.workers_status.map((w) => w.department).filter(Boolean))]
    : ['all']

  const filteredWorkers = data?.workers_status.filter((w) => {
    const deptMatch = deptFilter === 'all' || w.department === deptFilter
    const statusMatch = statusFilter === 'all' || w.today_status === statusFilter
    return deptMatch && statusMatch
  }) || []

  // Build chart data from weekly summary
  const chartData = data?.weekly_summary
    ?.slice(0, 6)
    .map((w) => {
      const entry = { name: w.name.split(' ')[0] }
      Object.entries(w.days || {}).forEach(([date, hours]) => {
        const dayLabel = format(parseISO(date), 'EEE')
        entry[dayLabel] = hours
      })
      return entry
    }) || []

  // Heatmap: last 30 days
  const heatmapData = data?.daily_totals_last_30_days || []
  const maxHours = Math.max(...heatmapData.map((d) => d.total_hours), 1)

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')} — Live workforce dashboard
          </p>
        </div>
        <button
          onClick={fetchData}
          className="btn-secondary text-sm self-start sm:self-auto"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Stats row */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton h-4 w-24 mb-3 rounded" />
              <div className="skeleton h-8 w-16 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Active Today"
            value={`${data?.today_stats.logged_today || 0}/${data?.today_stats.total_workers || 0}`}
            subtitle="workers logged hours"
            icon="👥"
            color="blue"
          />
          <StatCard
            title="Total Hours Today"
            value={`${data?.today_stats.total_hours_today || 0}h`}
            subtitle={`${data?.today_stats.on_target || 0} on target`}
            icon="⏱️"
            color="indigo"
          />
          <StatCard
            title="On Target"
            value={data?.today_stats.on_target || 0}
            subtitle={`≥ ${TARGET}h logged`}
            icon="✅"
            color="green"
          />
          <StatCard
            title="Needs Attention"
            value={(data?.today_stats.incomplete || 0) + (data?.today_stats.not_logged || 0)}
            subtitle={`${data?.today_stats.not_logged || 0} not logged, ${data?.today_stats.incomplete || 0} incomplete`}
            icon="⚠️"
            color="amber"
          />
          <StatCard
            title="Invoice Due (Week)"
            value={`$${(data?.weekly_invoice_total || 0).toFixed(2)}`}
            subtitle="Total payroll this week"
            icon="💵"
            color="emerald"
          />
        </div>
      )}

      {/* Worker status table */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="font-semibold text-gray-900 text-lg">Today's Worker Status</h2>
          <div className="flex flex-wrap gap-2">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="input text-sm w-auto py-1.5"
            >
              {departments.map((d) => (
                <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input text-sm w-auto py-1.5"
            >
              <option value="all">All Status</option>
              <option value="done">Done</option>
              <option value="incomplete">Incomplete</option>
              <option value="not_logged">Not Logged</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Worker</th>
                <th>Department</th>
                <th>Hours Today</th>
                <th>Status</th>
                <th>Time Range</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
              ) : filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">No workers match the filters</td>
                </tr>
              ) : (
                filteredWorkers.map((w) => (
                  <tr
                    key={w.id}
                    className={`cursor-pointer ${
                      w.today_status === 'not_logged' ? 'bg-danger-50/30' :
                      w.today_status === 'incomplete' ? 'bg-warning-50/30' : ''
                    }`}
                    onClick={() => navigate(`/admin/workers/${w.id}`)}
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-xs font-bold">
                          {w.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="font-medium text-gray-900">{w.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-gray-500">{w.department || '—'}</span>
                    </td>
                    <td>
                      {w.today_hours !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${w.today_hours >= TARGET ? 'bg-success-500' : 'bg-warning-500'}`}
                              style={{ width: `${Math.min((w.today_hours / TARGET) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="font-medium">{w.today_hours}h</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td><StatusBadge status={w.today_status} /></td>
                    <td className="text-gray-500 text-xs">
                      {w.today_start && w.today_end ? `${w.today_start} – ${w.today_end}` : '—'}
                    </td>
                    <td>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/workers/${w.id}`) }}
                        className="text-primary-600 hover:text-primary-800 text-xs font-medium hover:underline"
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly performance bar chart */}
        <div className="card lg:col-span-2">
          <h2 className="font-semibold text-gray-900 text-lg mb-4">This Week's Performance</h2>
          {loading ? (
            <div className="skeleton h-48 rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.weekly_summary?.map(w => ({
                name: w.name.split(' ')[0],
                hours: parseFloat(w.total_this_week.toFixed(1)),
                target: 50,
              }))} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(val) => [`${val}h`, '']} />
                <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: '50h target', position: 'right', fontSize: 10, fill: '#f59e0b' }} />
                <Bar dataKey="hours" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top performers */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 text-lg mb-4">🏆 Top Performers</h2>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton h-10 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {(data?.top_performers || []).map((w, idx) => (
                <div
                  key={w.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/admin/workers/${w.id}`)}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                    idx === 1 ? 'bg-gray-100 text-gray-600' :
                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-primary-50 text-primary-600'
                  }`}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{w.name}</p>
                    <p className="text-xs text-gray-400 truncate">{w.department}</p>
                  </div>
                  <span className="text-sm font-bold text-primary-600">{parseFloat(w.total_hours).toFixed(1)}h</span>
                </div>
              ))}
              {(!data?.top_performers?.length) && (
                <p className="text-sm text-gray-400 text-center py-4">No data yet this week</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Department stats */}
      {!loading && data?.department_stats?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 text-lg mb-4">Department Overview (This Week)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.department_stats.map((dept) => (
              <div key={dept.department} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-sm font-medium text-gray-600 truncate">{dept.department || 'Unknown'}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{parseFloat(dept.total_hours).toFixed(0)}h</p>
                <p className="text-xs text-gray-400 mt-0.5">{dept.worker_count} workers</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Heatmap */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 text-lg mb-1">Team Activity — Last 30 Days</h2>
        <p className="text-sm text-gray-400 mb-4">Total team hours per day</p>
        {loading ? (
          <div className="skeleton h-16 rounded-lg" />
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {heatmapData.map((day) => {
              const intensity = day.total_hours / maxHours
              let bgClass = 'bg-gray-100'
              if (intensity > 0.8) bgClass = 'bg-primary-700'
              else if (intensity > 0.6) bgClass = 'bg-primary-500'
              else if (intensity > 0.4) bgClass = 'bg-primary-400'
              else if (intensity > 0.2) bgClass = 'bg-primary-300'
              else if (intensity > 0) bgClass = 'bg-primary-100'

              return (
                <div
                  key={day.date}
                  title={`${day.date}: ${parseFloat(day.total_hours).toFixed(1)}h (${day.worker_count} workers)`}
                  className={`w-7 h-7 rounded ${bgClass} cursor-default transition-transform hover:scale-110 flex items-center justify-center`}
                >
                </div>
              )
            })}
          </div>
        )}
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
          <span>Less</span>
          {['bg-gray-100', 'bg-primary-100', 'bg-primary-300', 'bg-primary-500', 'bg-primary-700'].map((c) => (
            <div key={c} className={`w-4 h-4 rounded ${c}`} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  )
}
