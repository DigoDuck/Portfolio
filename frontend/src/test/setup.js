import "@testing-library/jest-dom/vitest";

// jsdom não implementa IntersectionObserver, e o useInView das seções depende
// dele. Fica aqui em vez de em cada arquivo de teste porque qualquer teste que
// renderize uma seção precisa do mesmo stub.
globalThis.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
