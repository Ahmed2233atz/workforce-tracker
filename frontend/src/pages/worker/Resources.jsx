import { useState, useEffect } from 'react'
import api from '../../api/axios.js'

export default function Resources() {
  const [credentials, setCredentials] = useState([])
  const [showPasswords, setShowPasswords] = useState({})

  useEffect(() => {
    api.get('/me/credentials').then(res => setCredentials(res.data)).catch(() => {})
  }, [])

  const projects = [
    { name: 'English Data Annotator', icon: '🇬🇧' },
    { name: 'Russian Data Annotator', icon: '🇷🇺' },
    { name: 'Egyptian English Data Annotator', icon: '🇪🇬' },
  ]

  return (
    <div className="space-y-8 fade-in max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📚 Resources</h1>
        <p className="text-gray-500 text-sm mt-1">
          Everything you need — instructions, credentials, and tools.
        </p>
      </div>

      {/* My Credentials */}
      {credentials.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">🔐 My Login Credentials</h2>
          {credentials.map(cred => (
            <div key={cred.id} className="card border border-gray-200 space-y-2">
              <p className="font-semibold text-gray-900 text-base">🔐 {cred.platform}</p>
              {cred.username && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 w-20">Username:</span>
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-800">{cred.username}</span>
                </div>
              )}
              {cred.password && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 w-20">Password:</span>
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-800">
                    {showPasswords[cred.id] ? cred.password : '••••••••'}
                  </span>
                  <button
                    className="text-xs text-primary-600 hover:underline"
                    onClick={() => setShowPasswords(prev => ({...prev, [cred.id]: !prev[cred.id]}))}
                  >
                    {showPasswords[cred.id] ? 'Hide' : 'Show'}
                  </button>
                </div>
              )}
              {cred.notes && <p className="text-xs text-gray-400 italic mt-1">{cred.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Hubstaff */}
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

      {/* Project Instructions */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">📂 Project Instructions</h2>
        {projects.map((project) => (
          <div key={project.name} className="card flex items-center justify-between gap-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-2xl flex-shrink-0">
                {project.icon}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{project.name}</p>
                <p className="text-sm text-gray-400">Click to open the instructions folder</p>
              </div>
            </div>
            <a
              href="https://drive.google.com/drive/folders/13rNNnZc9bGD9deYIB2Wg1Zb_cPw3SmUl?usp=drive_link"
              target="_blank"
              rel="noreferrer"
              className="btn-primary whitespace-nowrap flex-shrink-0"
            >
              📁 Open Instructions
            </a>
          </div>
        ))}
      </div>

      {/* Request section */}
      <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-6 text-center space-y-3">
        <div className="text-4xl">🙋</div>
        <h3 className="font-bold text-gray-900 text-lg">Can't find your project instructions?</h3>
        <p className="text-gray-600 text-sm max-w-md mx-auto">
          Submit a request and your manager will be notified. Instructions will be added and you'll receive a notification once they're ready.
        </p>
        <a
          href="https://forms.gle/skdqkaVm1b5uF2bcA"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors"
        >
          📝 Request Instructions
        </a>
      </div>
    </div>
  )
}
