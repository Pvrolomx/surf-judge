'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLang } from '@/lib/lang-context'
import { LangToggle } from '@/lib/lang-toggle'
import { translations } from '@/lib/i18n'

function SetupPage() {
  const router = useRouter()
  const params = useSearchParams()
  const { lang } = useLang()
  const t = translations[lang]
  const [judgeCount, setJudgeCount] = useState<3|5>(3)
  const [surferCount, setSurferCount] = useState<2|3|4>(2)
  const [surfers, setSurfers] = useState(['', '', '', ''])
  const [loading, setLoading] = useState(false)

  async function createHeat() {
    const names = surfers.slice(0, surferCount).map((n, i) => n.trim() || `Surfer ${i+1}`)
    setLoading(true)
    const res = await fetch('/api/heats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ judge_count: judgeCount, surfer_count: surferCount, surfers: names })
    })
    const heat = await res.json()
    router.push(`/headjudge?code=${heat.code}&lang=${lang}`)
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-sm mx-auto pb-16">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="text-slate-400 text-sm">{t.back}</button>
        <LangToggle />
      </div>
      <h1 className="text-2xl font-black text-sky-400 mb-6">{t.newHeatTitle}</h1>

      {/* Judges */}
      <div className="mb-6">
        <label className="text-slate-400 text-xs uppercase tracking-wider block mb-2">{t.numberOfJudges}</label>
        <div className="flex gap-2">
          {([3, 5] as const).map(n => (
            <button key={n} onClick={() => setJudgeCount(n)}
              className={`flex-1 py-4 rounded-xl font-bold text-xl transition-all score-btn ${judgeCount === n ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
              {n} {t.judges}
            </button>
          ))}
        </div>
        <p className="text-slate-500 text-xs mt-2">{judgeCount === 5 ? t.judges3desc : t.judges5desc}</p>
      </div>

      {/* Surfers count */}
      <div className="mb-6">
        <label className="text-slate-400 text-xs uppercase tracking-wider block mb-2">{t.competitors}</label>
        <div className="flex gap-2">
          {([2, 3, 4] as const).map(n => (
            <button key={n} onClick={() => setSurferCount(n)}
              className={`flex-1 py-4 rounded-xl font-bold text-xl transition-all score-btn ${surferCount === n ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Names */}
      <div className="mb-8">
        <label className="text-slate-400 text-xs uppercase tracking-wider block mb-2">{t.names}</label>
        <div className="space-y-2">
          {Array.from({ length: surferCount }, (_, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-slate-500 text-sm w-6">{i+1}.</span>
              <input type="text" value={surfers[i]}
                onChange={e => { const a=[...surfers]; a[i]=e.target.value; setSurfers(a) }}
                placeholder={`Surfer ${i+1}`}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500" />
            </div>
          ))}
        </div>
      </div>

      <button onClick={createHeat} disabled={loading}
        className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-bold py-4 rounded-xl text-xl transition-colors score-btn">
        {loading ? t.creating : t.createHeat}
      </button>
    </main>
  )
}

export default function SetupWrapper() {
  return <Suspense><SetupPage /></Suspense>
}
