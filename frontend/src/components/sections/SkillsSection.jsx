import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSkills } from "@/hooks/useSkills";
import Section from "@/components/layout/Section";
import ErrorNote from "@/components/ui/ErrorNote";
import TechIcon from "@/components/ui/TechIcon";

// Mesma ordem das CATEGORY_CHOICES do model Skill no backend.
const ORDER = ["backend", "frontend", "infra", "devops", "testing", "ai"];

function StackTable({ grouped, t }) {
  return (
    <dl className="border-b border-rule">
      {ORDER.filter((cat) => grouped[cat]).map((cat) => (
        <div key={cat} className="grid gap-1 border-t border-rule py-5 sm:grid-cols-9 sm:gap-6">
          <dt className="text-sm font-semibold text-muted sm:col-span-2 sm:pt-1">
            {t(`skills.categories.${cat}`)}
          </dt>
          <dd className="sm:col-span-7">
            <ul className="flex flex-wrap gap-x-6 gap-y-3 text-lead font-semibold">
              {grouped[cat].map((s) => (
                <li key={s.id} className="inline-flex items-center gap-2">
                  <TechIcon name={s.icon_name} className="text-[1.1em]" />
                  {s.name}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function SkillsSection() {
  const { t } = useTranslation();
  const { data: skills, loading, error } = useSkills();
  // Destaque circular: uma cópia da tabela na cor de sinal, recortada por uma
  // máscara que segue o mouse (ver .spotlight-layer em index.css). Só é montada
  // no primeiro hover de mouse, para não duplicar o DOM de quem nunca passa por aqui.
  const [armed, setArmed] = useState(false);
  const layerRef = useRef(null);

  // reduce em vez de Object.groupBy (ES2024): Safari antes do 17.4 não tem.
  const grouped = skills.reduce((acc, skill) => {
    (acc[skill.category] ??= []).push(skill);
    return acc;
  }, {});

  // Posição direto no DOM via variáveis CSS: sem re-render a cada movimento.
  const follow = (e) => {
    const layer = layerRef.current;
    if (e.pointerType !== "mouse" || !layer) return;
    const box = e.currentTarget.getBoundingClientRect();
    layer.style.setProperty("--spot-x", `${e.clientX - box.left}px`);
    layer.style.setProperty("--spot-y", `${e.clientY - box.top}px`);
    layer.dataset.active = "true";
  };

  const arm = (e) => {
    if (e.pointerType !== "mouse") return;
    setArmed(true);
    follow(e);
  };

  const hide = () => {
    if (layerRef.current) layerRef.current.dataset.active = "false";
  };

  return (
    <Section id="skills" title={t("skills.title")}>
      {error && <ErrorNote>{t("states.error")}</ErrorNote>}
      {loading && (
        <div aria-hidden="true" className="space-y-5 border-t border-rule pt-5">
          <span className="skeleton h-5 w-3/5" />
          <span className="skeleton h-5 w-2/5" />
        </div>
      )}

      <div
        data-spotlight
        className="relative"
        onPointerEnter={arm}
        onPointerMove={follow}
        onPointerLeave={hide}
      >
        <StackTable grouped={grouped} t={t} />
        {armed && (
          <div
            ref={layerRef}
            data-spotlight-layer
            aria-hidden="true"
            className="spotlight-layer pointer-events-none absolute inset-0 select-none [&_*]:!border-transparent [&_*]:!text-signal"
          >
            <StackTable grouped={grouped} t={t} />
          </div>
        )}
      </div>
    </Section>
  );
}
