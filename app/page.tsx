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
  const [joinCode, setJoinCode] = useState('')
  const [judgeNum, setJudgeNum] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  async function joinAsJudge() {
    if (!joinCode || !judgeNum) return
    setJoining(true); setError('')
    const res = await fetch(`/api/heats/${joinCode.toUpperCase()}`)
    if (!res.ok) { setError(t.codeNotFound); setJoining(false); return }
    const heat = await res.json()
    const jn = Number(judgeNum)
    if (jn < 1 || jn > heat.judge_count) { setError(t.heatHasJudges(heat.judge_count)); setJoining(false); return }
    router.push(`/judge?code=${joinCode.toUpperCase()}&judge=${judgeNum}&lang=${lang}`)
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 pb-8">
      {/* Lang toggle top right */}
      <div className="fixed top-4 right-4"><LangToggle /></div>

      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="text-6xl mb-2">🏄</div>
        <h1 className="text-3xl font-black tracking-tight text-sky-400">{t.appName.toUpperCase()}</h1>
        <p className="text-slate-400 text-sm mt-1">{t.appSubtitle}</p>
      </div>

      {/* Judge Join */}
      <div className="w-full max-w-sm bg-slate-900 rounded-2xl p-6 mb-4 border border-slate-800">
        <h2 className="text-sky-400 font-bold text-lg mb-4 flex items-center gap-2">
          <span>⚖️</span> {t.enterAsJudge}
        </h2>
        <div className="space-y-3">
          <div>
            <label className="text-slate-400 text-xs uppercase tracking-wider">{t.heatCode}</label>
            <input type="text" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6} placeholder="ABC123"
              className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-xl font-mono tracking-[0.3em] uppercase focus:outline-none focus:border-sky-500" />
          </div>
          <div>
            <label className="text-slate-400 text-xs uppercase tracking-wider">{t.judgeNumber}</label>
            <input type="number" value={judgeNum} onChange={e => setJudgeNum(e.target.value)}
              min={1} max={5} placeholder="1"
              className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-xl font-mono focus:outline-none focus:border-sky-500" />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={joinAsJudge} disabled={joining || !joinCode || !judgeNum}
            className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-bold py-4 rounded-xl text-lg transition-colors score-btn">
            {joining ? t.connecting : t.enterHeat}
          </button>
        </div>
      </div>

      {/* Head Judge */}
      <div className="w-full max-w-sm bg-slate-900 rounded-2xl p-6 border border-slate-800">
        <h2 className="text-amber-400 font-bold text-lg mb-4 flex items-center gap-2">
          <span>👑</span> {t.headJudge}
        </h2>
        <div className="space-y-3">
          <div>
            <label className="text-slate-400 text-xs uppercase tracking-wider">{t.monitorHeat}</label>
            <input type="text" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6} placeholder="ABC123"
              className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-xl font-mono tracking-[0.3em] uppercase focus:outline-none focus:border-amber-500" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => joinCode && router.push(`/headjudge?code=${joinCode}&lang=${lang}`)}
              disabled={!joinCode}
              className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold py-4 rounded-xl text-base transition-colors score-btn">
              {t.monitor}
            </button>
            <button onClick={() => router.push(`/setup?lang=${lang}`)}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-xl text-base transition-colors score-btn">
              {t.newHeat}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
