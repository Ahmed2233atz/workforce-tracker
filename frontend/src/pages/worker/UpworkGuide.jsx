export default function UpworkGuide() {
  return (
    <div className="space-y-6 fade-in max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">💼 Upwork Hours Guide</h1>
        <p className="text-gray-500 text-sm mt-1">How to log your hours manually on Upwork every day.</p>
      </div>

      {/* Steps */}
      <div className="card border border-gray-200 space-y-5">
        <p className="font-semibold text-gray-700 text-sm uppercase tracking-wider">📋 Daily Steps</p>

        <div className="space-y-4">
          {[
            {
              n: '1',
              text: <>At the end of each workday, <strong>finish your work first</strong>, then open your contract on Upwork.</>
            },
            {
              n: '2',
              text: <>Click <strong>"Add Manual Time"</strong> on your contract page.</>
            },
            {
              n: '3',
              text: <>Enter a time range that equals your total hours worked. For example, if you worked <strong>2 hours</strong>, set the start time to <strong>2:00</strong> and the end time to <strong>4:00</strong>.</>
            },
            {
              n: '4',
              text: <>You can choose <strong>any time range</strong> you want — the important thing is that the total equals the hours you actually worked.</>
            },
          ].map(({ n, text }) => (
            <div key={n} className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center font-bold text-emerald-700 text-sm flex-shrink-0">
                {n}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed pt-1">{text}</p>
            </div>
          ))}
        </div>

        {/* Example box */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-emerald-800 text-sm font-semibold mb-3">📌 Example — logging 2 hours:</p>
          <div className="flex items-center gap-4">
            <div className="bg-white border border-emerald-200 rounded-lg px-4 py-3 text-center">
              <p className="text-xs text-emerald-600 font-medium mb-0.5">Start Time</p>
              <p className="font-bold text-emerald-900 text-lg">2:00</p>
            </div>
            <span className="text-emerald-400 font-bold text-2xl">→</span>
            <div className="bg-white border border-emerald-200 rounded-lg px-4 py-3 text-center">
              <p className="text-xs text-emerald-600 font-medium mb-0.5">End Time</p>
              <p className="font-bold text-emerald-900 text-lg">4:00</p>
            </div>
            <div className="bg-emerald-100 border border-emerald-300 rounded-lg px-4 py-3 text-center">
              <p className="text-xs text-emerald-700 font-medium mb-0.5">Total</p>
              <p className="font-bold text-emerald-800 text-lg">2h ✅</p>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-amber-800 text-sm font-semibold flex items-center gap-2">⚠️ Important</p>
          <p className="text-amber-700 text-sm mt-1">Always log your Upwork hours <strong>on the same day</strong> you worked. Do not leave it for the next day.</p>
        </div>
      </div>
    </div>
  )
}
