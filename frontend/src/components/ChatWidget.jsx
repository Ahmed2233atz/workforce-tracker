import { useState, useEffect, useRef } from 'react'
import api from '../api/axios.js'

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function ChatWidget({ user }) {
  const [open, setOpen]         = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [unread, setUnread]     = useState(0)
  const [sending, setSending]   = useState(false)
  const bottomRef               = useRef(null)
  const inputRef                = useRef(null)

  // Poll unread count when closed
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get('/chat/unread')
        setUnread(res.data.unread_count || 0)
      } catch {}
    }
    fetchUnread()
    const id = setInterval(fetchUnread, 15000)
    return () => clearInterval(id)
  }, [])

  // Poll messages when open
  useEffect(() => {
    if (!open) return
    const fetchMessages = async () => {
      try {
        const res = await api.get('/chat/messages')
        setMessages(res.data)
        setUnread(0)
      } catch {}
    }
    fetchMessages()
    const id = setInterval(fetchMessages, 8000)
    return () => clearInterval(id)
  }, [open])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const send = async (e) => {
    e.preventDefault()
    if (!input.trim() || sending) return
    setSending(true)
    try {
      await api.post('/chat/messages', { message: input.trim() })
      setInput('')
      const res = await api.get('/chat/messages')
      setMessages(res.data)
    } catch {}
    finally { setSending(false) }
  }

  // Group messages by date
  const grouped = []
  let lastDate = null
  messages.forEach(m => {
    const day = formatDate(m.created_at)
    if (day !== lastDate) {
      grouped.push({ type: 'divider', label: day, key: 'div-' + m.id })
      lastDate = day
    }
    grouped.push({ type: 'message', ...m })
  })

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">

      {/* Chat panel */}
      {open && (
        <div
          className="mb-3 flex flex-col rounded-2xl shadow-2xl border border-gray-200 overflow-hidden bg-white"
          style={{ width: 320, height: 460 }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-lg">💬</div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm leading-tight">Support Chat</p>
              <p className="text-indigo-200 text-xs">We'll reply as soon as possible</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/60 hover:text-white text-xl leading-none transition-colors"
            >✕</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 bg-gray-50">
            {grouped.length === 0 ? (
              <div className="text-center text-gray-400 text-sm mt-10">
                <div className="text-4xl mb-3">👋</div>
                <p className="font-medium text-gray-500">Hi, {user?.name?.split(' ')[0]}!</p>
                <p className="text-xs mt-1">Have a question? Send it here<br />and we'll get back to you.</p>
              </div>
            ) : (
              grouped.map(item =>
                item.type === 'divider' ? (
                  <div key={item.key} className="flex items-center gap-2 py-2">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 px-2">{item.label}</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                ) : (
                  <div
                    key={item.id}
                    className={`flex mb-1 ${item.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                      item.sender_id === user?.id
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                    }`}>
                      {item.sender_id !== user?.id && (
                        <p className="text-indigo-600 font-semibold text-xs mb-0.5">{item.sender_name}</p>
                      )}
                      <p className="leading-snug break-words">{item.message}</p>
                      <p className={`text-xs mt-1 text-right ${item.sender_id === user?.id ? 'text-indigo-200' : 'text-gray-400'}`}>
                        {formatTime(item.created_at)}
                      </p>
                    </div>
                  </div>
                )
              )
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={send} className="p-3 border-t border-gray-100 flex gap-2 bg-white">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5
                         focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl
                         w-10 flex items-center justify-center transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 rotate-90">
                <path d="M2 21L23 12 2 3v7l15 2-15 2z" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Floating bubble */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl
                    transition-all duration-200 hover:scale-110 active:scale-95 relative
                    ${open
                      ? 'bg-gray-700 hover:bg-gray-800'
                      : 'bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500'
                    }`}
      >
        <span className="transition-transform duration-200" style={{ transform: open ? 'rotate(45deg)' : 'none' }}>
          {open ? '✕' : '💬'}
        </span>
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full
                           text-white text-xs font-bold flex items-center justify-center px-1 shadow">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </div>
  )
}
