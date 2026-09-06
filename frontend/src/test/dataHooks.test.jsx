import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, renderHook, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18next from "i18next";
import { initReactI18next, I18nextProvider } from "react-i18next";

import pt from "../i18n/locales/pt.json";
import api from "../api/client";
import { useAppStore } from "../store/useAppStore";
import { useProfile } from "../hooks/useProfile";
import { useSkills } from "../hooks/useSkills";
import { useProjects } from "../hooks/useProjects";
import ProjectsSection from "../components/sections/ProjectsSection";

// Mock só na fronteira HTTP. Os hooks rodam de verdade.
vi.mock("../api/client", () => ({
  default: { get: vi.fn() },
}));

// Instância própria de i18n para não depender da config global, que está
// sendo mexida por outro agente em paralelo.
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

/**
 * Fila de requisições controláveis: cada api.get devolve uma promise que só
 * resolve/rejeita quando o teste mandar, e que rejeita com CanceledError se o
 * AbortController do hook abortar (é o que o axios faz de verdade).
 */
function queueRequests() {
  const calls = [];
  api.get.mockImplementation((url, config) => {
    const call = { url, config };
    call.promise = new Promise((resolve, reject) => {
      call.resolve = (data) => resolve({ data });
      call.reject = reject;
      config?.signal?.addEventListener("abort", () => {
        const err = new Error("canceled");
        err.name = "CanceledError";
        err.code = "ERR_CANCELED";
        reject(err);
      });
    });
    // Evita unhandled rejection no runner quando o teste ignora uma promise.
    call.promise.catch(() => {});
    calls.push(call);
    return call.promise;
  });
  return calls;
}

const flush = () => act(async () => { await Promise.resolve(); });

beforeEach(() => {
  useAppStore.setState({ lang: "pt" });
  api.get.mockReset();
});

describe("falha de rede preenche error e encerra loading", () => {
  it.each([
    ["useProfile", useProfile, null],
    ["useSkills", useSkills, []],
    ["useProjects", useProjects, []],
  ])("%s", async (_nome, hook, dataInicial) => {
    api.get.mockRejectedValue(new Error("Network Error"));

    const { result } = renderHook(hook, { wrapper: withI18n });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toEqual(dataInicial);
  });
});

describe("resposta obsoleta de idioma", () => {
  it("useProjects: a resposta lenta em pt não sobrescreve a resposta em en", async () => {
    const calls = queueRequests();
    const { result } = renderHook(useProjects, { wrapper: withI18n });

    expect(calls).toHaveLength(1); // busca em pt em voo

    await act(async () => {
      useAppStore.setState({ lang: "en" });
    });
    expect(calls).toHaveLength(2); // busca em en em voo

    // A resposta em en chega primeiro...
    await act(async () => {
      calls[1].resolve([{ id: 1, title: "EN project" }]);
    });
    // ...e a de pt, já obsoleta, chega depois.
    await act(async () => {
      calls[0].resolve([{ id: 2, title: "Projeto PT" }]);
    });

    expect(result.current.data).toEqual([{ id: 1, title: "EN project" }]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeFalsy();
  });

  it("useProfile: a resposta lenta em pt não sobrescreve a resposta em en", async () => {
    const calls = queueRequests();
    const { result } = renderHook(useProfile, { wrapper: withI18n });

    await act(async () => {
      useAppStore.setState({ lang: "en" });
    });
    expect(calls).toHaveLength(2);

    await act(async () => {
      calls[1].resolve({ name: "EN bio" });
    });
    await act(async () => {
      calls[0].resolve({ name: "Bio PT" });
    });

    expect(result.current.data).toEqual({ name: "EN bio" });
    expect(result.current.loading).toBe(false);
  });
});

describe("cancelamento não é erro", () => {
  it("useProjects: abortar a busca do idioma anterior não acende error nem prende loading", async () => {
    const calls = queueRequests();
    const { result } = renderHook(useProjects, { wrapper: withI18n });

    // Trocar o idioma aborta a requisição em voo -> rejeita com CanceledError.
    await act(async () => {
      useAppStore.setState({ lang: "en" });
    });
    await flush();

    expect(calls[0].config.signal.aborted).toBe(true);
    expect(result.current.error).toBeFalsy();
    expect(result.current.loading).toBe(true); // a busca em en ainda está em voo

    await act(async () => {
      calls[1].resolve([{ id: 1, title: "EN project" }]);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeFalsy();
  });

  it("useSkills: desmontar aborta a requisição sem estourar rejeição", async () => {
    const calls = queueRequests();
    const { unmount } = renderHook(useSkills, { wrapper: withI18n });

    unmount();
    await flush();

    expect(calls[0].config.signal.aborted).toBe(true);
  });
});

describe("ProjectsSection: detalhe do projeto", () => {
  const projeto = {
    id: 1,
    slug: "portfolio",
    title: "Portfolio",
    short_description: "Um site",
    thumbnail: null,
    skills: [],
  };

  it("botão volta a ficar clicável e mostra mensagem traduzida quando o detalhe falha", async () => {
    const user = userEvent.setup();
    api.get.mockImplementation((url) =>
      url === "/projects/"
        ? Promise.resolve({ data: [projeto] })
        : Promise.reject(new Error("Network Error")),
    );

    render(<ProjectsSection />, { wrapper: withI18n });

    const botao = await screen.findByRole("button", {
      name: `${pt.projects.viewCase} →`,
    });

    await user.click(botao);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      pt.states.error,
    );
    expect(botao).toBeEnabled();

    // E dá para tentar de novo: agora o detalhe responde.
    api.get.mockResolvedValue({ data: { ...projeto, case_study: "# ok" } });
    await user.click(botao);
    // h2 = título do modal (o card usa h3 com o mesmo texto).
    expect(
      await screen.findByRole("heading", { level: 2, name: "Portfolio" }),
    ).toBeInTheDocument();
  });

  it("usa a chave projects.viewCase e states.loading, não texto cru em português", async () => {
    let resolveDetalhe;
    api.get.mockImplementation((url) =>
      url === "/projects/"
        ? Promise.resolve({ data: [projeto] })
        : new Promise((res) => {
            resolveDetalhe = res;
          }),
    );

    const user = userEvent.setup();
    render(<ProjectsSection />, { wrapper: withI18n });

    const botao = await screen.findByRole("button", {
      name: `${pt.projects.viewCase} →`,
    });
    // A chave errada (projects.caseStudy) renderizava a string crua na tela.
    expect(screen.queryByText(/projects\.caseStudy/)).toBeNull();

    await user.click(botao);
    expect(botao).toHaveTextContent(pt.states.loading);
    expect(botao).toBeDisabled();

    await act(async () => {
      resolveDetalhe({ data: { ...projeto, case_study: "# ok" } });
    });
  });

  it("mostra erro traduzido quando a lista de projetos falha", async () => {
    api.get.mockRejectedValue(new Error("Network Error"));

    render(<ProjectsSection />, { wrapper: withI18n });

    expect(await screen.findByRole("alert")).toHaveTextContent(pt.states.error);
  });
});
