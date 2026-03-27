import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api/axios.js'

const adminNav = [
  { to: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/admin/workers', icon: '👥', label: 'Workers' },
  { to: '/admin/reports', icon: '📈', label: 'Reports' },
  { to: '/admin/settings', icon: '⚙️', label: 'Settings' },
]

const workerNav = [
  { to: '/worker/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/worker/log-hours', icon: '⏱️', label: 'Log Hours' },
  { to: '/worker/resources', icon: '📚', label: 'Resources' },
  { to: '/worker/login-info', icon: '🔐', label: 'Login Info' },
]

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Layout() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navItems = user?.role === 'admin' ? adminNav : workerNav

  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifications, setNotifications] = useState([])
  useEffect(() => {
    if (user?.role !== 'worker') return
    const fetchNotifs = async () => {
      try {
        const res = await api.get('/notifications')
        setUnreadCount(res.data.unread_count || 0)
        setNotifications(res.data.notifications || [])
      } catch {}
    }
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 60000)
    return () => clearInterval(interval)
  }, [user])

  const markAllRead = async () => {
    await api.put('/notifications/read-all')
    setUnreadCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })))
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-slate-800 flex flex-col z-40
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:flex
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg">
            W
          </div>
          <div>
            <span className="text-white font-bold text-base tracking-tight">WorkForce</span>
            <span className="block text-slate-400 text-xs">
              {user?.role === 'admin' ? 'Admin Panel' : 'Employee Portal'}
            </span>
          </div>
          <button
            className="ml-auto lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Navigation
          </p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>


{/* User section at bottom */}
        <div className="px-3 py-4 border-t border-slate-700">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-700/50">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-slate-400 text-xs truncate">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Top navbar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center gap-4 sticky top-0 z-20 shadow-sm">
          {/* Hamburger */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Greeting */}
          <div className="flex-1 hidden sm:block">
            <p className="text-sm text-gray-500">
              {getGreeting()}, <span className="font-semibold text-gray-800">{user?.name?.split(' ')[0]}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* User badge */}
            <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
              <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {getInitials(user?.name)}
              </div>
              <div className="text-sm">
                <span className="font-medium text-gray-700">{user?.name}</span>
                <span className="ml-2 text-xs text-gray-400 capitalize">{user?.role}</span>
              </div>
            </div>

            {/* Notification bell (workers only) */}
            {user?.role === 'worker' && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifs && (
                  <div className="absolute right-0 top-10 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <span className="font-semibold text-gray-900 text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-primary-600 hover:underline">Mark all read</button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-6">No notifications</p>
                      ) : (
                        notifications.slice(0, 10).map(n => (
                          <div key={n.id} className={`px-4 py-3 border-b border-gray-50 ${!n.is_read ? 'bg-blue-50' : ''}`}>
                            <p className="text-sm font-medium text-gray-900">{n.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Logout */}
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
