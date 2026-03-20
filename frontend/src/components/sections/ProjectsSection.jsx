import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useProjects } from "@/hooks/useProjects";
import { useInView } from "@/hooks/useInView";
import ProjectModal from "@/components/ui/ProjectModal";
import api from "@/api/client";

function ProjectCard({ project, onOpen, loadingSlug, t, index }) {
  const { ref, inView } = useInView();

  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`,
      }}
      className="rounded-2xl border border-brand-beige/10 bg-brand-navy/30 hover:border-brand-blue/40 hover:bg-brand-navy/50 transition-all hover:shadow-lg hover:shadow-brand-blue/5 overflow-hidden"
    >
      {project.thumbnail && (
        <img
          src={project.thumbnail}
          alt={project.title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-5">
        <h3 className="font-semibold text-brand-white mb-2">{project.title}</h3>
        <p className="text-sm text-brand-beige leading-relaxed mb-4">
          {project.short_description}
        </p>
        <div className="flex flex-wrap gap-5 mb-5">
          {project.skills.map((s) => (
            <img
              key={s.id}
              src={`https://skillicons.dev/icons?i=${s.icon_name}`}
              alt={s.name}
              title={s.name}
              className="w-7 h-7 hover:scale-110 transition-transform"
            />
          ))}
        </div>
        <button
          onClick={() => onOpen(project.slug)}
          disabled={loadingSlug === project.slug}
          className="text-sm text-brand-blue font-medium hover:text-brand-white transition-colors disabled:opacity-50"
        >
          {loadingSlug === project.slug
            ? "Carregando..."
            : `${t("projects.caseStudy")} →`}
        </button>
      </div>
    </div>
  );
}

export default function ProjectsSection() {
  const { t } = useTranslation();
  const { data: projects } = useProjects();
  const [selected, setSelected] = useState(null);
  const [loadingSlug, setLoadingSlug] = useState(null);

  const openProject = async (slug) => {
    setLoadingSlug(slug);
    const res = await api.get(`/projects/${slug}/`);
    setSelected(res.data);
    setLoadingSlug(null);
  };

  return (
    <section id="projects" className="py-20 px-10">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 text-brand-white">
          {t("projects.title")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
              onOpen={openProject}
              loadingSlug={loadingSlug}
              t={t}
            />
          ))}
        </div>
      </div>

      {selected && (
        <ProjectModal project={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}
