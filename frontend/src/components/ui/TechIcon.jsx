import {
  SiAnthropic, SiClaude, SiCss, SiDjango, SiDocker, SiFastapi, SiGit, SiGithub,
  SiGooglegemini, SiHtml5, SiJavascript, SiJsonwebtokens, SiModelcontextprotocol,
  SiMongodb, SiMysql, SiOpenai, SiPostgresql, SiPytest, SiPython, SiRailway,
  SiReact, SiTailwindcss, SiTestinglibrary, SiVercel, SiVite, SiVitest,
} from "react-icons/si";

// Chave = Skill.icon_name cadastrado no admin. Os apelidos curtos são os ids do
// skillicons.dev, usados antes deste mapa existir.
const ICONS = {
  python: SiPython, py: SiPython,
  django: SiDjango,
  fastapi: SiFastapi,
  react: SiReact,
  vite: SiVite,
  javascript: SiJavascript, js: SiJavascript,
  tailwindcss: SiTailwindcss, tailwind: SiTailwindcss,
  html: SiHtml5, html5: SiHtml5,
  css: SiCss, css3: SiCss,
  postgresql: SiPostgresql, postgres: SiPostgresql,
  mongodb: SiMongodb,
  mysql: SiMysql,
  docker: SiDocker,
  git: SiGit,
  github: SiGithub,
  railway: SiRailway,
  vercel: SiVercel,
  pytest: SiPytest,
  vitest: SiVitest,
  testinglibrary: SiTestinglibrary,
  gemini: SiGooglegemini, googlegemini: SiGooglegemini,
  claude: SiClaude,
  anthropic: SiAnthropic,
  openai: SiOpenai,
  mcp: SiModelcontextprotocol,
  jwt: SiJsonwebtokens,
};

// Monocromático (currentColor): segue a cor da tinta nos dois temas. Sem ícone
// conhecido, não renderiza nada e o nome da tecnologia basta.
export default function TechIcon({ name, className = "" }) {
  const Icon = ICONS[name?.toLowerCase()];
  return Icon ? <Icon aria-hidden="true" className={`shrink-0 ${className}`} /> : null;
}
