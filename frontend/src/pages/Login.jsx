import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from '../components/Logo.jsx'

/* ─── Animated network canvas background ─── */
function NetworkBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // --- Build a layered node network representing 1 → 1,000,000
    // Layer 0: 1 founder (center)
    // Layer 1: 6 nodes  (six zeros concept)
    // Layer 2: 18 nodes
    // Layer 3: 40 floating particles (the "million")

    const W = () => canvas.width
    const H = () => canvas.height
    const cx = () => W() / 2
    const cy = () => H() / 2

    const buildNodes = () => {
      const nodes = []

      // Layer 0 — founder
      nodes.push({ x: cx(), y: cy(), r: 6, layer: 0, opacity: 1, pulse: 0 })

      // Layer 1 — 6 zeros
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2
        const dist  = Math.min(W(), H()) * 0.18
        nodes.push({
          x: cx() + Math.cos(angle) * dist,
          y: cy() + Math.sin(angle) * dist,
          r: 3.5, layer: 1,
          angle, dist,
          opacity: 0.75, pulse: (i / 6) * Math.PI * 2,
        })
      }

      // Layer 2 — 18 mid nodes
      for (let i = 0; i < 18; i++) {
        const angle = (i / 18) * Math.PI * 2 + 0.3
        const dist  = Math.min(W(), H()) * 0.35
        nodes.push({
          x: cx() + Math.cos(angle) * dist,
          y: cy() + Math.sin(angle) * dist,
          r: 2, layer: 2,
          angle, dist,
          opacity: 0.45, pulse: (i / 18) * Math.PI * 2,
        })
      }

      // Layer 3 — 55 outer particles (the million)
      for (let i = 0; i < 55; i++) {
        const angle = Math.random() * Math.PI * 2
        const dist  = Math.min(W(), H()) * (0.45 + Math.random() * 0.22)
        nodes.push({
          x: cx() + Math.cos(angle) * dist,
          y: cy() + Math.sin(angle) * dist,
          r: 1.2, layer: 3,
          angle, dist,
          opacity: 0.25 + Math.random() * 0.2,
          pulse: Math.random() * Math.PI * 2,
          drift: (Math.random() - 0.5) * 0.0003,
        })
      }

      return nodes
    }

    let nodes = buildNodes()
    window.addEventListener('resize', () => { nodes = buildNodes() })

    let t = 0
    let raf

    const draw = () => {
      ctx.clearRect(0, 0, W(), H())

      // Background gradient
      const bg = ctx.createRadialGradient(cx(), cy(), 0, cx(), cy(), Math.max(W(), H()) * 0.8)
      bg.addColorStop(0,   '#1e1b4b')  // deep indigo centre
      bg.addColorStop(0.5, '#312e81')  // indigo mid
      bg.addColorStop(1,   '#4c1d95')  // purple edge
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W(), H())

      t += 0.008

      // Update outer particle drift
      nodes.forEach(n => {
        if (n.layer === 3 && n.drift) {
          n.angle += n.drift
          n.x = cx() + Math.cos(n.angle) * n.dist
          n.y = cy() + Math.sin(n.angle) * n.dist
        }
      })

      const founder   = nodes[0]
      const layer1    = nodes.slice(1, 7)
      const layer2    = nodes.slice(7, 25)
      const layer3    = nodes.slice(25)

      // Draw lines: founder → layer1
      layer1.forEach(n => {
        const flow = (Math.sin(t * 2 + n.pulse) + 1) / 2
        ctx.beginPath()
        ctx.moveTo(founder.x, founder.y)
        ctx.lineTo(n.x, n.y)
        ctx.strokeStyle = `rgba(139,92,246,${0.15 + flow * 0.3})`
        ctx.lineWidth = 1.2
        ctx.stroke()
      })

      // Draw lines: layer1 → nearest layer2 (3 each)
      layer1.forEach((l1, idx) => {
        const slice = layer2.slice(idx * 3, idx * 3 + 3)
        slice.forEach(l2 => {
          const flow = (Math.sin(t * 1.5 + l2.pulse) + 1) / 2
          ctx.beginPath()
          ctx.moveTo(l1.x, l1.y)
          ctx.lineTo(l2.x, l2.y)
          ctx.strokeStyle = `rgba(167,139,250,${0.08 + flow * 0.15})`
          ctx.lineWidth = 0.7
          ctx.stroke()
        })
      })

      // Draw faint lines to some layer3 particles
      layer3.forEach((l3, i) => {
        if (i % 3 !== 0) return
        const src = layer2[i % layer2.length]
        const flow = (Math.sin(t + l3.pulse) + 1) / 2
        ctx.beginPath()
        ctx.moveTo(src.x, src.y)
        ctx.lineTo(l3.x, l3.y)
        ctx.strokeStyle = `rgba(196,181,253,${0.04 + flow * 0.07})`
        ctx.lineWidth = 0.5
        ctx.stroke()
      })

      // Draw nodes
      nodes.forEach(n => {
        const pulse = Math.sin(t * 1.8 + n.pulse)
        const glow  = n.layer === 0 ? 18 : n.layer === 1 ? 10 : 5

        if (n.layer <= 1) {
          // Glow halo
          const halo = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glow)
          halo.addColorStop(0, `rgba(167,139,250,${0.35 + pulse * 0.15})`)
          halo.addColorStop(1, 'rgba(167,139,250,0)')
          ctx.beginPath()
          ctx.arc(n.x, n.y, glow, 0, Math.PI * 2)
          ctx.fillStyle = halo
          ctx.fill()
        }

        // Node dot
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r + (n.layer === 0 ? pulse * 1.5 : 0), 0, Math.PI * 2)
        const alpha = n.opacity * (0.8 + pulse * 0.2)
        ctx.fillStyle = n.layer === 0
          ? `rgba(255,255,255,${alpha})`
          : n.layer === 1
            ? `rgba(196,181,253,${alpha})`
            : `rgba(167,139,250,${alpha * 0.7})`
        ctx.fill()
      })

      // Founder pulse ring (expanding circle)
      const ringR   = ((t * 60) % 120)
      const ringAlpha = Math.max(0, 0.25 - ringR / 120 * 0.25)
      ctx.beginPath()
      ctx.arc(founder.x, founder.y, ringR, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(167,139,250,${ringAlpha})`
      ctx.lineWidth = 1
      ctx.stroke()

      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: 'block' }}
    />
  )
}

/* ─── Login page ─── */
export default function Login() {
  const { login }    = useAuth()
  const navigate     = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Please enter email and password'); return }
    setLoading(true)
    try {
      const user = await login(email, password)
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`)
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/worker/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">

      {/* Animated network background */}
      <NetworkBackground />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">

        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4 drop-shadow-2xl">
            <Logo size={72} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">One 6.AI</h1>
          <p className="mt-2 text-indigo-300 text-sm">Employee hours management system</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-indigo-100 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@one6.ai"
                autoComplete="email"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-indigo-400
                           focus:outline-none focus:ring-2 focus:ring-violet-400/60 focus:border-violet-400/60 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-indigo-100 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-indigo-400
                           focus:outline-none focus:ring-2 focus:ring-violet-400/60 focus:border-violet-400/60 transition-all text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-white text-indigo-900 font-semibold rounded-xl hover:bg-indigo-50 transition-colors
                         focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-800
                         disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-indigo-500 text-xs mt-6">
          One 6.AI — Internal use only
        </p>
      </div>
    </div>
  )
}
