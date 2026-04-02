export default function ActivityGuide() {
  return (
    <div className="space-y-8 fade-in max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📊 Activity Guide</h1>
        <p className="text-gray-500 text-sm mt-1">
          The most important factor in keeping your job. Read this carefully.
        </p>
      </div>

      {/* #1 Priority Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 p-5 text-white shadow-lg">
        <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">⚠️ Most Important Rule</p>
        <p className="text-xl font-bold leading-snug">
          Using any form of AI is strictly forbidden.
        </p>
        <p className="text-sm opacity-90 mt-2">
          This includes ChatGPT, Gemini, Copilot, or any AI tool — at any step of the work.
          Violations result in <strong>immediate removal</strong> with no warning.
        </p>
      </div>

      {/* Full Screen Rule */}
      <div className="card border border-indigo-200 bg-indigo-50 space-y-3">
        <p className="font-bold text-indigo-900 text-base flex items-center gap-2">🖥️ Always Work in Full Screen Mode</p>
        <p className="text-sm text-indigo-800">
          You must keep your browser in <strong>full screen mode</strong> at all times while working.
          This is required for Hubstaff to correctly track your activity.
        </p>
        <div className="flex items-center gap-4 pt-1">
          <div className="bg-white border border-indigo-200 rounded-xl px-5 py-3 text-center flex-shrink-0">
            <p className="text-xs text-indigo-500 font-medium mb-0.5">Enable Full Screen</p>
            <p className="font-bold text-indigo-900 text-2xl tracking-widest">F11</p>
          </div>
          <p className="text-sm text-indigo-700">Press <strong>F11</strong> on your keyboard to enter full screen before you start the Hubstaff timer.</p>
        </div>
      </div>

      {/* What is Activity */}
      <div className="card border border-gray-200 space-y-4">
        <p className="font-semibold text-gray-700 text-sm uppercase tracking-wider">📈 What is "Activity" on Hubstaff?</p>
        <p className="text-sm text-gray-700 leading-relaxed">
          Hubstaff measures your <strong>keyboard and mouse activity</strong> while the timer is running.
          It calculates a percentage — the higher it is, the more active you appear.
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">
          Most people who get removed from projects are removed <strong>not because of quality</strong>, but because
          their activity percentage is too low. Hubstaff sees them as idle even when they are working.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-amber-800 text-sm font-semibold flex items-center gap-2">⚠️ Why this happens</p>
          <ul className="mt-2 space-y-1.5 text-sm text-amber-700">
            <li className="flex items-start gap-2"><span className="flex-shrink-0 mt-0.5">▸</span><span>You stop to read — no mouse or keyboard movement = low activity</span></li>
            <li className="flex items-start gap-2"><span className="flex-shrink-0 mt-0.5">▸</span><span>You switch to another window or app while the timer is running</span></li>
            <li className="flex items-start gap-2"><span className="flex-shrink-0 mt-0.5">▸</span><span>You work in a small window instead of full screen</span></li>
            <li className="flex items-start gap-2"><span className="flex-shrink-0 mt-0.5">▸</span><span>You take a break without pausing the timer</span></li>
          </ul>
        </div>
      </div>

      {/* Average Time Per Project */}
      <div className="card border border-gray-200 space-y-4">
        <p className="font-semibold text-gray-700 text-sm uppercase tracking-wider">⏱️ Average Time Per Task</p>
        <p className="text-sm text-gray-600">These are rough benchmarks. Working too fast or too slow can both affect your quality score.</p>
        <div className="space-y-3">
          {[
            { project: 'English Annotation', time: '2–4 min', note: 'Per task, depending on complexity' },
            { project: 'Russian Annotation', time: '3–5 min', note: 'Per task' },
            { project: 'Chinese Annotation', time: '3–5 min', note: 'Per task' },
            { project: 'Egyptian English Annotation', time: '2–4 min', note: 'Per task' },
          ].map(({ project, time, note }) => (
            <div key={project} className="flex items-center justify-between gap-4 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
              <div>
                <p className="font-medium text-gray-800 text-sm">{project}</p>
                <p className="text-xs text-gray-400 mt-0.5">{note}</p>
              </div>
              <span className="font-bold text-gray-700 text-sm flex-shrink-0">{time}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 italic">These times are estimates and may vary per project. Focus on quality over speed.</p>
      </div>

      {/* Bad vs Good Activity */}
      <div className="card border border-gray-200 space-y-4">
        <p className="font-semibold text-gray-700 text-sm uppercase tracking-wider">📋 Activity Examples</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Bad */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
            <p className="font-bold text-red-700 text-sm flex items-center gap-2">❌ Bad Activity</p>
            <ul className="space-y-2 text-sm text-red-700">
              <li className="flex items-start gap-2"><span className="flex-shrink-0 mt-0.5">▸</span><span>Activity: <strong>12%</strong> — timer was running while reading instructions</span></li>
              <li className="flex items-start gap-2"><span className="flex-shrink-0 mt-0.5">▸</span><span>Activity: <strong>24%</strong> — switching between windows frequently</span></li>
              <li className="flex items-start gap-2"><span className="flex-shrink-0 mt-0.5">▸</span><span>Activity: <strong>8%</strong> — took a break without stopping the timer</span></li>
              <li className="flex items-start gap-2"><span className="flex-shrink-0 mt-0.5">▸</span><span>Activity: <strong>18%</strong> — working in a small browser window</span></li>
            </ul>
            <div className="bg-red-100 border border-red-300 rounded-lg p-2 text-xs text-red-800 font-semibold text-center">
              These levels will likely get you removed
            </div>
          </div>

          {/* Good */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
            <p className="font-bold text-green-700 text-sm flex items-center gap-2">✅ Good Activity</p>
            <ul className="space-y-2 text-sm text-green-700">
              <li className="flex items-start gap-2"><span className="flex-shrink-0 mt-0.5">▸</span><span>Activity: <strong>72%</strong> — steady typing and clicking throughout the session</span></li>
              <li className="flex items-start gap-2"><span className="flex-shrink-0 mt-0.5">▸</span><span>Activity: <strong>65%</strong> — working in full screen with minimal switching</span></li>
              <li className="flex items-start gap-2"><span className="flex-shrink-0 mt-0.5">▸</span><span>Activity: <strong>80%</strong> — timer paused during reading/breaks</span></li>
              <li className="flex items-start gap-2"><span className="flex-shrink-0 mt-0.5">▸</span><span>Activity: <strong>70%</strong> — consistent mouse and keyboard use</span></li>
            </ul>
            <div className="bg-green-100 border border-green-300 rounded-lg p-2 text-xs text-green-800 font-semibold text-center">
              Aim for 60% or above at all times
            </div>
          </div>
        </div>
      </div>

      {/* Quick Rules Summary */}
      <div className="card border border-gray-200 space-y-3">
        <p className="font-semibold text-gray-700 text-sm uppercase tracking-wider">✅ Quick Rules to Remember</p>
        <ul className="space-y-3">
          {[
            { icon: '🔴', text: 'Never use AI tools — any violation = immediate removal' },
            { icon: '🖥️', text: 'Always work in full screen mode (press F11)' },
            { icon: '⏸️', text: 'Pause the Hubstaff timer before reading instructions or taking a break' },
            { icon: '🖱️', text: 'Keep your mouse and keyboard active — scroll, click, type regularly' },
            { icon: '🪟', text: 'Stay on the task window — do not switch to unrelated apps' },
            { icon: '🎯', text: 'Target 60%+ activity to stay in good standing' },
          ].map(({ icon, text }) => (
            <li key={text} className="flex items-start gap-3 text-sm text-gray-700">
              <span className="flex-shrink-0 text-base">{icon}</span>
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
