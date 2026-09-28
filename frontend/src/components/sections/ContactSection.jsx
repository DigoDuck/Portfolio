import { useTranslation } from "react-i18next";
import Section from "@/components/layout/Section";
import SocialLinks from "@/components/ui/SocialLinks";

export default function ContactSection({ profile }) {
  const { t } = useTranslation();

  return (
    <footer>
      <Section id="contact" title={t("contact.title")}>
        <p className="max-w-[48ch] text-lead text-muted">{t("contact.lead")}</p>
        {profile?.email && (
          <a
            href={`mailto:${profile.email}`}
            className="mt-8 inline-block text-title font-bold underline decoration-signal decoration-2 underline-offset-8 transition-colors [overflow-wrap:anywhere] hover:text-signal"
          >
            {profile.email}
          </a>
        )}
        <SocialLinks profile={profile} className="mt-8" />
      </Section>
      <p className="mx-auto max-w-6xl border-t border-rule px-4 py-8 text-sm text-muted sm:px-8">
        © {new Date().getFullYear()} {profile?.full_name}
      </p>
    </footer>
  );
}
