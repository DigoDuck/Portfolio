import { useEffect, useEffectEvent, useId, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useTranslation } from 'react-i18next'
import { FiX } from 'react-icons/fi'

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:p-6"
         onClick={onClose}>
      <div ref={dialogRef}
           role="dialog"
           aria-modal="true"
           aria-labelledby={titleId}
           className="rise flex max-h-[92vh] w-full max-w-3xl flex-col border border-rule bg-bg text-ink"
           onClick={(e) => e.stopPropagation()}>

        <div className="flex items-start justify-between gap-6 border-b border-rule px-5 py-4 sm:px-8 sm:py-6">
          <h2 id={titleId} className="text-title font-bold">{project.title}</h2>
          <button ref={closeRef}
                  onClick={onClose}
                  aria-label={t('projects.close')}
                  className="-mr-2 p-2 text-xl transition-colors hover:text-signal">
            <FiX aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
          <article className="markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {project.case_study}
            </ReactMarkdown>
          </article>
        </div>

        {(project.repo_url || project.live_url) && (
          <div className="flex flex-col gap-3 border-t border-rule px-5 py-4 sm:flex-row sm:px-8 sm:py-6">
            {project.repo_url && (
              <a href={project.repo_url} target="_blank" rel="noopener noreferrer" className="btn-outline">
                {t('projects.viewRepo')}{" "}
                <span aria-hidden="true">↗</span>{" "}
                <span className="sr-only">{t('a11y.newTab')}</span>
              </a>
            )}
            {project.live_url && (
              <a href={project.live_url} target="_blank" rel="noopener noreferrer" className="btn-outline">
                {t('projects.viewLive')}{" "}
                <span aria-hidden="true">↗</span>{" "}
                <span className="sr-only">{t('a11y.newTab')}</span>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
