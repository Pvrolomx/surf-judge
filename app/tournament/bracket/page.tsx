'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLang } from '@/lib/lang-context'
import { LangToggle } from '@/lib/lang-toggle'
import { translations } from '@/lib/i18n'
import { totalRounds } from '@/lib/bracket'
import type { Tournament, BracketSlot } from '@/lib/types'

function RoundLabel({ round, maxRound, t }: { round: number, maxRound: number, t: typeof translations.es }) {
  if (round === maxRound) return <span className="text-amber-400 font-black">{t.final.toUpperCase()}</span>
  if (round === maxRound - 1 && maxRound > 2) return <span className="text-sky-400 font-bold">{t.semifinal.toUpperCase()}</span>
  return <span className="text-slate-400 font-bold">{t.round.toUpperCase()} {round}</span>
}

function SlotCard({
  slot, tournament, t, onOpenHeat, onSetWinner, openingSlot, settingWinner
}: {
  slot: BracketSlot
  tournament: Tournament
  t: typeof translations.es
  onOpenHeat: (slotId: string) => void
  onSetWinner: (slotId: string, winnerIdx: number) => void
  openingSlot: string | null
  settingWinner: string | null
}) {
  const [showWinnerPicker, setShowWinnerPicker] = useState(false)
  const surferNames = slot.surfer_indices.map(i => tournament.surfers[i])
  const winnerName = slot.winner_index !== null ? tournament.surfers[slot.winner_index] : null
  const isBye = slot.surfer_indices.length === 1 && slot.status === 'finished'

  return (
    <div className={`rounded-xl p-3 border text-sm transition-all ${
      slot.status === 'finished' ? 'bg-slate-900 border-green-800/40' :
      slot.status === 'open' ? 'bg-sky-950/40 border-sky-700/50' :
      'bg-slate-900/50 border-slate-800'
    }`}>
      {/* Surfer names */}
      {surferNames.length === 0 ? (
        <div className="text-slate-600 text-xs text-center py-1">{t.heatPending}</div>
      ) : isBye ? (
        <div className="flex items-center gap-2">
          <span className="text-slate-300 font-semibold">{surferNames[0]}</span>
          <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">{t.bye}</span>
        </div>
      ) : (
        <div className="space-y-1 mb-2">
          {surferNames.map((name, i) => (
            <div key={i} className={`flex items-center gap-2 ${slot.winner_index === slot.surfer_indices[i] ? 'text-amber-400 font-bold' : 'text-slate-300'}`}>
              {slot.winner_index === slot.surfer_indices[i] && <span>🏆</span>}
              <span className="truncate">{name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Status badge */}
      {slot.status === 'open' && slot.heat_id && (
        <div className="text-xs text-sky-400 mb-2 flex items-center gap-1">
          <span className="animate-pulse">●</span> {t.heatOpen}
        </div>
      )}

      {/* Actions */}
      {slot.status === 'pending' && surferNames.length === 2 && (
        <button onClick={() => onOpenHeat(slot.id)}
          disabled={openingSlot === slot.id}
          className="w-full mt-1 bg-sky-700 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-lg transition-colors score-btn">
          {openingSlot === slot.id ? '...' : t.openHeat}
        </button>
      )}

      {slot.status === 'open' && !showWinnerPicker && (
        <button onClick={() => setShowWinnerPicker(true)}
          className="w-full mt-1 bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold py-2 rounded-lg transition-colors score-btn">
          {t.markWinner}
        </button>
      )}

      {showWinnerPicker && slot.status === 'open' && (
        <div className="mt-1 space-y-1">
          {surferNames.map((name, i) => (
            <button key={i}
              onClick={() => { onSetWinner(slot.id, slot.surfer_indices[i]); setShowWinnerPicker(false) }}
              disabled={settingWinner === slot.id}
              className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-lg transition-colors score-btn">
              🏆 {name}
            </button>
          ))}
          <button onClick={() => setShowWinnerPicker(false)} className="w-full text-slate-500 text-xs py-1">{t.back}</button>
        </div>
      )}
    </div>
  )
}

function BracketPage() {
  const params = useSearchParams()
  const router = useRouter()
  const id = params.get('id') ?? ''
  const { lang } = useLang()
  const t = translations[lang]

  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [slots, setSlots] = useState<BracketSlot[]>([])
  const [error, setError] = useState('')
  const [openingSlot, setOpeningSlot] = useState<string | null>(null)
  const [settingWinner, setSettingWinner] = useState<string | null>(null)
  const [copiedHeat, setCopiedHeat] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/tournaments/${id}`)
    if (!res.ok) { setError(t.tournamentNotFound); return }
    const data = await res.json()
    setTournament(data.tournament)
    setSlots(data.slots)
  }, [id, t])

  useEffect(() => { if (id) refresh() }, [id, refresh])

  async function openHeat(slotId: string) {
    setOpeningSlot(slotId)
    const res = await fetch(`/api/tournaments/${tournament!.id}/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot_id: slotId, action: 'open_heat' })
    })
    const data = await res.json()
    setOpeningSlot(null)
    await refresh()
    // Auto-copy heat code
    if (data.heat?.code) {
      navigator.clipboard.writeText(data.heat.code).catch(() => {})
      setCopiedHeat(data.heat.code)
      setTimeout(() => setCopiedHeat(null), 4000)
    }
  }

  async function setWinner(slotId: string, winnerIdx: number) {
    setSettingWinner(slotId)
    await fetch(`/api/tournaments/${tournament!.id}/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot_id: slotId, winner_index: winnerIdx, action: 'set_winner' })
    })
    setSettingWinner(null)
    await refresh()
  }

  if (error) return (
    <main className="flex items-center justify-center min-h-screen px-4">
      <div className="text-center"><p className="text-red-400 text-xl">{error}</p><a href="/" className="text-sky-400 mt-4 block">{t.back}</a></div>
    </main>
  )
  if (!tournament) return (
    <main className="flex items-center justify-center min-h-screen">
      <p className="text-slate-400 animate-pulse">{t.connecting}</p>
    </main>
  )

  const maxRound = Math.max(...slots.map(s => s.round), 1)
  const rounds = Array.from({ length: maxRound }, (_, i) => i + 1)
  const champion = slots.find(s => s.round === maxRound && s.winner_index !== null)

  return (
    <main className="min-h-screen px-4 py-6 pb-16">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 max-w-4xl mx-auto">
        <div>
          <div className="text-amber-400 text-xs uppercase tracking-wider">🏆 {t.bracketTitle}</div>
          {tournament.name && <div className="text-white font-black text-xl mt-1">{tournament.name}</div>}
          <div className="text-slate-500 text-xs mt-1">
            {t.surferCount(tournament.surfers.length)} · {tournament.judge_count} {t.judges} · {tournament.code}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <LangToggle />
          <a href="/" className="text-slate-500 text-sm">{t.exit}</a>
        </div>
      </div>

      {/* Champion banner */}
      {champion && (
        <div className="max-w-4xl mx-auto mb-4 bg-amber-900/40 border border-amber-600 rounded-2xl p-4 text-center">
          <div className="text-3xl mb-1">🏆</div>
          <div className="text-amber-400 font-black text-2xl">{tournament.surfers[champion.winner_index!]}</div>
          <div className="text-amber-300/70 text-sm">{t.champion}</div>
        </div>
      )}

      {/* Copied heat code toast */}
      {copiedHeat && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-sky-800 border border-sky-600 rounded-xl px-4 py-2 text-sky-200 text-sm font-bold shadow-xl">
          📋 {t.copyHeatCode}: <span className="font-mono">{copiedHeat}</span>
        </div>
      )}

      {/* Bracket — horizontal scroll on mobile */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max max-w-4xl mx-auto">
          {rounds.map(round => {
            const roundSlots = slots.filter(s => s.round === round).sort((a,b) => a.position - b.position)
            return (
              <div key={round} className="flex flex-col gap-2" style={{ minWidth: '180px', maxWidth: '220px' }}>
                {/* Round header */}
                <div className="text-center py-2 text-xs uppercase tracking-wider">
                  <RoundLabel round={round} maxRound={maxRound} t={t} />
                </div>
                {/* Slots */}
                <div className="flex flex-col gap-3">
                  {roundSlots.map(slot => (
                    <SlotCard key={slot.id} slot={slot} tournament={tournament} t={t}
                      onOpenHeat={openHeat} onSetWinner={setWinner}
                      openingSlot={openingSlot} settingWinner={settingWinner} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}

export default function BracketWrapper() {
  return <Suspense><BracketPage /></Suspense>
}
