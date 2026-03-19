// frontend/src/components/layout/Navbar.jsx
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store/useAppStore'

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const { theme, toggleTheme, lang, toggleLang } = useAppStore()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const handleLangToggle = () => {
    toggleLang()
    i18n.changeLanguage(lang === 'pt' ? 'en' : 'pt')
  }

  return (
    <nav className={`fixed top-0 inset-x-0 z-40 transition-all duration-500 ${
      scrolled
        ? 'bg-slate-900/40 backdrop-blur-md border-b border-white/5'
        : 'bg-transparent'
    }`}>
      <div className="w-full px-10 h-20 flex items-center justify-between">
        <span className="font-mono font-bold text-base text-white/90">
          &lt;Portfolio /&gt;
        </span>

        <div className="flex items-center gap-10">
          {['home', 'skills', 'projects'].map((s) => (
            <a key={s} href={`#${s}`}
               className="text-sm font-medium text-white/60 hover:text-white transition-colors tracking-wide">
              {t(`nav.${s}`)}
            </a>
          ))}

          <button onClick={handleLangToggle}
                  className="text-sm font-mono px-3 py-1.5 border border-white/20 rounded hover:border-white/50 text-white/60 hover:text-white transition-all">
            {lang === 'pt' ? 'EN' : 'PT'}
          </button>

          <button onClick={toggleTheme}
                  className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all"
                  aria-label="Toggle theme">
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </nav>
  )
}