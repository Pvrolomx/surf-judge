'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLang } from '@/lib/lang-context'
import { LangToggle } from '@/lib/lang-toggle'
import { translations } from '@/lib/i18n'
import type { Heat } from '@/lib/types'

function ScoreInput({ value, onChange }: { value: number, onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-7xl font-black text-sky-400 font-mono tabular-nums">{value.toFixed(1)}</div>
      <input type="range" min={0} max={100} step={1}
        value={Math.round(value * 10)}
        onChange={e => onChange(Number(e.target.value) / 10)}
        className="w-full" />
      <div className="flex justify-between w-full text-slate-500 text-xs">
        <span>0.0</span><span>2.5</span><span>5.0</span><span>7.5</span><span>10.0</span>
      </div>
      <div className="flex gap-2">
        {[-1, -0.1, +0.1, +1].map(delta => (
          <button key={delta}
            onClick={() => onChange(Math.min(10, Math.max(0, Math.round((value + delta) * 10) / 10)))}
            className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-4 py-3 rounded-xl score-btn">
            {delta > 0 ? '+' : ''}{delta === -0.1 ? '-0.1' : delta === 0.1 ? '+0.1' : delta}
          </button>
        ))}
      </div>
    </div>
  )
}

function JudgePage() {
  const params = useSearchParams()
  const code = params.get('code') ?? ''
  const judgeNumber = Number(params.get('judge') ?? '1')
  const { lang } = useLang()
  const t = translations[lang]

  const [heat, setHeat] = useState<Heat | null>(null)
  const [selectedSurfer, setSelectedSurfer] = useState(0)
  const [score, setScore] = useState(5.0)
  const [submitting, setSubmitting] = useState(false)
  const [lastSubmitted, setLastSubmitted] = useState<{surfer: string, score: number} | null>(null)
  const [myWaveCounts, setMyWaveCounts] = useState<number[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!code) return
    fetch(`/api/heats/${code}`)
      .then(r => r.json())
      .then(h => { setHeat(h); setMyWaveCounts(Array(h.surfer_count).fill(0)) })
      .catch(() => setError(t.heatNotFound))
  }, [code])

  useEffect(() => {
    if (!heat) return
    fetch(`/api/scores?heat_id=${heat.id}`)
      .then(r => r.json())
      .then((scores: Array<{judge_number: number, surfer_index: number}>) => {
        const counts = Array(heat.surfer_count).fill(0)
        scores.filter(s => s.judge_number === judgeNumber).forEach(s => { counts[s.surfer_index]++ })
        setMyWaveCounts(counts)
      })
  }, [heat, judgeNumber])

  async function submitScore() {
    if (!heat) return
    setSubmitting(true)
    const res = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ heat_id: heat.id, judge_number: judgeNumber, surfer_index: selectedSurfer, score })
    })
    if (res.ok) {
      const counts = [...myWaveCounts]; counts[selectedSurfer]++
      setMyWaveCounts(counts)
      setLastSubmitted({ surfer: heat.surfers[selectedSurfer], score })
      setScore(5.0)
    }
    setSubmitting(false)
  }

  if (error) return (
    <main className="flex items-center justify-center min-h-screen px-4">
      <div className="text-center">
        <p className="text-red-400 text-xl">{error}</p>
        <a href="/" className="text-sky-400 mt-4 block">{t.back}</a>
      </div>
    </main>
  )

  if (!heat) return (
    <main className="flex items-center justify-center min-h-screen">
      <p className="text-slate-400 animate-pulse">{t.connecting}</p>
    </main>
  )

  return (
    <main className="min-h-screen px-4 py-6 pb-16 max-w-sm mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-slate-400 text-xs uppercase tracking-wider">{t.heatCode}</div>
          <div className="text-white font-mono font-bold text-xl">{heat.code}</div>
        </div>
        <LangToggle />
        <div className="text-right">
          <div className="text-slate-400 text-xs uppercase tracking-wider">{t.judgeNumber.split(' ')[0]}</div>
          <div className="text-sky-400 font-bold text-2xl">#{judgeNumber}</div>
        </div>
      </div>

      {lastSubmitted && (
        <div className="bg-green-900/50 border border-green-700 rounded-xl px-4 py-3 mb-4 text-center">
          <p className="text-green-400 text-sm">✅ {t.scoreSubmitted} <strong>{lastSubmitted.surfer}</strong> → <strong>{lastSubmitted.score.toFixed(1)}</strong></p>
        </div>
      )}

      <div className="mb-6">
        <label className="text-slate-400 text-xs uppercase tracking-wider block mb-2">{t.whoSurfed}</label>
        <div className={`grid gap-2 ${heat.surfer_count === 2 ? 'grid-cols-2' : heat.surfer_count === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {heat.surfers.map((name, idx) => (
            <button key={idx} onClick={() => setSelectedSurfer(idx)}
              className={`py-3 px-2 rounded-xl font-semibold text-sm transition-all score-btn ${selectedSurfer === idx ? 'bg-sky-600 text-white ring-2 ring-sky-400' : 'bg-slate-800 text-slate-300'}`}>
              <span className="block truncate">{name}</span>
              <span className="text-xs opacity-60">{myWaveCounts[idx] ?? 0} {t.waves}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl p-6 mb-6 border border-slate-800">
        <div className="text-slate-400 text-xs uppercase tracking-wider mb-4 text-center">
          {t.scoringFor} <span className="text-white">{heat.surfers[selectedSurfer]}</span>
        </div>
        <ScoreInput value={score} onChange={setScore} />
      </div>

      <button onClick={submitScore} disabled={submitting}
        className="w-full bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-40 text-white font-black py-5 rounded-2xl text-2xl transition-all score-btn shadow-lg shadow-sky-900/50">
        {submitting ? '...' : `${t.submit} ${score.toFixed(1)}`}
      </button>

      <p className="text-center text-slate-600 text-xs mt-4">{t.blindNote}</p>
    </main>
  )
}

export default function JudgeWrapper() {
  return <Suspense><JudgePage /></Suspense>
}
