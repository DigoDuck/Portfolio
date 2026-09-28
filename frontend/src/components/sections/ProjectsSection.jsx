import { lazy, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { useProjects } from "@/hooks/useProjects";
import Section from "@/components/layout/Section";
import ErrorNote from "@/components/ui/ErrorNote";
import TechIcon from "@/components/ui/TechIcon";
import api from "@/api/client";

// Sob demanda: o modal traz react-markdown e remark-gfm, que só servem depois
// do primeiro clique em um estudo de caso.
const ProjectModal = lazy(() => import("@/components/ui/ProjectModal"));

function ProjectRow({ project, onOpen, loading, failed }) {
  const { t } = useTranslation();
  // Imagem que não carrega some, em vez de deixar um ícone de imagem quebrada.
  const [thumbFailed, setThumbFailed] = useState(false);
  const showThumb = project.featured && project.thumbnail && !thumbFailed;

  return (
    <li className="group relative border-t border-rule">
      {/* Régua de sinal: cresce sobre a divisória quando a linha tem hover ou foco. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 -top-px h-0.5 origin-left scale-x-0 bg-signal transition-transform duration-500 ease-out-quart group-focus-within:scale-x-100 group-hover:scale-x-100"
      />
      <div className="grid gap-x-8 gap-y-4 py-7 sm:grid-cols-[1fr_auto]">
        <div>
          {showThumb && (
            <img
              src={project.thumbnail}
              alt=""
              loading="lazy"
              onError={() => setThumbFailed(true)}
              className="mb-5 aspect-[16/10] w-full max-w-md border border-rule bg-surface object-cover"
            />
          )}
          <h3 className="text-xl font-bold tracking-tight">
            {project.title}
            {project.featured && (
              <span className="ml-3 align-middle text-xs font-semibold text-signal">
                {t("projects.featured")}
              </span>
            )}
          </h3>
          <p className="mt-2 max-w-[60ch] text-muted">{project.short_description}</p>
          {project.skills.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold">
              {project.skills.map((s) => (
                <li key={s.id} className="inline-flex items-center gap-1.5">
                  <TechIcon name={s.icon_name} />
                  {s.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="sm:pt-1 sm:text-right">
          <button
            onClick={() => onOpen(project.slug)}
            // aria-disabled em vez de disabled: um botão desabilitado perde o foco,
            // e o modal não teria para onde devolvê-lo ao fechar.
            aria-disabled={loading}
            className="whitespace-nowrap font-semibold transition-colors after:absolute after:inset-0 group-hover:text-signal aria-disabled:text-muted"
          >
            {loading ? (
              t("states.loading")
            ) : (
              <>
                {t("projects.viewCase")}
                <span className="sr-only">, {project.title}</span>
                <span aria-hidden="true" className="ml-1 inline-block transition-transform duration-300 ease-out-quart group-hover:translate-x-1">
                  →
                </span>
              </>
            )}
          </button>
          {failed && <ErrorNote className="mt-2 sm:justify-end">{t("states.error")}</ErrorNote>}
        </div>
      </div>
    </li>
  );
}

function SkeletonRows() {
  return (
    <ul aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <li key={i} className="space-y-3 border-t border-rule py-7">
          <span className="skeleton h-6 w-2/5" />
          <span className="skeleton h-4 w-4/5" />
          <span className="skeleton h-4 w-1/3" />
        </li>
      ))}
    </ul>
  );
}

export default function ProjectsSection() {
  const { t } = useTranslation();
  const { data: projects, loading, error } = useProjects();
  const [selected, setSelected] = useState(null);
  const [loadingSlug, setLoadingSlug] = useState(null);
  const [errorSlug, setErrorSlug] = useState(null);

  const openProject = async (slug) => {
    if (loadingSlug) return;
    setLoadingSlug(slug);
    setErrorSlug(null);
    try {
      const res = await api.get(`/projects/${slug}/`);
      setSelected(res.data);
    } catch {
      // Sem isto o slug ficava preso em loadingSlug e o botão da linha
      // permanecia desabilitado até um reload da página.
      setErrorSlug(slug);
    } finally {
      setLoadingSlug(null);
    }
  };

  return (
    <Section id="projects" title={t("projects.title")}>
      <p className="mb-10 max-w-[60ch] text-muted">{t("projects.lead")}</p>

      {loading && <SkeletonRows />}
      {error && <ErrorNote>{t("states.error")}</ErrorNote>}
      {!loading && !error && projects.length === 0 && (
        <p className="border-t border-rule pt-7">{t("projects.empty")}</p>
      )}

      {projects.length > 0 && (
        <ul className="border-b border-rule">
          {projects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              onOpen={openProject}
              loading={loadingSlug === project.slug}
              failed={errorSlug === project.slug}
            />
          ))}
        </ul>
      )}

      {selected && (
        <Suspense fallback={null}>
          <ProjectModal project={selected} onClose={() => setSelected(null)} />
        </Suspense>
      )}
    </Section>
  );
}
