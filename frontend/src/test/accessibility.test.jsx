import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18next from "i18next";
import { initReactI18next, I18nextProvider } from "react-i18next";

import pt from "../i18n/locales/pt.json";
import api from "../api/client";
import App from "../App";
import Navbar from "../components/layout/Navbar";
import ProjectsSection from "../components/sections/ProjectsSection";

vi.mock("../api/client", () => ({
  default: { get: vi.fn() },
}));

// Aurora desenha com WebGL (ogl) e o jsdom não tem contexto GL. O mock deixa
// um marcador para os testes de movimento reduzido saberem se ela montou.
vi.mock("@/components/ui/Aurora", () => ({
  default: () => <div data-testid="aurora" />,
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

function mockMatchMedia(reduce) {
  window.matchMedia = vi.fn((query) => ({
    matches: reduce && query.includes("prefers-reduced-motion"),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

afterEach(() => {
  delete window.matchMedia;
});

describe("modal de projeto", () => {
  async function abrirModal() {
    const user = userEvent.setup();
    api.get.mockImplementation((url) =>
      Promise.resolve({ data: url === "/projects/" ? [projeto] : detalhe }),
    );
    render(<ProjectsSection />, { wrapper: withI18n });

    const botao = await screen.findByRole("button", {
      name: `${pt.projects.viewCase} →`,
    });
    await user.click(botao);
    const dialog = await screen.findByRole("dialog");
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
      name: `${pt.projects.viewLive} ↗`,
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

    // Versão desktop e versão móvel: os dois pares precisam de nome.
    expect(
      screen.getAllByRole("button", { name: pt.a11y.switchLanguage }),
    ).toHaveLength(2);
    const temas = screen.getAllByRole("button", { name: pt.a11y.darkMode });
    expect(temas).toHaveLength(2);
    for (const tema of temas) {
      expect(tema).toHaveAttribute("aria-pressed");
    }
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
  it("com movimento reduzido, Aurora e brilho do mouse não montam", async () => {
    mockMatchMedia(true);
    api.get.mockImplementation((url) =>
      Promise.resolve({ data: url === "/profile" ? { full_name: "D" } : [] }),
    );

    const { container } = render(<App />, { wrapper: withI18n });
    await screen.findByText("D");

    expect(screen.queryByTestId("aurora")).toBeNull();
    expect(container.querySelector("[data-mouse-glow]")).toBeNull();
  });

  it("sem a preferência, os dois efeitos montam", async () => {
    mockMatchMedia(false);
    api.get.mockImplementation((url) =>
      Promise.resolve({ data: url === "/profile" ? { full_name: "D" } : [] }),
    );

    const { container } = render(<App />, { wrapper: withI18n });
    await screen.findByText("D");

    expect(screen.getByTestId("aurora")).toBeInTheDocument();
    expect(container.querySelector("[data-mouse-glow]")).not.toBeNull();
  });
});
