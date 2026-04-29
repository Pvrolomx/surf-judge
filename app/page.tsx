'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/lang-context'
import { LangToggle } from '@/lib/lang-toggle'
import { translations } from '@/lib/i18n'

export default function Home() {
  const router = useRouter()
  const { lang } = useLang()
  const t = translations[lang]
  const [judgeCode, setJudgeCode] = useState('')
  const [judgeNum, setJudgeNum] = useState('')
  const [hjCode, setHjCode] = useState('')
  const [tournCode, setTournCode] = useState('')
  const [announcerCode, setAnnouncerCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  async function joinAsJudge() {
    if (!judgeCode || !judgeNum) return
    setJoining(true); setError('')
    const res = await fetch(`/api/heats/${judgeCode.toUpperCase()}`)
    if (!res.ok) { setError(t.codeNotFound); setJoining(false); return }
    const heat = await res.json()
    const jn = Number(judgeNum)
    if (jn < 1 || jn > heat.judge_count) { setError(t.heatHasJudges(heat.judge_count)); setJoining(false); return }
    router.push(`/judge?code=${judgeCode.toUpperCase()}&judge=${judgeNum}&lang=${lang}`)
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 py-8 pb-16">
      <div className="fixed top-4 right-4"><LangToggle /></div>

      {/* Logo */}
      <div className="mb-6 text-center">
        <div className="text-6xl mb-2">🏄</div>
        <h1 className="text-3xl font-black tracking-tight text-sky-400">SURF JUDGE</h1>
        <p className="text-slate-400 text-sm mt-1">{t.appSubtitle}</p>
      </div>

      <div className="w-full max-w-sm space-y-4">

        {/* Judge */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
          <h2 className="text-sky-400 font-bold text-base mb-3 flex items-center gap-2">⚖️ {t.enterAsJudge}</h2>
          <div className="space-y-2">
            <input type="text" value={judgeCode} onChange={e => setJudgeCode(e.target.value.toUpperCase())}
              maxLength={6} placeholder={t.heatCode}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg font-mono tracking-[0.2em] uppercase focus:outline-none focus:border-sky-500" />
            <input type="number" value={judgeNum} onChange={e => setJudgeNum(e.target.value)}
              min={1} max={5} placeholder={t.judgeNumber}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500" />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button onClick={joinAsJudge} disabled={joining || !judgeCode || !judgeNum}
              className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors score-btn">
              {joining ? t.connecting : t.enterHeat}
            </button>
          </div>
        </div>

        {/* Head Judge */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
          <h2 className="text-amber-400 font-bold text-base mb-3 flex items-center gap-2">👑 {t.headJudge}</h2>
          <div className="space-y-2">
            <input type="text" value={hjCode} onChange={e => setHjCode(e.target.value.toUpperCase())}
              maxLength={6} placeholder={t.heatCode}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg font-mono tracking-[0.2em] uppercase focus:outline-none focus:border-amber-500" />
            <div className="flex gap-2">
              <button onClick={() => hjCode && router.push(`/headjudge?code=${hjCode}&lang=${lang}`)}
                disabled={!hjCode}
                className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors score-btn text-sm">
                {t.monitor}
              </button>
              <button onClick={() => router.push(`/setup?lang=${lang}`)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors score-btn text-sm">
                {t.newHeat}
              </button>
            </div>
          </div>
        </div>

        {/* Announcer */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
          <h2 className="text-purple-400 font-bold text-base mb-3 flex items-center gap-2">🎙️ {t.announcerTitle.replace('🎙️ ','')}</h2>
          <div className="flex gap-2">
            <input type="text" value={announcerCode} onChange={e => setAnnouncerCode(e.target.value.toUpperCase())}
              maxLength={6} placeholder={t.heatCode}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg font-mono tracking-[0.2em] uppercase focus:outline-none focus:border-purple-500" />
            <button onClick={() => announcerCode && router.push(`/announcer?code=${announcerCode}&lang=${lang}`)}
              disabled={!announcerCode}
              className="bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white font-bold px-4 py-3 rounded-xl transition-colors score-btn text-sm">
              {t.monitor}
            </button>
          </div>
        </div>

        {/* Tournament */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-amber-900/30">
          <h2 className="text-amber-400 font-bold text-base mb-3 flex items-center gap-2">🏆 {t.joinTournament}</h2>
          <div className="space-y-2">
            <input type="text" value={tournCode} onChange={e => setTournCode(e.target.value.toUpperCase())}
              maxLength={6} placeholder={t.tournamentCode}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg font-mono tracking-[0.2em] uppercase focus:outline-none focus:border-amber-500" />
            <div className="flex gap-2">
              <button onClick={() => tournCode && router.push(`/tournament/bracket?id=${tournCode}&lang=${lang}`)}
                disabled={!tournCode}
                className="flex-1 bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors score-btn text-sm">
                {t.enterTournament}
              </button>
              <button onClick={() => router.push(`/tournament/new?lang=${lang}`)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors score-btn text-sm">
                {t.newTournament}
              </button>
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}
