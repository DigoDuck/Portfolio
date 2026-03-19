import { useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useTranslation } from 'react-i18next'

export default function ProjectModal({ project, onClose }) {
  const { t } = useTranslation()

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
         onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[88vh] flex flex-col bg-[#191013] border border-brand-beige/10 rounded-2xl shadow-2xl"
           onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between p-5 border-b border-brand-beige/10">
          <h2 className="font-bold text-brand-white">{project.title}</h2>
          <button onClick={onClose}
                  className="text-brand-beige/50 hover:text-brand-white transition-colors px-2">
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          <article className="prose prose-sm max-w-none
            prose-headings:text-brand-white
            prose-p:text-brand-beige
            prose-strong:text-brand-white
            prose-code:text-brand-blue prose-code:font-mono
            prose-a:text-brand-blue">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {project.case_study}
            </ReactMarkdown>
          </article>
        </div>

        <div className="flex gap-3 p-5 border-t border-brand-beige/10">
          {project.repo_url && (
            <a href={project.repo_url} target="_blank" rel="noopener noreferrer"
               className="flex-1 text-center py-2.5 bg-brand-blue hover:bg-brand-navy text-brand-white rounded-lg text-sm font-medium transition-colors">
              {t('projects.repo')} →
            </a>
          )}
          {project.live_url && (
            <a href={project.live_url} target="_blank" rel="noopener noreferrer"
               className="flex-1 text-center py-2.5 border border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-brand-white rounded-lg text-sm font-medium transition-colors">
              {t('projects.live')} ↗
            </a>
          )}
        </div>
      </div>
    </div>
  )
}