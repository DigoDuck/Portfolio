import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FiMenu, FiMoon, FiSun, FiX } from "react-icons/fi";
import { useAppStore } from "@/store/useAppStore";

const SECTIONS = ["projects", "about", "skills", "contact"];

export default function Navbar({ name }) {
  const { t } = useTranslation();
  const { theme, toggleTheme, lang, toggleLang } = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-rule bg-bg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:bg-bg focus:px-3 focus:py-2"
      >
        {t("a11y.skipToContent")}
      </a>

      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-8">
        <a href="#home" className="min-w-0 truncate text-lg font-extrabold tracking-tight">
          {name}
        </a>

        <ul className="hidden items-center gap-8 text-sm font-semibold md:flex">
          {SECTIONS.map((s) => (
            <li key={s}>
              <a href={`#${s}`} className="text-muted transition-colors hover:text-ink">
                {t(`nav.${s}`)}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleLang}
            aria-label={t("a11y.switchLanguage")}
            className="px-3 py-2 text-sm font-bold tracking-wide transition-colors hover:text-signal"
          >
            {lang === "pt" ? "PT" : "EN"}
          </button>

          <button
            onClick={toggleTheme}
            aria-label={t("a11y.darkMode")}
            aria-pressed={theme === "dark"}
            className="p-2.5 transition-colors hover:text-signal"
          >
            {theme === "dark" ? <FiMoon aria-hidden="true" /> : <FiSun aria-hidden="true" />}
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={t("a11y.menu")}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="p-2.5 md:hidden"
          >
            {menuOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {/* Fechado, o painel só some por altura: inert tira os links do Tab. */}
      <div
        id="mobile-menu"
        inert={!menuOpen}
        className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out-quart md:hidden ${
          menuOpen ? "grid-rows-[1fr] border-t border-rule" : "grid-rows-[0fr]"
        }`}
      >
        <ul className="min-h-0 px-4 sm:px-8">
          {SECTIONS.map((s) => (
            <li key={s} className="border-b border-rule last:border-b-0">
              <a
                href={`#${s}`}
                onClick={() => setMenuOpen(false)}
                className="block py-4 text-lg font-semibold"
              >
                {t(`nav.${s}`)}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
