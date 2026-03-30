import { useState, useEffect } from 'react'
import api from '../../api/axios.js'

const projects = [
  { name: 'English Data Annotator', icon: '🇬🇧' },
  { name: 'Russian Data Annotator', icon: '🇷🇺' },
  { name: 'Egyptian English Data Annotator', icon: '🇪🇬' },
  { name: 'Chinese Data Annotator', icon: '🇨🇳' },
]

export default function Resources() {
  const [credentials, setCredentials] = useState([])
  const [showPasswords, setShowPasswords] = useState({})

  useEffect(() => {
    api.get('/me/credentials').then(res => setCredentials(res.data)).catch(() => {})
  }, [])

  return (
    <div className="space-y-8 fade-in max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📚 Resources</h1>
        <p className="text-gray-500 text-sm mt-1">
          Project instructions and resources for your work.
        </p>
      </div>

      {/* My Credentials */}
      {credentials.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">🔐 My Platform Credentials</h2>
          <div className="space-y-3">
            {credentials.map(cred => (
              <div key={cred.id} className="card border-l-4 border-l-primary-500 space-y-2">
                <p className="font-semibold text-gray-900 text-base">{cred.platform}</p>
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
                      onClick={() => setShowPasswords(prev => ({ ...prev, [cred.id]: !prev[cred.id] }))}
                    >
                      {showPasswords[cred.id] ? 'Hide' : 'Show'}
                    </button>
                  </div>
                )}
                {cred.notes && <p className="text-xs text-gray-400 italic">{cred.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quality Tips — TOP */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">💡 Quality Tips</h2>
        <div className="card flex items-center justify-between gap-4 hover:shadow-md transition-shadow border-l-4 border-l-yellow-400">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-50 border border-yellow-100 flex items-center justify-center text-2xl flex-shrink-0">⭐</div>
            <div>
              <p className="font-semibold text-gray-900">General Tips & Tricks to Achieve High Quality</p>
              <p className="text-sm text-gray-400">Read this first to improve your quality across all projects</p>
            </div>
          </div>
          <a
            href="https://docs.google.com/document/d/1ZmWJWd74nYvSqL9rni0rUDzpri521Sp89ag5BfzTt3w/edit?usp=sharing"
            target="_blank"
            rel="noreferrer"
            className="btn-primary whitespace-nowrap flex-shrink-0"
          >
            📄 Open Document
          </a>
        </div>
      </div>

      {/* Contact Support banner — only shown if no credentials yet */}
      {credentials.length === 0 && (
        <>
          <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="text-3xl flex-shrink-0">✅</div>
            <div className="flex-1">
              <p className="font-bold text-indigo-900 text-sm">Read the tips and have all the required tools installed?</p>
              <p className="text-indigo-700 text-sm mt-1">
                Open the <strong>Support chat</strong> on the bottom-right of the screen and send a message asking to have your <strong>login credentials added</strong>. We'll get back to you shortly.
              </p>
            </div>
            <div className="text-2xl flex-shrink-0">💬</div>
          </div>

          <div className="rounded-2xl bg-red-50 border-2 border-red-200 p-5 flex items-start gap-4">
            <div className="text-2xl flex-shrink-0">🚫</div>
            <div>
              <p className="font-bold text-red-800 text-sm">Do not read the project instructions yet</p>
              <p className="text-red-700 text-sm mt-1">
                Wait until your <strong>login credentials have been added</strong> to your account. Some projects may not be available to you, and reading the instructions for unavailable projects wastes your time.
              </p>
              <p className="text-red-600 text-sm mt-2 font-medium">
                Your manager will notify you once your credentials are ready — then you can proceed.
              </p>
            </div>
          </div>
        </>
      )}

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
