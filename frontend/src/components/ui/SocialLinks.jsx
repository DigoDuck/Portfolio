import { useTranslation } from "react-i18next";
import { FaGithub, FaLinkedin } from "react-icons/fa";

// Links externos do perfil. Os que vierem vazios da API simplesmente não aparecem.
export default function SocialLinks({ profile, className = "" }) {
  const { t } = useTranslation();
  const links = [
    ["GitHub", profile?.github_url, FaGithub],
    ["LinkedIn", profile?.linkedin_url, FaLinkedin],
  ].filter(([, url]) => url);

  if (!links.length) return null;

  return (
    <ul className={`flex flex-wrap gap-x-6 gap-y-2 ${className}`}>
      {links.map(([label, url, Icon]) => (
        <li key={label}>
          <a href={url} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-2">
            <Icon aria-hidden="true" className="text-[1.15em]" />
            {label}{" "}
            <span aria-hidden="true">↗</span>{" "}
            <span className="sr-only">{t("a11y.newTab")}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
