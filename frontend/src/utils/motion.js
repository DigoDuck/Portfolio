// Lido uma vez por render. ponytail: não reage se o usuário mudar a preferência
// com a página aberta; trocar por um hook com listener de matchMedia se precisar.
export const prefersReducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
