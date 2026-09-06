import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import "@/i18n";
import HeroSection from "@/components/sections/HeroSection";
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

// Aurora desenha com WebGL (ogl) e o jsdom não tem contexto GL.
vi.mock("@/components/ui/Aurora", () => ({ default: () => null }));

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

function mockProfile(overrides = {}) {
  mockGet.mockResolvedValue({ data: { ...profileFromApi, ...overrides } });
}

describe("HeroSection consome o contrato do perfil", () => {
  it("usa seal_text da API no selo giratório, não o fallback local", async () => {
    mockProfile();
    render(<HeroSection />);

    expect(await screen.findByText(/Backend Python · Django/)).toBeInTheDocument();
    expect(screen.queryByText(/Developer Junior/)).not.toBeInTheDocument();
  });

  it("cai no fallback do selo quando seal_text vem vazio", async () => {
    mockProfile({ seal_text: "" });
    render(<HeroSection />);

    expect(await screen.findByText(/Developer Junior/)).toBeInTheDocument();
  });

  it("usa a URL de photo como veio da API", async () => {
    mockProfile();
    render(<HeroSection />);

    const img = await screen.findByRole("img");
    expect(img).toHaveAttribute("src", profileFromApi.photo);
    expect(img).toHaveAccessibleName(/Diogo Ribeiro/);
  });

  it("cai em /profile.jpg quando photo vem nula", async () => {
    mockProfile({ photo: null });
    render(<HeroSection />);

    expect(await screen.findByRole("img")).toHaveAttribute("src", "/profile.jpg");
  });

  it("mostra a bio da API no lugar do texto local", async () => {
    mockProfile();
    render(<HeroSection />);

    expect(await screen.findByText(profileFromApi.bio)).toBeInTheDocument();
    expect(screen.queryByText(/Sou um Desenvolvedor Full-Stack/)).not.toBeInTheDocument();
  });

  it("mantém o texto local do i18n quando a bio vem vazia", async () => {
    mockProfile({ bio: "" });
    render(<HeroSection />);

    expect(await screen.findByText(/Sou um Desenvolvedor Full-Stack/)).toBeInTheDocument();
  });

  it("segue de pé com os fallbacks e avisa o erro quando a API falha", async () => {
    mockGet.mockRejectedValue(new Error("network down"));
    render(<HeroSection />);

    expect(
      await screen.findByText("Não foi possível carregar o conteúdo."),
    ).toBeInTheDocument();
    expect(screen.getByText("Sobre Mim")).toBeInTheDocument();
    expect(screen.getByText(/Developer Junior/)).toBeInTheDocument();
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

    expect(screen.getByText(/Ver Repositório/)).toBeInTheDocument();
    expect(screen.getByText(/Ver Projeto/)).toBeInTheDocument();
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
