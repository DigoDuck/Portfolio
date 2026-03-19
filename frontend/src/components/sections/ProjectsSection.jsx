import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useProjects } from '@/hooks/useProjects'
import ProjectModal from '@/components/ui/ProjectModal'
import api from '@/api/client'

export default function ProjectsSection() {
  const { t } = useTranslation()
  const { data: projects } = useProjects()
  const [selected, setSelected] = useState(null)
  const [loadingSlug, setLoadingSlug] = useState(null)

  const openProject = async (slug) => {
    setLoadingSlug(slug)
    const res = await api.get(`/projects/${slug}/`)
    setSelected(res.data)
    setLoadingSlug(null)
  }

  return (
    <section id="projects" className="py-20 px-10">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 text-brand-white">
          {t('projects.title')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projects.map((project) => (
            <div key={project.id}
                 className="rounded-2xl border border-brand-beige/10 bg-brand-navy/30 p-5 hover:border-brand-blue/40 hover:bg-brand-navy/50 transition-all hover:shadow-lg hover:shadow-brand-blue/5">
              <h3 className="font-semibold text-brand-white mb-2">
                {project.title}
              </h3>
              <p className="text-sm text-brand-beige leading-relaxed mb-4">
                {project.short_description}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-5">
                {project.skills.map((s) => (
                  <span key={s.id}
                        className="text-xs px-2 py-0.5 bg-brand-dark/60 border border-brand-beige/10 text-brand-beige/70 rounded-full">
                    {s.name}
                  </span>
                ))}
              </div>

              <button
                onClick={() => openProject(project.slug)}
                disabled={loadingSlug === project.slug}
                className="text-sm text-brand-blue font-medium hover:text-brand-white transition-colors disabled:opacity-50">
                {loadingSlug === project.slug ? 'Carregando...' : `${t('projects.caseStudy')} →`}
              </button>
            </div>
          ))}
        </div>
      </div>

      {selected && <ProjectModal project={selected} onClose={() => setSelected(null)} />}
    </section>
  )
}