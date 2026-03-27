export default function Resources() {
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
          Access task instructions for each project. If you can't find what you need, submit a request below.
        </p>
      </div>

      {/* Project cards */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Project Instructions</h2>
        {projects.map((project) => (
          <div
            key={project.name}
            className="card flex items-center justify-between gap-4 hover:shadow-md transition-shadow"
          >
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
