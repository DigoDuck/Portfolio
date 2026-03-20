import { useTranslation } from "react-i18next";
import { useSkills } from "@/hooks/useSkills";
import { useInView } from "@/hooks/useInView";

const CATEGORY_CONFIG = {
  backend: { label_pt: "Back-end", label_en: "Back-end", icon: "⚙️" },
  frontend: { label_pt: "Front-end", label_en: "Front-end", icon: "</>" },
  infra: {
    label_pt: "Infraestrutura / DB",
    label_en: "Infrastructure / DB",
    icon: "🗄️",
  },
};

function SkillCard({ skill, index }) {
  const { ref, inView } = useInView();

  return (
    <div
      ref={ref}
      className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-[#d4cdc5]/10 bg-[#243a69]/20 hover:bg-[#243a69]/40 hover:border-[#5b88a5]/40 group cursor-default"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.4s ease ${index * 0.06}s, transform 0.4s ease ${index * 0.06}s`,
      }}
    >
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
  const label = lang === "en" ? config?.label_en : config?.label_pt;
  const { ref, inView } = useInView();

  return (
    <div className="mb-10">
      {/* Cabeçalho anima vindo da esquerda */}
      <div
        ref={ref}
        className="flex items-center gap-3 mb-4"
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? "translateX(0)" : "translateX(-20px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
        }}
      >
        <span className="text-[#5b88a5] font-mono text-lg">{config?.icon}</span>
        <h3 className="text-lg font-bold text-[#f4f4f2]">
          {label || category}
        </h3>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {skills.map((skill, index) => (
          <SkillCard key={skill.id} skill={skill} index={index} /> // ← passa o index
        ))}
      </div>
    </div>
  );
}

export default function SkillsSection() {
  const { t, i18n } = useTranslation();
  const { data: skills } = useSkills();
  const lang = i18n.language;
  const { ref, inView } = useInView();

  const grouped = skills.reduce((acc, skill) => {
    acc[skill.category] = acc[skill.category] || [];
    acc[skill.category].push(skill);
    return acc;
  }, {});

  const order = ["backend", "frontend", "infra"];

  return (
    <section id="skills" className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        {" "}
        <h2
          ref={ref}
          className="text-3xl font-bold mb-12 text-[#f4f4f2] text-center"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
          }}
        >
          {t("skills.title")}
        </h2>
        {order.map((cat) =>
          grouped[cat] ? (
            <CategoryBlock
              key={cat}
              category={cat}
              skills={grouped[cat]}
              lang={lang}
            />
          ) : null,
        )}
      </div>
    </section>
  );
}
