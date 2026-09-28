import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import "@/i18n";
import App from "@/App";
import ProjectModal from "@/components/ui/ProjectModal";

// Fronteira HTTP: só o axios é falso. O hook useProfile e o api/client rodam de verdade.
const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }));

vi.mock("axios", () => ({
  default: {
    create: () => ({
      get: mockGet,
      interceptors: { request: { use: vi.fn() } },
    }),
  },
}));

// Espelha o ProfileSerializer: role, bio e seal_text já chegam traduzidos.
const profileFromApi = {
  id: 1,
  full_name: "Diogo Ribeiro",
  role: "Desenvolvedor Full-Stack",
  bio: "Bio cadastrada no admin e devolvida pela API.",
  photo: "http://localhost:8000/media/profile/diogo.jpg",
  github_url: "https://github.com/DigoDuck",
  linkedin_url: "https://linkedin.com/in/diogo",
  email: "diogo@exemplo.com",
  seal_text: "Backend Python · Django",
};

// O App busca perfil, projetos e habilidades; só o perfil importa aqui.
function mockProfile(overrides = {}) {
  mockGet.mockImplementation((url) =>
    Promise.resolve({
      data: url === "/profile" ? { ...profileFromApi, ...overrides } : [],
    }),
  );
}

describe("a página consome o contrato do perfil", () => {
  it("usa seal_text da API na linha de status, não o fallback local", async () => {
    mockProfile();
    render(<App />);

    expect(await screen.findByText(/Backend Python · Django/)).toBeInTheDocument();
    expect(screen.queryByText("Aberto a oportunidades")).not.toBeInTheDocument();
  });

  it("cai no fallback do status quando seal_text vem vazio", async () => {
    mockProfile({ seal_text: "" });
    render(<App />);

    expect(await screen.findByText("Aberto a oportunidades")).toBeInTheDocument();
  });

  it("tira a emenda ' · ' que o seal_text trazia do selo circular", async () => {
    mockProfile({ seal_text: "Disponível para oportunidades · " });
    render(<App />);

    expect(await screen.findByText("Disponível para oportunidades")).toBeInTheDocument();
  });

  it("busca o perfil uma vez só para hero, sobre, contato e navbar", async () => {
    mockProfile();
    render(<App />);

    await screen.findByRole("heading", { level: 1, name: "Diogo Ribeiro" });
    expect(mockGet.mock.calls.filter(([url]) => url === "/profile")).toHaveLength(1);
    expect(screen.getByRole("link", { name: profileFromApi.email })).toHaveAttribute(
      "href",
      `mailto:${profileFromApi.email}`,
    );
    // Hero e rodapé; o aviso de nova aba precisa de espaço antes, senão o leitor
    // de tela lê "GitHub(abre em nova aba)".
    expect(
      screen.getAllByRole("link", { name: "GitHub (abre em nova aba)" }),
    ).toHaveLength(2);
  });

  it("usa a URL de photo como veio da API", async () => {
    mockProfile();
    render(<App />);

    const img = await screen.findByRole("img");
    expect(img).toHaveAttribute("src", profileFromApi.photo);
    expect(img).toHaveAccessibleName(/Diogo Ribeiro/);
  });

  it("cai em /profile.jpg quando photo vem nula", async () => {
    mockProfile({ photo: null });
    render(<App />);

    expect(await screen.findByRole("img")).toHaveAttribute("src", "/profile.jpg");
  });

  it("mostra a bio da API no lugar do texto local", async () => {
    mockProfile();
    render(<App />);

    expect(await screen.findByText(profileFromApi.bio)).toBeInTheDocument();
    expect(screen.queryByText(/Sou um Desenvolvedor Full-Stack/)).not.toBeInTheDocument();
  });

  it("mantém o texto local do i18n quando a bio vem vazia", async () => {
    mockProfile({ bio: "" });
    render(<App />);

    expect(await screen.findByText(/Sou um Desenvolvedor Full-Stack/)).toBeInTheDocument();
  });

  it("segue de pé com os fallbacks e avisa o erro quando a API falha", async () => {
    mockGet.mockRejectedValue(new Error("network down"));
    render(<App />);

    expect(
      (await screen.findAllByText("Não foi possível carregar o conteúdo.")).length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Sobre" })).toBeInTheDocument();
    expect(screen.getByText("Aberto a oportunidades")).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute("src", "/profile.jpg");
  });
});

describe("ProjectModal não vaza chave de tradução", () => {
  const project = {
    title: "Portfolio",
    case_study: "## Contexto\n\nEstudo de caso em markdown.",
    repo_url: "https://github.com/DigoDuck/Portfolio",
    live_url: "https://portfolio.exemplo.com",
  };

  it("renderiza os rótulos traduzidos dos botões", () => {
    render(<ProjectModal project={project} onClose={() => {}} />);

    expect(screen.getByText(/Ver repositório/)).toBeInTheDocument();
    expect(screen.getByText(/Ver projeto no ar/)).toBeInTheDocument();
  });

  it("não mostra chave crua na tela", () => {
    const { container } = render(
      <ProjectModal project={project} onClose={() => {}} />,
    );

    expect(container.textContent).not.toMatch(
      /projects\.(repo|live|caseStudy|viewRepo|viewLive|close)/,
    );
  });
});
