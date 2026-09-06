import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

const SKILLS = [
  { id: 1, name: "PostgreSQL", category: "infra", icon_name: "postgres" },
];

function persistPreferences(state) {
  localStorage.setItem(
    "portfolio-preferences",
    JSON.stringify({ state, version: 0 }),
  );
}

// Sobe o par store + i18n do mesmo jeito que o boot real faz: importar o módulo
// é o que dispara a reidratação e a sincronização.
async function bootPreferences() {
  const i18n = (await import("@/i18n/index.js")).default;
  const { useAppStore } = await import("@/store/useAppStore");
  return { i18n, useAppStore };
}

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  document.documentElement.className = "";
  document.documentElement.removeAttribute("lang");
  document.body.innerHTML = "";

  // Único mock: a fronteira HTTP.
  vi.doMock("axios", () => ({
    default: {
      create: () => ({
        get: vi.fn(() => Promise.resolve({ data: SKILLS })),
        interceptors: { request: { use: vi.fn() } },
      }),
    },
  }));
});

describe("idioma persistido", () => {
  it("vale para o i18next e para o <html lang> já na primeira renderização", async () => {
    persistPreferences({ theme: "dark", lang: "en" });

    const { i18n } = await bootPreferences();
    expect(i18n.language).toBe("en");
    expect(document.documentElement.lang).toBe("en");

    const Navbar = (await import("@/components/layout/Navbar")).default;
    render(<Navbar />);
    expect(screen.getAllByText("Projects").length).toBeGreaterThan(0);
  });

  it("move store, i18next e <html lang> juntos ao alternar", async () => {
    persistPreferences({ theme: "dark", lang: "pt" });

    const { i18n, useAppStore } = await bootPreferences();
    const Navbar = (await import("@/components/layout/Navbar")).default;
    render(<Navbar />);

    expect(document.documentElement.lang).toBe("pt");
    expect(screen.getAllByText("Projetos").length).toBeGreaterThan(0);

    await act(async () => {
      fireEvent.click(screen.getAllByText("PT")[0]);
    });

    expect(useAppStore.getState().lang).toBe("en");
    expect(i18n.language).toBe("en");
    expect(document.documentElement.lang).toBe("en");
    await waitFor(() =>
      expect(screen.getAllByText("Projects").length).toBeGreaterThan(0),
    );
  });

  it("acompanha o store mesmo quando a troca não vem de um componente", async () => {
    persistPreferences({ theme: "dark", lang: "pt" });

    const { i18n, useAppStore } = await bootPreferences();
    act(() => useAppStore.getState().setLang("en"));

    expect(i18n.language).toBe("en");
    expect(document.documentElement.lang).toBe("en");
  });

  it("dá à SkillsSection o mesmo idioma que o resto do app", async () => {
    persistPreferences({ theme: "dark", lang: "en" });

    await bootPreferences();
    const SkillsSection = (await import("@/components/sections/SkillsSection"))
      .default;
    render(<SkillsSection />);

    await waitFor(() =>
      expect(screen.getByText("Infrastructure / DB")).toBeInTheDocument(),
    );
  });
});

describe("tema persistido", () => {
  it("coloca a classe 'dark' no documentElement antes da renderização", async () => {
    persistPreferences({ theme: "dark", lang: "pt" });

    await bootPreferences();

    expect(document.documentElement).toHaveClass("dark");
    expect(document.body).toBeEmptyDOMElement();
  });

  it("não coloca a classe 'dark' quando o tema salvo é 'light'", async () => {
    document.documentElement.classList.add("dark");
    persistPreferences({ theme: "light", lang: "pt" });

    await bootPreferences();

    expect(document.documentElement).not.toHaveClass("dark");
  });
});

describe("localStorage corrompido", () => {
  it("não derruba o boot do app e avisa em vez de engolir o erro", async () => {
    localStorage.setItem("portfolio-preferences", "nao-e-json");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.doMock("@/App.jsx", () => ({ default: () => <div>app no ar</div> }));
    document.body.innerHTML = '<div id="root"></div>';

    await act(async () => {
      await import("@/main.jsx");
    });

    expect(document.getElementById("root")).toHaveTextContent("app no ar");
    expect(document.documentElement).toHaveClass("dark");

    const { useAppStore } = await import("@/store/useAppStore");
    expect(useAppStore.getState().lang).toBe("pt");
    expect(warn).toHaveBeenCalled();
  });
});
