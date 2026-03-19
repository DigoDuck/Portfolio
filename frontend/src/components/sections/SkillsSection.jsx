import { useTranslation } from 'react-i18next'
import { useSkills } from '@/hooks/useSkills'

const STYLES = {
  backend:  'bg-brand-navy/60 border-brand-blue/30',
  frontend: 'bg-brand-navy/40 border-brand-beige/20',
  infra:    'bg-brand-navy/30 border-brand-beige/15',
}

export default function SkillsSection() {
  const { t } = useTranslation()
  const { data: skills } = useSkills()

  const grouped = skills.reduce((acc, skill) => {
    acc[skill.category] = acc[skill.category] || []
    acc[skill.category].push(skill)
    return acc
  }, {})

  return (
    <section id="skills" className="py-20 px-10">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 text-brand-white">
          {t('skills.title')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}
                 className={`rounded-2xl border p-5 ${STYLES[cat] || 'bg-brand-navy/30 border-brand-beige/10'} ${cat === 'backend' ? 'lg:col-span-2' : ''}`}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-brand-beige/60 mb-4">
                {t(`skills.${cat}`)}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {items.map((skill) => (
                  <div key={skill.id}
                       className="flex items-center gap-2.5 p-2.5 rounded-lg bg-brand-dark/40 hover:bg-brand-blue/10 border border-transparent hover:border-brand-blue/20 transition-all group">
                    <img
                      src={`https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${skill.icon_name}/${skill.icon_name}-original.svg`}
                      alt={skill.name}
                      className="w-7 h-7 object-contain group-hover:scale-110 transition-transform"
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                    <span className="text-sm text-brand-beige font-medium truncate">
                      {skill.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}