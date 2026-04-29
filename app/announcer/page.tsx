'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLang } from '@/lib/lang-context'
import { LangToggle } from '@/lib/lang-toggle'
import { translations } from '@/lib/i18n'
import type { Heat, Score, SurferResult } from '@/lib/types'
import { computeResults } from '@/lib/scoring'
import { supabase } from '@/lib/supabase'

// Reuse the same scoreboard component logic as headjudge but read-only
function AnnouncerPage() {
  const params = useSearchParams()
  const code = params.get('code') ?? ''
  const { lang } = useLang()
  const t = translations[lang]

  const [heat, setHeat] = useState<Heat | null>(null)
  const [scores, setScores] = useState<Score[]>([])
  const [results, setResults] = useState<SurferResult[]>([])
  const [error, setError] = useState('')

  const refreshScores = useCallback(async (heatData: Heat) => {
    const res = await fetch(`/api/scores?heat_id=${heatData.id}`)
    const data: Score[] = await res.json()
    setScores(data)
    setResults(computeResults(heatData, data))
  }, [])

  useEffect(() => {
    if (!code) return
    fetch(`/api/heats/${code}`)
      .then(r => r.json())
      .then(async (h: Heat) => {
        setHeat(h)
        await refreshScores(h)
        supabase.channel(`announcer-${h.id}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sj_scores', filter: `heat_id=eq.${h.id}` },
            () => refreshScores(h))
          .subscribe()
      })
      .catch(() => setError(t.heatNotFound))
  }, [code, refreshScores])

  const rankEmojis = ['🥇', '🥈', '🥉', '4️⃣']
  const rankColors = ['text-amber-400', 'text-slate-300', 'text-amber-700', 'text-slate-500']

  if (error) return (
    <main className="flex items-center justify-center min-h-screen px-4">
      <div className="text-center"><p className="text-red-400 text-xl">{error}</p><a href="/" className="text-sky-400 mt-4 block">{t.back}</a></div>
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
          <div className="text-purple-400 text-xs uppercase tracking-wider">{t.announcerTitle}</div>
          <div className="text-white font-mono font-bold text-2xl">{heat.code}</div>
          <div className="text-slate-500 text-xs">{heat.judge_count} {t.judges} · {t.readOnly}</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <LangToggle />
          <a href="/" className="text-slate-500 text-sm">{t.exit}</a>
        </div>
      </div>

      {/* Read-only badge */}
      <div className="bg-purple-950/40 border border-purple-800/50 rounded-xl px-4 py-2 mb-4 text-xs text-purple-300 flex items-center gap-2">
        <span className="animate-pulse">●</span> {t.readOnly}
      </div>

      {results.length > 0 ? (
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
              {/* Computed scores only — no individual judge breakdown for announcer */}
              {r.waves.filter(w => w.computed !== null).length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {r.waves.filter(w => w.computed !== null).map(w => (
                    <span key={w.wave_number}
                      className={`px-2 py-1 rounded-lg text-xs font-mono font-bold ${r.top2.includes(w.computed!) ? 'bg-sky-900/60 text-sky-300 border border-sky-700' : 'bg-slate-800 text-slate-400'}`}>
                      {w.computed!.toFixed(2)}
                    </span>
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
      ) : (
        <div className="text-center py-12 text-slate-600">
          <div className="text-4xl mb-2">🌊</div>
          <p>{t.waitingScores}</p>
        </div>
      )}
      <div className="mt-4 text-center text-slate-600 text-xs">{t.scoresRegistered(scores.length)}</div>
    </main>
  )
}

export default function AnnouncerWrapper() {
  return <Suspense><AnnouncerPage /></Suspense>
}
