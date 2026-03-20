import { useTranslation } from "react-i18next";
import { useProfile } from "@/hooks/useProfile";
import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";

function RotatingSeal({ text = 'Backend Developer' }) {
  const safeText = text || 'Backend Developer'

  return (
    <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[420px] lg:h-[420px] flex items-center justify-center">
      <div className="absolute w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 rounded-full overflow-hidden ring-2 ring-sky-500/40">
        <img src="/profile.jpg" alt="Profile" className="w-full h-full object-cover" />
      </div>
      <svg viewBox="0 0 200 200" className="absolute w-full h-full animate-spin-slow" aria-hidden>
        <defs>
          <path id="cp" d="M100,100 m-70,0 a70,70 0 1,1 140,0 a70,70 0 1,1 -140,0" />
        </defs>
        <text className="fill-sky-500 dark:fill-sky-400" fontSize="10.5" fontFamily="JetBrains Mono, monospace" letterSpacing="2">
          <textPath href="#cp">{(safeText + ' · ').repeat(3)}</textPath>
        </text>
      </svg>
    </div>
  )
}

export default function HeroSection() { /* Corpo Principal */
  const { t } = useTranslation();
  const { data: profile, loading } = useProfile();

  if (loading) {
    return (
      <section
        id="home"
        className="min-h-screen flex items-center justify-center"
      >
        <div className="animate-pulse w-8 h-8 rounded-full bg-primary-500" />
      </section>
    );
  }

  return (
    <section
      id="home"
      className="min-h-screen flex items-center relative overflow-hidden"
    >
      {/* Gradiente de Fundo */}
      <div
        className="absolute inset-0 opacity-20 dark:opacity-10 gradient-animated"
        style={{
          background: "linear-gradient(135deg, #0ea5e9, #8b5cf6, #06b6d4)",
        }}
      />

      <div className="container mx-auto px-10 pt-28 pb-20 relative z-10">
        <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-10 md:gap-12">
          
          {/* Lado Esquerdo: Texto */}
          <div className="flex-1 space-y-5 text-center md:text-left">
            <p className="ml-1 text-primary-600 font-mono text-2xl tracking-widest uppercase animate-fade-up">
              {t("hero.greeting")}
            </p>

            {/* Nome com animação de entrada */}
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold text-slate-900 dark:text-white animate-fade-up"
              style={{ animationDelay: "0.1s", opacity: 0 }}
            >
              {profile?.full_name}
            </h1>

            <h2
              className="text-xl md:text-3xl text-primary-600 font-semibold animate-fade-up"
              style={{ animationDelay: "0.2s", opacity: 0 }}
            >
              {profile?.role}
            </h2>

            {/* Links sociais */}
            <div
              className="flex gap-6 justify-center md:justify-start animate-fade-up"
              style={{ animationDelay: "0.4s", opacity: 0 }}
            >
              {profile?.github_url && (
                <a
                  href={profile.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white transition-all hover:scale-110"
                  aria-label="GitHub"
                >
                  <FaGithub size={40} />
                </a>
              )}
              {profile?.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white transition-all hover:scale-110"
                  aria-label="LinkedIn"
                >
                  <FaLinkedin size={40} />
                </a>
              )}
              {profile?.email && (
                <a
                  href={`mailto:${profile.email}`}
                  className="text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white transition-all hover:scale-110"
                  aria-label="Email"
                >
                  <FaEnvelope size={40} />
                </a>
              )}
            </div>
          </div>

          {/* Lado Direito: Foto + Selo */}
          <div
            className="flex-shrink-0 animate-fade-up"
            style={{ animationDelay: "0.2s", opacity: 0 }}
          >
            <RotatingSeal
              text={profile?.rotating_seal_text || "Backend Engineer"}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
