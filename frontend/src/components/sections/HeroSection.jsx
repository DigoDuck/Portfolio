import { useState } from "react";
import { useTranslation } from "react-i18next";
import ErrorNote from "@/components/ui/ErrorNote";
import SocialLinks from "@/components/ui/SocialLinks";
import Spotlight from "@/components/ui/Spotlight";

// O seal_text foi escrito para o selo circular antigo e termina em " · ", que
// servia de emenda entre as repetições. Numa linha única, a emenda sobra.
const statusFrom = (sealText) => sealText?.replace(/[\s·]+$/, "");

export default function HeroSection({ profile, loading, error }) {
  const { t } = useTranslation();
  const name = profile?.full_name;
  // A mídia do backend pode falhar (em produção, /media/ dá 404 até existir um
  // storage persistente, ver T-002). Nesse caso, fica a foto estática do build.
  const [photoFailed, setPhotoFailed] = useState(false);

  return (
    <section
      id="home"
      aria-busy={loading}
      className="mx-auto max-w-6xl px-4 pb-20 pt-28 sm:px-8 md:pb-28 md:pt-40"
    >
      {error && (
        <ErrorNote role="status" className="mb-8">
          {t("states.error")}
        </ErrorNote>
      )}

      <div className="grid gap-12 md:grid-cols-12 md:items-end md:gap-6">
        <div className="md:col-span-8">
          <p className="rise flex items-center gap-2.5 text-sm font-semibold" style={{ "--i": 0 }}>
            <span aria-hidden="true" className="size-2 rounded-full bg-signal" />
            {statusFrom(profile?.seal_text) || t("hero.available")}
          </p>

          <h1 className="rise mt-6 text-display font-extrabold" style={{ "--i": 1 }}>
            {loading ? <span className="skeleton h-[0.9em] w-[8ch]" /> : name}
          </h1>

          {profile?.role && (
            <p className="rise mt-4 text-lead font-semibold" style={{ "--i": 2 }}>
              {profile.role}
            </p>
          )}

          <Spotlight as="p" className="rise mt-6 max-w-[52ch] text-lead text-muted" style={{ "--i": 3 }}>
            {t("hero.pitch")}
          </Spotlight>

          <div
            className="rise mt-10 flex flex-wrap items-center gap-x-8 gap-y-5"
            style={{ "--i": 4 }}
          >
            <a href="#projects" className="btn-signal">
              {t("hero.cta")}
              <span aria-hidden="true">↓</span>
            </a>
            <SocialLinks profile={profile} className="text-sm" />
          </div>
        </div>

        <div className="rise md:col-span-4" style={{ "--i": 2 }}>
          <img
            src={(!photoFailed && profile?.photo) || "/profile.jpg"}
            onError={() => setPhotoFailed(true)}
            alt={name ? t("hero.photoAlt", { name }) : t("hero.photoAltAnon")}
            width="480"
            height="480"
            className="aspect-square w-full max-w-[14rem] rounded-full border border-rule bg-surface object-cover sm:max-w-[18rem] md:ml-auto md:max-w-[20rem]"
          />
        </div>
      </div>
    </section>
  );
}
