export default function ActivityGuide() {
  return (
    <div className="space-y-10 fade-in max-w-3xl pb-10">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📊 Activity Guide</h1>
        <p className="text-gray-500 text-sm mt-1">
          The most important factor in keeping your job. Read this carefully.
        </p>
      </div>

      {/* #1 — AI Ban */}
      <div className="rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 p-6 text-white shadow-lg">
        <p className="text-xs font-bold uppercase tracking-widest opacity-75 mb-2">⚠️ Most Important Rule</p>
        <p className="text-xl font-bold leading-snug mb-3">
          Using any form of AI is strictly forbidden.
        </p>
        <p className="text-sm opacity-90 leading-relaxed">
          This includes ChatGPT, Gemini, Copilot, or any AI tool — at any step of the work.
          Violations result in <strong>immediate removal</strong> with no warning.
        </p>
      </div>

      {/* #2 — What is Activity */}
      <div className="card border border-gray-200 space-y-5 py-6 px-6">
        <p className="font-semibold text-gray-700 text-sm uppercase tracking-wider">📈 What is "Activity" on Hubstaff?</p>
        <p className="text-sm text-gray-700 leading-relaxed">
          Hubstaff tracks your <strong>keyboard and mouse movement</strong> while the timer runs and converts it into a percentage. The higher the percentage, the more active you appear to management.
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">
          Most people who get removed are not removed because of poor quality — they are removed because <strong>their activity score is too low</strong>. Hubstaff marks them as idle even when they are actually working.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
          <p className="text-amber-800 text-sm font-semibold">⚠️ Common reasons for low activity</p>
          <ul className="space-y-2.5 text-sm text-amber-700">
            <li className="flex items-start gap-2"><span className="flex-shrink-0 mt-0.5">▸</span><span>Stopping to read while the timer is still running</span></li>
            <li className="flex items-start gap-2"><span className="flex-shrink-0 mt-0.5">▸</span><span>Switching to another window or app during work</span></li>
            <li className="flex items-start gap-2"><span className="flex-shrink-0 mt-0.5">▸</span><span>Working in a small browser window instead of full screen</span></li>
            <li className="flex items-start gap-2"><span className="flex-shrink-0 mt-0.5">▸</span><span>Taking a break without pausing the timer</span></li>
          </ul>
        </div>
      </div>

      {/* #3 — Full Screen Rule */}
      <div className="rounded-2xl overflow-hidden border-2 border-indigo-400 shadow-lg">
        <div className="bg-indigo-600 px-6 py-4 flex items-center gap-3">
          <span className="text-2xl">🖥️</span>
          <div>
            <p className="text-white font-bold text-base leading-tight">Always Work in Full Screen Mode</p>
            <p className="text-indigo-200 text-xs mt-0.5">This directly affects your activity score — do not skip this</p>
          </div>
          <span className="ml-auto bg-white text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide flex-shrink-0">Required</span>
        </div>

        <div className="bg-indigo-50 px-6 py-6 space-y-5">
          <p className="text-sm text-indigo-900 leading-relaxed">
            Working in a small or non-fullscreen window significantly reduces your detected activity — even when you are actively typing and clicking. <strong>This is one of the most common reasons workers get removed.</strong>
          </p>

          <div className="flex items-center gap-6 bg-white border-2 border-indigo-300 rounded-2xl px-6 py-5">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="bg-indigo-600 text-white rounded-xl w-16 h-16 flex items-center justify-center shadow-md">
                <span className="font-black text-2xl tracking-tight">F11</span>
              </div>
              <p className="text-xs text-indigo-500 font-medium mt-2">Press this key</p>
            </div>
            <div className="space-y-2">
              <p className="font-bold text-indigo-900 text-sm">Before starting the Hubstaff timer:</p>
              <ol className="space-y-1.5 text-sm text-indigo-800">
                <li className="flex items-start gap-2"><span className="font-bold text-indigo-500 flex-shrink-0">1.</span><span>Press <strong>F11</strong> to enter full screen</span></li>
                <li className="flex items-start gap-2"><span className="font-bold text-indigo-500 flex-shrink-0">2.</span><span>Open the Multimango platform</span></li>
                <li className="flex items-start gap-2"><span className="font-bold text-indigo-500 flex-shrink-0">3.</span><span>Then start the Hubstaff timer</span></li>
              </ol>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
            <span className="text-red-500 text-base flex-shrink-0 mt-0.5">⚠️</span>
            <p className="text-sm text-red-700"><strong>Never start the timer in a small window.</strong> Your activity will appear low and you risk removal from the project.</p>
          </div>
        </div>
      </div>

      {/* #4 — Average Time Per Task */}
      <div className="rounded-2xl overflow-hidden border-2 border-orange-400 shadow-lg">
        <div className="bg-orange-500 px-6 py-4 flex items-center gap-3">
          <span className="text-2xl">⏱️</span>
          <div>
            <p className="text-white font-bold text-base leading-tight">Average Time Per Task</p>
            <p className="text-orange-100 text-xs mt-0.5">You must check this before starting any task</p>
          </div>
          <span className="ml-auto bg-white text-orange-600 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide flex-shrink-0">Critical</span>
        </div>

        <div className="bg-orange-50 px-6 py-6 space-y-5">
          <p className="text-sm text-orange-900 leading-relaxed">
            Every project has a specific expected time per task. Working too fast looks like you are skipping steps. Working too slow signals low productivity. <strong>Both can lead to removal.</strong>
          </p>

          <div className="bg-white border-2 border-orange-300 rounded-2xl px-6 py-5 space-y-4">
            <p className="font-bold text-orange-800 text-sm">Before starting any task:</p>
            <ol className="space-y-3">
              {[
                { n: '1', text: <>Copy the <strong>exact project name</strong> from Multimango.</> },
                { n: '2', text: <>Open the time reference sheet using the button below.</> },
                { n: '3', text: <>Search for your project name and <strong>note the expected time per task</strong>.</> },
                { n: '4', text: <>Pace your work to match that time — not faster, not much slower.</> },
              ].map(({ n, text }) => (
                <li key={n} className="flex items-start gap-3 text-sm text-orange-800">
                  <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">{n}</span>
                  <span className="leading-relaxed">{text}</span>
                </li>
              ))}
            </ol>

            <a
              href="https://docs.google.com/document/d/1BueXqACjG4tprvxq3dSVwYxRslarfd-Tv8FLNajT3J8/edit?tab=t.0#heading=h.fxaunss91m3x"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full mt-1 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm py-3.5 rounded-xl transition-colors"
            >
              📄 Open Task Time Reference Sheet
            </a>
          </div>

          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
            <span className="text-red-500 text-base flex-shrink-0 mt-0.5">⚠️</span>
            <p className="text-sm text-red-700"><strong>Do not start a task without checking the expected time first.</strong> Ignoring this is one of the leading causes of low scores and removal.</p>
          </div>
        </div>
      </div>

      {/* #5 — Bad vs Good Activity */}
      <div className="space-y-4">
        <p className="font-semibold text-gray-700 text-sm uppercase tracking-wider px-1">📋 Activity Examples</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-4">
            <p className="font-bold text-red-700 text-sm flex items-center gap-2">❌ Bad Activity</p>
            <ul className="space-y-3 text-sm text-red-700">
              <li className="flex items-start gap-2"><span className="flex-shrink-0 mt-0.5">▸</span><span>Activity: <strong>12%</strong> — timer running while reading instructions</span></li>
              <li className="flex items-start gap-2"><span className="flex-shrink-0 mt-0.5">▸</span><span>Activity: <strong>24%</strong> — switching between windows frequently</span></li>
              <li className="flex items-start gap-2"><span className="flex-shrink-0 mt-0.5">▸</span><span>Activity: <strong>8%</strong> — took a break without stopping the timer</span></li>
              <li className="flex items-start gap-2"><span className="flex-shrink-0 mt-0.5">▸</span><span>Activity: <strong>18%</strong> — working in a small browser window</span></li>
            </ul>
            <div className="bg-red-100 border border-red-300 rounded-xl p-3 text-xs text-red-800 font-semibold text-center">
              These levels will likely get you removed
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-4">
            <p className="font-bold text-green-700 text-sm flex items-center gap-2">✅ Good Activity</p>
            <ul className="space-y-3 text-sm text-green-700">
              <li className="flex items-start gap-2"><span className="flex-shrink-0 mt-0.5">▸</span><span>Activity: <strong>72%</strong> — steady typing and clicking throughout</span></li>
              <li className="flex items-start gap-2"><span className="flex-shrink-0 mt-0.5">▸</span><span>Activity: <strong>65%</strong> — full screen, minimal window switching</span></li>
              <li className="flex items-start gap-2"><span className="flex-shrink-0 mt-0.5">▸</span><span>Activity: <strong>80%</strong> — timer paused during reading and breaks</span></li>
              <li className="flex items-start gap-2"><span className="flex-shrink-0 mt-0.5">▸</span><span>Activity: <strong>70%</strong> — consistent mouse and keyboard use</span></li>
            </ul>
            <div className="bg-green-100 border border-green-300 rounded-xl p-3 text-xs text-green-800 font-semibold text-center">
              Aim for 60% or above at all times
            </div>
          </div>
        </div>
      </div>

      {/* #6 — Quick Rules */}
      <div className="card border border-gray-200 py-6 px-6 space-y-5">
        <p className="font-semibold text-gray-700 text-sm uppercase tracking-wider">✅ Quick Rules to Remember</p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: '🔴', text: 'Never use AI tools — any violation = immediate removal' },
            { icon: '🖥️', text: 'Always work in full screen mode (press F11)' },
            { icon: '⏸️', text: 'Pause the timer before reading instructions or taking a break' },
            { icon: '🖱️', text: 'Keep your mouse and keyboard active — scroll, click, type' },
            { icon: '🪟', text: 'Stay on the task window — do not switch to unrelated apps' },
            { icon: '🎯', text: 'Target 60%+ activity to stay in good standing' },
          ].map(({ icon, text }) => (
            <li key={text} className="flex items-start gap-3 text-sm text-gray-700 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
              <span className="flex-shrink-0 text-base">{icon}</span>
              <span className="leading-relaxed">{text}</span>
            </li>
          ))}
        </ul>
      </div>

    </div>
  )
}
