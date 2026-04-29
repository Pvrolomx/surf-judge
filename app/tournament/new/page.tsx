'use client'
import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/lang-context'
import { LangToggle } from '@/lib/lang-toggle'
import { translations } from '@/lib/i18n'

function NewTournamentPage() {
  const router = useRouter()
  const { lang } = useLang()
  const t = translations[lang]
  const [name, setName] = useState('')
  const [surferText, setSurferText] = useState('')
  const [judgeCount, setJudgeCount] = useState<3|5>(3)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const surfers = surferText.split('\n').map(s => s.trim()).filter(Boolean)

  async function create() {
    if (surfers.length < 2) { setError(t.minSurfers); return }
    setLoading(true); setError('')
    const res = await fetch('/api/tournaments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name || null, surfers, format: '2-1', judge_count: judgeCount })
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    router.push(`/tournament/bracket?id=${data.id}&lang=${lang}`)
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-sm mx-auto pb-16">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="text-slate-400 text-sm">{t.back}</button>
        <LangToggle />
      </div>
      <h1 className="text-2xl font-black text-amber-400 mb-6">🏆 {t.tournamentTitle}</h1>

      {/* Name */}
      <div className="mb-5">
        <label className="text-slate-400 text-xs uppercase tracking-wider block mb-2">{t.tournamentName}</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder={t.tournamentNamePlaceholder}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" />
      </div>

      {/* Surfer list */}
      <div className="mb-5">
        <label className="text-slate-400 text-xs uppercase tracking-wider block mb-1">{t.surferList}</label>
        <p className="text-slate-500 text-xs mb-2">{t.surferListHint}</p>
        <textarea value={surferText} onChange={e => setSurferText(e.target.value)}
          placeholder={t.surferListPlaceholder} rows={8}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 resize-none font-mono text-sm" />
        {surfers.length > 0 && (
          <p className="text-amber-400/70 text-xs mt-1">{t.surferCount(surfers.length)}</p>
        )}
      </div>

      {/* Judges */}
      <div className="mb-6">
        <label className="text-slate-400 text-xs uppercase tracking-wider block mb-2">{t.judgesPerHeat}</label>
        <div className="flex gap-2">
          {([3,5] as const).map(n => (
            <button key={n} onClick={() => setJudgeCount(n)}
              className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all score-btn ${judgeCount === n ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
              {n} {t.judges}
            </button>
          ))}
        </div>
      </div>

      {/* Format */}
      <div className="mb-8">
        <label className="text-slate-400 text-xs uppercase tracking-wider block mb-2">{t.format}</label>
        <div className="bg-slate-800 border border-amber-700/50 rounded-xl px-4 py-3 text-amber-300 text-sm font-semibold">
          🏄 {t.format21}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <button onClick={create} disabled={loading || surfers.length < 2}
        className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold py-4 rounded-xl text-xl transition-colors score-btn">
        {loading ? t.creating : t.createTournament}
      </button>
    </main>
  )
}

export default function NewTournamentWrapper() {
  return <Suspense><NewTournamentPage /></Suspense>
}
