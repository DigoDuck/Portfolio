import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/store/useAppStore";

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme, lang, toggleLang } = useAppStore();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const handleLangToggle = () => {
    toggleLang();
    i18n.changeLanguage(lang === "pt" ? "en" : "pt");
  };

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-500 ${
        scrolled || menuOpen
          ? "bg-slate-900/40 backdrop-blur-md border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <div className="w-full px-10 h-20 flex items-center justify-between">
        <span className="font-mono font-bold text-3xl text-slate-900 dark:text-white/90">
          &lt;Portfolio /&gt;
        </span>

        <div className="hidden md:flex items-center gap-10">
          {["home", "skills", "projects"].map((s) => (
            <a
              key={s}
              href={`#${s}`}
              className="text-2xl font-medium text-slate-700 hover:text-slate-900 dark:text-white/60 transition-colors tracking-wide"
            >
              {t(`nav.${s}`)}
            </a>
          ))}

          <button
            onClick={handleLangToggle}
            className="text-base font-mono px-4 py-2 border border-slate-700 dark:border-white/20 rounded hover:border-slate-500 dark:hover:border-white/50 text-slate-700 dark:text-white/60 hover:text-slate-900 dark:hover:text-white transition-all"
          >
            {lang === "pt" ? "PT" : "EN"}
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 text-3xl rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
        </div>
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={handleLangToggle}
            className="text-sm font-mono px-3 py-1.5 border border-white/20 rounded text-white/60 hover:text-white transition-all"
          >
            {lang === "pt" ? "PT" : "EN"}
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 text-xl text-white/60 hover:text-white transition-all"
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-white/60 hover:text-white transition-all"
          >
            <div className="w-6 flex flex-col gap-1.5">
              <span
                className={`block h-0.5 bg-current transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
              />
              <span
                className={`block h-0.5 bg-current transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`}
              />
              <span
                className={`block h-0.5 bg-current transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
              />
            </div>
          </button>
        </div>
      </div>

      <div
        className={`md:hidden transition-all duration-300 overflow-hidden ${
          menuOpen ? "max-h-60 pb-4" : "max-h-0"
        }`}
      >
        <div className="flex flex-col items-center gap-4 pt-2">
          {["home", "skills", "projects"].map((s) => (
            <a
              key={s}
              href={`#${s}`}
              onClick={() => setMenuOpen(false)}
              className="text-lg font-medium text-white/70 hover:text-white transition-colors"
            >
              {t(`nav.${s}`)}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
