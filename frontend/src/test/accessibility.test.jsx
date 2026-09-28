import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18next from "i18next";
import { initReactI18next, I18nextProvider } from "react-i18next";

import pt from "../i18n/locales/pt.json";
import api from "../api/client";
import { readFileSync } from "node:fs";
import Navbar from "../components/layout/Navbar";
import ProjectsSection from "../components/sections/ProjectsSection";
import SkillsSection from "../components/sections/SkillsSection";

vi.mock("../api/client", () => ({
  default: { get: vi.fn() },
}));

const testI18n = i18next.createInstance();
testI18n.use(initReactI18next).init({
  resources: { pt: { translation: pt } },
  lng: "pt",
  fallbackLng: "pt",
  interpolation: { escapeValue: false },
});

const withI18n = ({ children }) => (
  <I18nextProvider i18n={testI18n}>{children}</I18nextProvider>
);

const projeto = {
  id: 1,
  slug: "portfolio",
  title: "Portfolio",
  short_description: "Um site",
  thumbnail: null,
  skills: [],
};
const detalhe = {
  ...projeto,
  case_study: "## Contexto\n\nTexto com [link](https://example.com).",
  repo_url: "https://github.com/x/portfolio",
  live_url: "https://example.com",
};

describe("modal de projeto", () => {
  async function abrirModal() {
    const user = userEvent.setup();
    api.get.mockImplementation((url) =>
      Promise.resolve({ data: url === "/projects/" ? [projeto] : detalhe }),
    );
    render(<ProjectsSection />, { wrapper: withI18n });

    const botao = await screen.findByRole("button", {
      name: `${pt.projects.viewCase}, Portfolio`,
    });
    await user.click(botao);
    // Primeiro import() do modal lazy (react-markdown) pode passar de 1 s no jsdom.
    const dialog = await screen.findByRole("dialog", {}, { timeout: 5000 });
    return { user, botao, dialog };
  }

  it("é um dialog modal com o título do projeto como nome acessível", async () => {
    const { dialog } = await abrirModal();

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName("Portfolio");
  });

  it("recebe o foco ao abrir", async () => {
    const { dialog } = await abrirModal();

    expect(dialog).toContainElement(document.activeElement);
  });

  it("mantém o Tab e o Shift+Tab dentro do modal", async () => {
    const { user, dialog } = await abrirModal();
    const fechar = within(dialog).getByRole("button", { name: pt.projects.close });
    const ultimo = within(dialog).getByRole("link", {
      name: `${pt.projects.viewLive} ${pt.a11y.newTab}`,
    });

    ultimo.focus();
    await user.tab();
    expect(fechar).toHaveFocus();

    await user.tab({ shift: true });
    expect(ultimo).toHaveFocus();
  });

  it("fecha com Escape e devolve o foco ao botão que o abriu", async () => {
    const { user, botao } = await abrirModal();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(botao).toHaveFocus();
  });

  it("renderiza o Markdown do estudo de caso", async () => {
    const { dialog } = await abrirModal();

    expect(
      within(dialog).getByRole("heading", { level: 2, name: "Contexto" }),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "link" })).toHaveAttribute(
      "href",
      "https://example.com",
    );
  });
});

describe("Navbar", () => {
  it("dá nome e estado aos controles de idioma e tema", () => {
    render(<Navbar />, { wrapper: withI18n });

    expect(
      screen.getByRole("button", { name: pt.a11y.switchLanguage }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: pt.a11y.darkMode }),
    ).toHaveAttribute("aria-pressed");
  });

  it("o botão de menu anuncia se está aberto e tira os links fechados da ordem de Tab", async () => {
    const user = userEvent.setup();
    render(<Navbar />, { wrapper: withI18n });

    const menu = screen.getByRole("button", { name: pt.a11y.menu });
    const painel = document.getElementById(menu.getAttribute("aria-controls"));

    expect(menu).toHaveAttribute("aria-expanded", "false");
    expect(painel).toHaveAttribute("inert");

    await user.click(menu);

    expect(menu).toHaveAttribute("aria-expanded", "true");
    expect(painel).not.toHaveAttribute("inert");
  });
});

describe("prefers-reduced-motion", () => {
  // O jsdom não avalia media queries de CSS, então o comportamento em si só é
  // visível no navegador. Este teste guarda a regra contra remoção acidental.
  it("index.css zera animações e transições quando o usuário pede", () => {
    const css = readFileSync("src/index.css", "utf8"); // raiz do Vitest: frontend/
    const bloco = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));

    expect(bloco).toMatch(/animation-duration:\s*0\.01ms !important/);
    expect(bloco).toMatch(/transition-duration:\s*0\.01ms !important/);
    expect(bloco).toMatch(/scroll-behavior:\s*auto/);
  });
});

describe("Stack: destaque circular que segue o mouse", () => {
  async function renderStack() {
    api.get.mockResolvedValue({
      data: [
        { id: 1, name: "Python", icon_name: "python", category: "backend", order: 0 },
        { id: 2, name: "React", icon_name: "react", category: "frontend", order: 0 },
      ],
    });
    const view = render(<SkillsSection />, { wrapper: withI18n });
    await screen.findByText("Python");
    const area = view.container.querySelector("[data-spotlight]");
    // Seletor próprio: os ícones também são aria-hidden e confundiriam a busca.
    const camada = () => area.querySelector("[data-spotlight-layer]");
    return { area, camada };
  }

  it("monta a camada vermelha no primeiro hover do mouse, só para quem enxerga", async () => {
    const { area, camada } = await renderStack();
    const termos = screen.getAllByRole("term").length;

    expect(camada()).toBeNull();

    fireEvent.pointerEnter(area, { pointerType: "mouse", clientX: 10, clientY: 10 });

    expect(camada()).toHaveAttribute("aria-hidden", "true");
    expect(camada()).toHaveTextContent("Python");
    // A cópia é decorativa: a árvore de acessibilidade não pode duplicar.
    expect(screen.getAllByRole("term")).toHaveLength(termos);
  });

  it("segue o ponteiro e se apaga quando o mouse sai", async () => {
    const { area, camada } = await renderStack();

    fireEvent.pointerEnter(area, { pointerType: "mouse", clientX: 10, clientY: 10 });
    fireEvent.pointerMove(area, { pointerType: "mouse", clientX: 40, clientY: 25 });

    expect(camada().style.getPropertyValue("--spot-x")).toBe("40px");
    expect(camada().style.getPropertyValue("--spot-y")).toBe("25px");
    expect(camada()).toHaveAttribute("data-active", "true");

    fireEvent.pointerLeave(area, { pointerType: "mouse" });

    expect(camada()).toHaveAttribute("data-active", "false");
  });

  it("não monta com toque, onde não existe hover", async () => {
    const { area, camada } = await renderStack();

    fireEvent.pointerEnter(area, { pointerType: "touch" });
    fireEvent.pointerMove(area, { pointerType: "touch", clientX: 5, clientY: 5 });

    expect(camada()).toBeNull();
  });
});
