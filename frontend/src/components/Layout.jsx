import { useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api/axios.js'
import Logo from './Logo.jsx'
import ChatWidget from './ChatWidget.jsx'
import Avatar from './Avatar.jsx'

const adminNav = [
  { to: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/admin/workers',   icon: '👥', label: 'Workers' },
  { to: '/admin/reports',   icon: '📈', label: 'Reports' },
  { to: '/admin/support',   icon: '💬', label: 'Support' },
  { to: '/admin/settings',  icon: '⚙️', label: 'Settings' },
]

const workerNav = [
  { to: '/worker/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/worker/log-hours', icon: '⏱️', label: 'Log Hours' },
  { to: '/worker/resources', icon: '📚', label: 'Resources' },
  { to: '/worker/login-info', icon: '🔐', label: 'Login Info' },
  { to: '/worker/upwork-guide', icon: '💼', label: 'Upwork Hours' },
  { to: '/worker/activity-guide', icon: '📊', label: 'Activity Guide' },
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

function ProfileModal({ user, onClose, onSaved, onAvatarChange }) {
  const [name, setName]         = useState(user?.name || '')
  const [email, setEmail]       = useState(user?.email || '')
  const [curPass, setCurPass]   = useState('')
  const [newPass, setNewPass]   = useState('')
  const [saving, setSaving]     = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview]   = useState(user?.avatar_url || null)
  const [error, setError]       = useState('')
  const fileRef = useRef()

  const handleAvatarClick = () => fileRef.current?.click()

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const form = new FormData()
      form.append('avatar', file)
      const res = await api.post('/avatars/me', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      onAvatarChange(res.data.avatar_url)
    } catch {
      setError('Failed to upload photo')
    } finally { setUploading(false) }
  }

  const handleDeleteAvatar = async () => {
    setUploading(true)
    try {
      await api.delete('/avatars/me')
      setPreview(null)
      onAvatarChange(null)
    } catch {
      setError('Failed to remove photo')
    } finally { setUploading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = { name, email }
      if (newPass) { payload.current_password = curPass; payload.new_password = newPass }
      const res = await api.put('/auth/profile', payload)
      onSaved(res.data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-gray-900">Edit Profile</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {/* Avatar upload */}
        <div className="flex flex-col items-center mb-5">
          <div className="relative cursor-pointer group" onClick={handleAvatarClick}>
            {preview
              ? <img src={preview} alt="avatar" className="w-20 h-20 rounded-full object-cover border-4 border-primary-100" />
              : <div className="w-20 h-20 rounded-full bg-primary-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-primary-100">
                  {(user?.name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
                </div>
            }
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-medium">{uploading ? '⏳' : '📷'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-xs text-gray-400">Click photo to change</p>
            {preview && (
              <button
                type="button"
                onClick={handleDeleteAvatar}
                disabled={uploading}
                className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
              >
                🗑 Remove
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@one6.ai" />
          </div>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Change Password (optional)</p>
            <div className="space-y-3">
              <input type="password" className="input" value={curPass} onChange={e => setCurPass(e.target.value)} placeholder="Current password" />
              <input type="password" className="input" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="New password (min 6 chars)" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Layout() {
  const { user, logout, updateUser } = useAuth()
  const [sidebarOpen, setSidebarOpen]     = useState(false)
  const [showProfile, setShowProfile]     = useState(false)
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
          <Logo size={36} />
          <div>
            <span className="text-white font-bold text-base tracking-tight">One 6.AI</span>
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
            {/* User badge — click to edit profile */}
            <button
              onClick={() => setShowProfile(true)}
              className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-100 transition-colors"
              title="Edit profile"
            >
              <Avatar name={user?.name} avatarUrl={user?.avatar_url} size={24} />
              <div className="text-sm">
                <span className="font-medium text-gray-700">{user?.name}</span>
                <span className="ml-2 text-xs text-gray-400 capitalize">{user?.role}</span>
              </div>
              <span className="text-gray-400 text-xs ml-1">✏️</span>
            </button>

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

      {/* Floating support chat — workers only */}
      {user?.role === 'worker' && <ChatWidget user={user} />}

      {/* Profile edit modal */}
      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onSaved={(updated) => { updateUser(updated); import('react-hot-toast').then(m => m.default.success('Profile updated!')) }}
          onAvatarChange={(url) => updateUser({ avatar_url: url })}
        />
      )}
    </div>
  )
}
