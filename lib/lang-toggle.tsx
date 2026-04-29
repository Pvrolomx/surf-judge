'use client'
import { useLang } from './lang-context'
import type { Lang } from './i18n'

const FLAGS: Record<Lang, string> = { es: '🇲🇽', en: '🇺🇸', fr: '🇫🇷' }

export function LangToggle() {
  const { lang, setLang } = useLang()
  const langs: Lang[] = ['es', 'en', 'fr']
  return (
    <div className="flex gap-1 bg-slate-800 rounded-xl p-1">
      {langs.map(l => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${lang === l ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          {FLAGS[l]} {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
