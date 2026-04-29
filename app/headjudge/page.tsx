'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLang } from '@/lib/lang-context'
import { LangToggle } from '@/lib/lang-toggle'
import { translations } from '@/lib/i18n'
import type { Heat, Score, SurferResult } from '@/lib/types'
import { computeResults } from '@/lib/scoring'
import { supabase } from '@/lib/supabase'

function Scoreboard({ results, heat, t }: { results: SurferResult[], heat: Heat, t: typeof translations.es }) {
  const rankEmojis = ['🥇', '🥈', '🥉', '4️⃣']
  const rankColors = ['text-amber-400', 'text-slate-300', 'text-amber-700', 'text-slate-500']

  return (
    <div className="space-y-3">
      {[...results].sort((a,b) => a.rank - b.rank).map(r => (
        <div key={r.surfer_index} className={`bg-slate-900 rounded-2xl p-4 border ${r.rank === 1 ? 'border-amber-600/50' : 'border-slate-800'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{rankEmojis[r.rank-1]}</span>
              <div>
                <div className="font-bold text-white text-lg">{r.name}</div>
                <div className="text-slate-400 text-xs">
                  {r.top2.length > 0 ? `${t.best} ${r.top2.map(s=>s.toFixed(2)).join(' + ')}` : t.noWaves}
                </div>
              </div>
            </div>
            <div className={`text-3xl font-black font-mono ${rankColors[r.rank-1]}`}>{r.total.toFixed(2)}</div>
          </div>

          {r.waves.length > 0 && (
            <div className="space-y-1">
              {r.waves.map(w => (
                <div key={w.wave_number} className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 w-14">Ola {w.wave_number}</span>
                  <div className="flex gap-1 flex-1">
                    {w.judge_scores.map((s, ji) => (
                      <span key={ji} className={`px-2 py-0.5 rounded font-mono ${s !== null ? 'bg-slate-700 text-slate-200' : 'bg-slate-800 text-slate-600'}`}>
                        {s !== null ? s.toFixed(1) : '—'}
                      </span>
                    ))}
                  </div>
                  {w.computed !== null && (
                    <span className={`font-bold font-mono ${r.top2.includes(w.computed) ? 'text-sky-400' : 'text-slate-400'}`}>
                      = {w.computed.toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {r.needs_to_advance !== null && r.needs_to_advance > 0 && (
            <div className="mt-2 text-xs text-amber-400/70 border-t border-slate-800 pt-2">
              {t.needsToAdvance(r.needs_to_advance, r.rank - 1)}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function HeadJudgePage() {
  const params = useSearchParams()
  const code = params.get('code') ?? ''
  const { lang } = useLang()
  const t = translations[lang]

  const [heat, setHeat] = useState<Heat | null>(null)
  const [scores, setScores] = useState<Score[]>([])
  const [results, setResults] = useState<SurferResult[]>([])
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [judgeProgress, setJudgeProgress] = useState<Record<number, number>>({})

  const refreshScores = useCallback(async (heatData: Heat) => {
    const res = await fetch(`/api/scores?heat_id=${heatData.id}`)
    const data: Score[] = await res.json()
    setScores(data)
    setResults(computeResults(heatData, data))
    const progress: Record<number, number> = {}
    for (let j = 1; j <= heatData.judge_count; j++) {
      progress[j] = data.filter(s => s.judge_number === j).length
    }
    setJudgeProgress(progress)
  }, [])

  useEffect(() => {
    if (!code) return
    fetch(`/api/heats/${code}`)
      .then(r => r.json())
      .then(async (h: Heat) => {
        setHeat(h)
        await refreshScores(h)
        supabase.channel(`heat-${h.id}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sj_scores', filter: `heat_id=eq.${h.id}` },
            () => refreshScores(h))
          .subscribe()
      })
      .catch(() => setError(t.heatNotFound))
  }, [code, refreshScores])

  function copyCode() {
    if (!heat) return
    navigator.clipboard.writeText(heat.code)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
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
    <main className="min-h-screen px-4 py-6 pb-16 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-amber-400 text-xs uppercase tracking-wider">{t.headJudgeTitle}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-white font-mono font-bold text-2xl">{heat.code}</span>
            <button onClick={copyCode} className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded-lg text-slate-300 transition-colors">
              {copied ? t.copied : t.copy}
            </button>
          </div>
          <div className="text-slate-500 text-xs">{heat.judge_count} {t.judges} · {heat.surfer_count} {t.competitors}</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <LangToggle />
          <a href="/" className="text-slate-500 text-sm">{t.exit}</a>
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl p-3 mb-4 border border-slate-800">
        <div className="text-slate-400 text-xs uppercase tracking-wider mb-2">{t.judgesConnected}</div>
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: heat.judge_count }, (_, i) => i+1).map(j => (
            <div key={j} className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${judgeProgress[j] > 0 ? 'bg-green-900/50 text-green-400 border border-green-700' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
              J{j} {judgeProgress[j] > 0 ? `✓ ${judgeProgress[j]}` : '···'}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-sky-950/50 border border-sky-800/50 rounded-xl px-4 py-3 mb-6 text-xs text-sky-300">
        {t.shareCode(heat.code, heat.judge_count)}
      </div>

      {results.length > 0
        ? <Scoreboard results={results} heat={heat} t={t} />
        : <div className="text-center py-12 text-slate-600"><div className="text-4xl mb-2">🌊</div><p>{t.waitingScores}</p></div>
      }

      <div className="mt-4 text-center text-slate-600 text-xs">{t.scoresRegistered(scores.length)}</div>
    </main>
  )
}

export default function HeadJudgeWrapper() {
  return <Suspense><HeadJudgePage /></Suspense>
}
