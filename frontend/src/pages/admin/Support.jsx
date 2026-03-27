import { useState, useEffect, useRef } from 'react'
import api from '../../api/axios.js'
import toast from 'react-hot-toast'

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

function timeAgo(ts) {
  if (!ts) return ''
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return formatDate(ts)
}

export default function Support() {
  const [conversations, setConversations] = useState([])
  const [selected, setSelected]           = useState(null)
  const [messages, setMessages]           = useState([])
  const [input, setInput]                 = useState('')
  const [sending, setSending]             = useState(false)
  const [loading, setLoading]             = useState(true)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  const fetchConversations = async () => {
    try {
      const res = await api.get('/chat/conversations')
      setConversations(res.data)
    } catch { toast.error('Failed to load conversations') }
    finally { setLoading(false) }
  }

  const fetchMessages = async (workerId) => {
    try {
      const res = await api.get(`/chat/conversations/${workerId}`)
      setMessages(res.data)
      // Refresh list to clear unread
      fetchConversations()
    } catch {}
  }

  useEffect(() => {
    fetchConversations()
    const id = setInterval(fetchConversations, 10000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!selected) return
    fetchMessages(selected.worker_id)
    const id = setInterval(() => fetchMessages(selected.worker_id), 8000)
    return () => clearInterval(id)
  }, [selected?.worker_id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const selectConversation = (c) => {
    setSelected(c)
    setMessages([])
    setInput('')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const send = async (e) => {
    e.preventDefault()
    if (!input.trim() || !selected || sending) return
    setSending(true)
    try {
      await api.post(`/chat/reply/${selected.worker_id}`, { message: input.trim() })
      setInput('')
      fetchMessages(selected.worker_id)
    } catch { toast.error('Failed to send') }
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

  const totalUnread = conversations.reduce((s, c) => s + (c.unread_count || 0), 0)

  return (
    <div className="fade-in h-[calc(100vh-7rem)] flex gap-6">

      {/* ── Left: conversation list ── */}
      <div className="w-80 flex-shrink-0 flex flex-col card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Support Inbox</h2>
            {totalUnread > 0 && (
              <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {totalUnread} new
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="px-4 py-3 flex gap-3 items-center">
                <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 rounded w-24" />
                  <div className="skeleton h-3 rounded w-36" />
                </div>
              </div>
            ))
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Workers will appear here when they send a message</p>
            </div>
          ) : (
            conversations.map(c => (
              <button
                key={c.worker_id}
                onClick={() => selectConversation(c)}
                className={`w-full px-4 py-3 flex gap-3 items-start text-left transition-colors hover:bg-gray-50
                  ${selected?.worker_id === c.worker_id ? 'bg-indigo-50 border-l-2 border-indigo-600' : ''}`}
              >
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center
                                text-indigo-700 text-sm font-bold flex-shrink-0 relative">
                  {c.worker_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  {c.unread_count > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full
                                     text-white text-xs font-bold flex items-center justify-center">
                      {c.unread_count}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${c.unread_count > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {c.worker_name}
                    </p>
                    <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{timeAgo(c.last_message_at)}</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{c.last_message}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Right: chat window ── */}
      <div className="flex-1 flex flex-col card p-0 overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-lg font-medium text-gray-500">Select a conversation</p>
            <p className="text-sm mt-1">Choose a worker from the left to view their messages</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center
                              text-indigo-700 text-sm font-bold">
                {selected.worker_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{selected.worker_name}</p>
                <p className="text-xs text-gray-400">Support conversation</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1 bg-gray-50">
              {grouped.map(item =>
                item.type === 'divider' ? (
                  <div key={item.key} className="flex items-center gap-2 py-2">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 px-2">{item.label}</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                ) : (
                  <div
                    key={item.id}
                    className={`flex mb-1 ${item.receiver_id === selected.worker_id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[65%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                      item.receiver_id === selected.worker_id
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                    }`}>
                      {item.receiver_id !== selected.worker_id && (
                        <p className="text-indigo-600 font-semibold text-xs mb-0.5">{item.sender_name}</p>
                      )}
                      <p className="leading-snug break-words">{item.message}</p>
                      <p className={`text-xs mt-1 text-right ${item.receiver_id === selected.worker_id ? 'text-indigo-200' : 'text-gray-400'}`}>
                        {formatTime(item.created_at)}
                      </p>
                    </div>
                  </div>
                )
              )}
              {grouped.length === 0 && (
                <div className="text-center text-gray-400 text-sm mt-10">
                  <p>No messages with {selected.worker_name} yet.</p>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Reply input */}
            <form onSubmit={send} className="p-4 border-t border-gray-100 flex gap-3 bg-white">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={`Reply to ${selected.worker_name}...`}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white
                           rounded-xl px-5 py-2.5 text-sm font-medium transition-colors flex items-center gap-2"
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 rotate-90">
                    <path d="M2 21L23 12 2 3v7l15 2-15 2z" />
                  </svg>
                )}
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
