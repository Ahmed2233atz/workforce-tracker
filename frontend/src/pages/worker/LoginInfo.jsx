import { useState, useEffect } from 'react'
import api from '../../api/axios.js'

export default function LoginInfo() {
  const [credentials, setCredentials] = useState([])
  const [showPasswords, setShowPasswords] = useState({})

  useEffect(() => {
    api.get('/me/credentials').then(res => setCredentials(res.data)).catch(() => {})
  }, [])

  return (
    <div className="space-y-8 fade-in max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🔐 Login Info</h1>
        <p className="text-gray-500 text-sm mt-1">
          Your platform credentials and usage instructions.
        </p>
      </div>

      {/* Hubstaff Platform */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">🖥️ Platforms</h2>
        <div className="card border border-gray-200 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-2xl flex-shrink-0">⏱️</div>
              <div>
                <p className="font-bold text-gray-900 text-lg">Hubstaff</p>
                <p className="text-sm text-gray-500">Time tracking — desktop app required</p>
              </div>
            </div>
            <a
              href="https://hubstaff.com/download"
              target="_blank"
              rel="noreferrer"
              className="btn-primary whitespace-nowrap flex-shrink-0"
            >
              ⬇️ Download Desktop App
            </a>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
            <p className="font-semibold text-amber-900 text-sm flex items-center gap-2">⚠️ Important Instructions</p>
            <ul className="space-y-2 text-sm text-amber-800">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex-shrink-0">▸</span>
                <span>You <strong>must run the timer</strong> while you are working. Any work done without the timer will not be counted.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex-shrink-0">▸</span>
                <span>You <strong>must use the desktop application</strong> — the web version is not accepted.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex-shrink-0">▸</span>
                <span>One of these two projects must appear when tracking time:</span>
              </li>
            </ul>
            <div className="flex gap-3 mt-1 flex-wrap">
              <span className="px-4 py-1.5 bg-green-100 border border-green-300 text-green-800 rounded-lg font-semibold text-sm">✅ Multimango</span>
              <span className="px-4 py-1.5 bg-green-100 border border-green-300 text-green-800 rounded-lg font-semibold text-sm">✅ Multimango Multilingual</span>
            </div>
          </div>
        </div>
      </div>

      {/* Multimango Platform */}
      <div className="card border border-gray-200 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-2xl flex-shrink-0">🌐</div>
            <div>
              <p className="font-bold text-gray-900 text-lg">Multimango</p>
              <p className="text-sm text-gray-500">Task platform — where the work is done</p>
            </div>
          </div>
          <a
            href="https://www.multimango.com/tasks"
            target="_blank"
            rel="noreferrer"
            className="btn-primary whitespace-nowrap flex-shrink-0"
          >
            🔗 Open Platform
          </a>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <p className="font-semibold text-blue-900 text-sm flex items-center gap-2">📋 Instructions</p>
          <ul className="space-y-2.5 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex-shrink-0">▸</span>
              <span>Before you start working, <strong>take the project name</strong> and go to the instructions file. Read the instructions carefully.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex-shrink-0">▸</span>
              <span>Make sure the <strong>timer is off</strong> while reading instructions — reading is not paid.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex-shrink-0">▸</span>
              <span>You will find more than one project on the platform. <strong>Only work on the ones you fully understand.</strong></span>
            </li>
          </ul>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
            <p className="text-red-700 text-sm font-semibold flex items-start gap-2">
              <span className="flex-shrink-0">⚠️</span>
              <span>If your quality is low in even <strong>one project</strong>, you will be removed from <strong>all projects</strong> — even if your quality is high in others.</span>
            </p>
          </div>
        </div>
      </div>

      {/* My Credentials */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">🔑 My Login Credentials</h2>
        {credentials.length === 0 ? (
          <div className="card text-center py-10 text-gray-400">
            <div className="text-4xl mb-2">🔐</div>
            <p className="text-sm">No credentials added yet.</p>
            <p className="text-xs mt-1">Your manager will add them here when ready.</p>
          </div>
        ) : (
          credentials.map(cred => (
            <div key={cred.id} className="card border border-gray-200 space-y-3">
              <p className="font-bold text-gray-900 text-base">🔐 {cred.platform}</p>
              {cred.username && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-500 w-24 flex-shrink-0">Username:</span>
                  <span className="font-mono bg-gray-100 px-3 py-1 rounded-lg text-gray-800">{cred.username}</span>
                </div>
              )}
              {cred.password && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-500 w-24 flex-shrink-0">Password:</span>
                  <span className="font-mono bg-gray-100 px-3 py-1 rounded-lg text-gray-800">
                    {showPasswords[cred.id] ? cred.password : '••••••••'}
                  </span>
                  <button
                    className="text-xs text-primary-600 hover:text-primary-800 font-medium underline"
                    onClick={() => setShowPasswords(prev => ({ ...prev, [cred.id]: !prev[cred.id] }))}
                  >
                    {showPasswords[cred.id] ? 'Hide' : 'Show'}
                  </button>
                </div>
              )}
              {cred.notes && (
                <p className="text-xs text-gray-400 italic border-t border-gray-100 pt-2">{cred.notes}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
