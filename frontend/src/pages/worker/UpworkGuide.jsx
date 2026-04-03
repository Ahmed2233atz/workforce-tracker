import { useState } from 'react'

export default function UpworkGuide() {
  const [contractType, setContractType] = useState(null)

  return (
    <div className="space-y-6 fade-in max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">💼 Upwork Hours Guide</h1>
        <p className="text-gray-500 text-sm mt-1">How to log your hours manually on Upwork every day.</p>
      </div>

      {/* Contract Type Selector */}
      <div className="card border border-gray-200 space-y-4">
        <p className="font-semibold text-gray-800 text-base">What type of contract do you have?</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setContractType('hourly')}
            className={`rounded-xl border-2 px-4 py-4 text-left transition-all ${
              contractType === 'hourly'
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40'
            }`}
          >
            <p className="text-2xl mb-1">⏱️</p>
            <p className={`font-bold text-sm ${contractType === 'hourly' ? 'text-emerald-700' : 'text-gray-800'}`}>Hourly</p>
            <p className="text-xs text-gray-500 mt-0.5">Paid per hour worked</p>
          </button>
          <button
            onClick={() => setContractType('fixed')}
            className={`rounded-xl border-2 px-4 py-4 text-left transition-all ${
              contractType === 'fixed'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'
            }`}
          >
            <p className="text-2xl mb-1">📋</p>
            <p className={`font-bold text-sm ${contractType === 'fixed' ? 'text-blue-700' : 'text-gray-800'}`}>Fixed Price</p>
            <p className="text-xs text-gray-500 mt-0.5">Paid per milestone or task</p>
          </button>
        </div>
      </div>

      {/* No selection yet */}
      {!contractType && (
        <div className="text-center py-10 text-gray-400">
          <p className="text-4xl mb-3">👆</p>
          <p className="text-sm">Select your contract type above to see the instructions.</p>
        </div>
      )}

      {/* Hourly Contract */}
      {contractType === 'hourly' && (
        <div className="card border border-emerald-200 space-y-5">
          <p className="font-semibold text-gray-700 text-sm uppercase tracking-wider">📋 Daily Steps — Hourly Contract</p>

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
      )}

      {/* Fixed Price Contract */}
      {contractType === 'fixed' && (
        <div className="card border border-blue-200 space-y-5">
          <p className="font-semibold text-gray-700 text-sm uppercase tracking-wider">📋 Instructions — Fixed Price Contract</p>
          <div className="text-center py-8 text-gray-400 space-y-2">
            <p className="text-3xl">🔧</p>
            <p className="text-sm">Instructions for fixed price contracts will be added soon.</p>
            <p className="text-xs">Contact support if you need help in the meantime.</p>
          </div>
        </div>
      )}
    </div>
  )
}
