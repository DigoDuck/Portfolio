import { useEffect, useEffectEvent, useId, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useTranslation } from 'react-i18next'

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

// div com role="dialog" em vez de <dialog>.showModal(): o jsdom não implementa
// showModal, e a contenção de foco ficaria sem teste.
export default function ProjectModal({ project, onClose }) {
  const { t } = useTranslation()
  const titleId = useId()
  const dialogRef = useRef(null)
  const closeRef = useRef(null)

  // O pai passa uma arrow nova a cada render. Como Effect Event, o onClose não
  // entra nas dependências e o efeito abaixo roda uma vez só: senão cada render
  // do pai roubaria o foco de volta para o botão de fechar.
  const close = useEffectEvent(() => onClose())

  useEffect(() => {
    const opener = document.activeElement
    closeRef.current.focus()
    document.body.style.overflow = 'hidden'

    const onKey = (e) => {
      if (e.key === 'Escape') return close()
      if (e.key !== 'Tab') return
      const items = dialogRef.current.querySelectorAll(FOCUSABLE)
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      opener?.focus()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
         onClick={onClose}>
      <div ref={dialogRef}
           role="dialog"
           aria-modal="true"
           aria-labelledby={titleId}
           className="w-full max-w-2xl max-h-[88vh] flex flex-col bg-[#191013] border border-brand-beige/10 rounded-2xl shadow-2xl"
           onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between p-5 border-b border-brand-beige/10">
          <h2 id={titleId} className="font-bold text-brand-white">{project.title}</h2>
          <button ref={closeRef}
                  onClick={onClose}
                  aria-label={t('projects.close')}
                  className="text-brand-beige/50 hover:text-brand-white transition-colors px-2">
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          <article className="markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {project.case_study}
            </ReactMarkdown>
          </article>
        </div>

        <div className="flex gap-3 p-5 border-t border-brand-beige/10">
          {project.repo_url && (
            <a href={project.repo_url} target="_blank" rel="noopener noreferrer"
               className="flex-1 text-center py-2.5 bg-brand-blue hover:bg-brand-navy text-brand-white rounded-lg text-sm font-medium transition-colors">
              {t('projects.viewRepo')} →
            </a>
          )}
          {project.live_url && (
            <a href={project.live_url} target="_blank" rel="noopener noreferrer"
               className="flex-1 text-center py-2.5 border border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-brand-white rounded-lg text-sm font-medium transition-colors">
              {t('projects.viewLive')} ↗
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
