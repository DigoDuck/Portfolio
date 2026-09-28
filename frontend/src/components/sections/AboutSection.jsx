import { useTranslation } from "react-i18next";
import Section from "@/components/layout/Section";
import Spotlight from "@/components/ui/Spotlight";

export default function AboutSection({ profile }) {
  const { t } = useTranslation();
  // A bio da API já vem traduzida; o texto local só cobre a ausência dela.
  const paragraphs = profile?.bio ? [profile.bio] : [t("about.text1"), t("about.text2")];

  return (
    <Section id="about" title={t("about.title")}>
      {/* space-y num filho interno: no Spotlight, a cópia viraria mais um irmão espaçado. */}
      <Spotlight className="max-w-[65ch] text-lead">
        <div className="space-y-5">
          {paragraphs.map((text) => (
            <p key={text} className="whitespace-pre-line">
              {text}
            </p>
          ))}
        </div>
      </Spotlight>
    </Section>
  );
}
