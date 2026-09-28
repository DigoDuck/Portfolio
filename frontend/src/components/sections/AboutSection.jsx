import { useTranslation } from "react-i18next";
import Section from "@/components/layout/Section";

export default function AboutSection({ profile }) {
  const { t } = useTranslation();
  // A bio da API já vem traduzida; o texto local só cobre a ausência dela.
  const paragraphs = profile?.bio ? [profile.bio] : [t("about.text1"), t("about.text2")];

  return (
    <Section id="about" title={t("about.title")}>
      <div className="max-w-[65ch] space-y-5 text-lead">
        {paragraphs.map((text) => (
          <p key={text} className="whitespace-pre-line">
            {text}
          </p>
        ))}
      </div>
    </Section>
  );
}
