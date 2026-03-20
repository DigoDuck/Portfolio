// frontend/src/components/sections/SkillsSection.jsx
import { useTranslation } from "react-i18next";
import { useSkills } from "@/hooks/useSkills";

const CATEGORY_CONFIG = {
  backend: {
    label_pt: "Back-end",
    label_en: "Back-end",
    icon: "⚙️",
  },
  frontend: {
    label_pt: "Front-end",
    label_en: "Front-end",
    icon: "</>",
  },
  infra: {
    label_pt: "Infraestrutura / DB",
    label_en: "Infrastructure / DB",
    icon: "🗄️",
  },
};

function SkillCard({ skill }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-[#d4cdc5]/10 bg-[#243a69]/20 hover:bg-[#243a69]/40 hover:border-[#5b88a5]/40 transition-all group cursor-default">
      <img
        src={`https://skillicons.dev/icons?i=${skill.icon_name}`}
        alt={skill.name}
        className="w-10 h-10 object-contain group-hover:scale-110 transition-transform"
        onError={(e) => {
          e.target.style.display = "none";
        }}
      />
      <span className="text-xs text-[#d4cdc5]/80 font-medium text-center leading-tight">
        {skill.name}
      </span>
    </div>
  );
}

function CategoryBlock({ category, skills, lang }) {
  const config = CATEGORY_CONFIG[category];
  const label =
    lang === "en" ? config?.label_en : config?.label_pt;

  return (
    <div className="mb-10">
      {/* Cabeçalho da categoria */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[#5b88a5] font-mono text-lg">
          {config?.icon}
        </span>
        <h3 className="text-lg font-bold text-[#f4f4f2]">
          {label || category}
        </h3>
      </div>

      {/* Grade de cards */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {skills.map((skill) => (
          <SkillCard key={skill.id} skill={skill} />
        ))}
      </div>
    </div>
  );
}

export default function SkillsSection() {
  const { i18n } = useTranslation();
  const { data: skills } = useSkills();
  const lang = i18n.language;

  const grouped = skills.reduce((acc, skill) => {
    acc[skill.category] = acc[skill.category] || [];
    acc[skill.category].push(skill);
    return acc;
  }, {});

  // Ordem fixa das categorias
  const order = ["backend", "frontend", "infra"];

  return (
    <section id="skills" className="py-20 px-10">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-12 text-[#f4f4f2]">
          Habilidades Técnicas
        </h2>

        {order.map((cat) =>
          grouped[cat] ? (
            <CategoryBlock
              key={cat}
              category={cat}
              skills={grouped[cat]}
              lang={lang}
            />
          ) : null
        )}
      </div>
    </section>
  );
}