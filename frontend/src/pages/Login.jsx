import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext.jsx'

const demoAccounts = [
  { role: 'Admin', email: 'ahmed@company.com', password: 'admin123', color: 'indigo' },
  { role: 'Admin', email: 'abdo@company.com', password: 'admin123', color: 'indigo' },
  { role: 'Worker', email: 'alice@company.com', password: 'worker123', color: 'emerald' },
  { role: 'Worker', email: 'bob@company.com', password: 'worker123', color: 'blue' },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDemo, setShowDemo] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please enter email and password')
      return
    }
    setLoading(true)
    try {
      const user = await login(email, password)
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`)
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/worker/dashboard', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (account) => {
    setEmail(account.email)
    setPassword(account.password)
    setShowDemo(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-purple-900 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4 border border-white/20">
            <span className="text-3xl">⏱️</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">WorkForce Tracker</h1>
          <p className="mt-2 text-primary-200 text-sm">Employee hours management system</p>
        </div>

        {/* Login card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-primary-100 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-primary-300
                           focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-100 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-primary-300
                           focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 transition-all text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-white text-primary-900 font-semibold rounded-xl hover:bg-primary-50 transition-colors
                         focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-800
                         disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-6">
            <button
              onClick={() => setShowDemo(!showDemo)}
              className="w-full flex items-center justify-between text-sm text-primary-200 hover:text-white transition-colors py-2"
            >
              <span className="flex items-center gap-2">
                <span>🔑</span>
                <span>Demo accounts</span>
              </span>
              <span className="text-primary-300">{showDemo ? '▲' : '▼'}</span>
            </button>

            {showDemo && (
              <div className="mt-3 space-y-2 fade-in">
                {demoAccounts.map((account) => (
                  <button
                    key={account.email}
                    onClick={() => fillDemo(account)}
                    className="w-full flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-colors text-left"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`badge ${account.role === 'Admin' ? 'bg-primary-500/30 text-primary-100' : 'bg-green-500/30 text-green-100'}`}>
                          {account.role}
                        </span>
                      </div>
                      <p className="text-white text-xs mt-1">{account.email}</p>
                      <p className="text-primary-300 text-xs">{account.password}</p>
                    </div>
                    <span className="text-primary-300 text-xs">Click to fill →</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-primary-400 text-xs mt-6">
          WorkForce Tracker v1.0 — Internal use only
        </p>
      </div>
    </div>
  )
}
