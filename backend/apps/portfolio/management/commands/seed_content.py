"""Conteúdo do portfólio a partir do currículo (set/2026) e dos READMEs de
Norby, Pet-Dash e Warden.

Idempotente: atualiza por slug (projetos) e por nome (skills), então rodar de
novo não duplica nada. Tudo numa transação; com --dry-run, mostra o que faria
e desfaz. Não mexe em imagens: a mídia de produção ainda não é persistente.

Produção, a partir da máquina local:
    DATABASE_URL=<url do Postgres de produção> python backend/manage.py seed_content --dry-run
"""
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.portfolio.models import Profile, Project, Skill

PROFILE = {
    "role_pt": "AI Engineer Full-Stack",
    "role_en": "Full-Stack AI Engineer",
    "bio_pt": (
        "Sou formado em Análise e Desenvolvimento de Sistemas e tenho dois produtos em produção: "
        "o PetDash, usado todos os dias por um cliente pagante, e o Norby, com recursos de IA "
        "(score, leitura mensal e chat sobre os próprios dados). Trabalho com Python (Django e "
        "FastAPI) e React, e desenvolvo com agentes de IA, MCP e engenharia de contexto.\n\n"
        "Antes do código, passei mais de dois anos em gestão administrativa. De lá veio o rigor "
        "com dados, processos e prazos que levo para cada projeto."
    ),
    "bio_en": (
        "I hold a degree in Systems Analysis and Development and have two products in production: "
        "PetDash, used every day by a paying client, and Norby, with AI features (a score, a monthly "
        "reading and a chat about your own data). I work with Python (Django and FastAPI) and React, "
        "and I build with AI agents, MCP and context engineering.\n\n"
        "Before code, I spent more than two years in administrative management. That is where my "
        "rigor with data, processes and deadlines comes from."
    ),
    "github_url": "https://github.com/DigoDuck",
    "linkedin_url": "https://www.linkedin.com/in/diogo-motta/",
}

# Categoria -> [(nome, icon_name)], na ordem do currículo. icon_name vazio ou
# desconhecido pelo front (drf, zustand, sql, neon) mostra só o nome.
SKILLS = {
    "backend": [("Python", "python"), ("FastAPI", "fastapi"), ("Django", "django"),
                ("Django REST Framework", "drf"), ("JWT", "jwt")],
    "frontend": [("React", "react"), ("Vite", "vite"), ("JavaScript", "javascript"),
                 ("Tailwind CSS", "tailwindcss"), ("Zustand", "zustand"),
                 ("HTML5", "html5"), ("CSS3", "css3")],
    "infra": [("PostgreSQL", "postgresql"), ("MongoDB", "mongodb"), ("MySQL", "mysql"),
              ("SQL", "sql")],
    "devops": [("Docker", "docker"), ("Git", "git"), ("GitHub", "github"),
               ("Railway", "railway"), ("Vercel", "vercel"), ("Neon", "neon"),
               ("MongoDB Atlas", "mongodb")],
    "testing": [("pytest", "pytest"), ("Vitest", "vitest"),
                ("Testing Library", "testinglibrary")],
    "ai": [("Gemini API", "gemini"), ("Claude Code", "claude"), ("Codex", "openai"),
           ("MCP", "mcp"), ("Context engineering", "")],
}

NORBY_PT = """## O problema
Organizar finanças pessoais sem planilha, com um analista que explica o mês em linguagem simples.

## O que construí
Aplicação full-stack em produção: API em FastAPI assíncrono, frontend em React 19, PostgreSQL no núcleo financeiro e MongoDB para o conteúdo gerado por IA. Autenticação com JWT e refresh token, rate limiting, cobrança via Stripe e conformidade com a LGPD (exportação e exclusão de dados).

## Decisões técnicas
- **A IA escreve o texto, não o número.** O score é uma regra determinística; o Gemini só redige a leitura em volta dele. O texto fica em cache e é invalidado por um hash SHA-256 dos números que o geraram.
- **Saldo sob lock.** O saldo da carteira é atualizado com `SELECT ... FOR UPDATE`, e existe um teste de concorrência que falha sem o lock.
- **Refresh token opaco e rotativo**, com detecção de reuso, em cookie HttpOnly depois que o domínio próprio entrou no ar.
- **Postgres e Mongo juntos** é a decisão mais fraca do projeto, e o README explica o porquê e o custo dela. As decisões maiores estão registradas em ADRs.

## Qualidade
CI com pytest, Vitest, ESLint, verificação de lockfiles, drift de migração e auditoria de dependências. Deploy em Railway e Vercel, banco no Neon e no MongoDB Atlas."""

NORBY_EN = """## The problem
Managing personal finances without a spreadsheet, with an analyst that explains the month in plain language.

## What I built
A full-stack application in production: an async FastAPI API, a React 19 frontend, PostgreSQL for the financial core and MongoDB for AI-generated content. JWT auth with refresh tokens, rate limiting, Stripe billing and LGPD compliance (data export and deletion).

## Technical decisions
- **The AI writes the text, not the number.** The score is a deterministic rule; Gemini only writes the reading around it. The text is cached and invalidated by a SHA-256 hash of the numbers behind it.
- **Balance under a lock.** Wallet balance is updated with `SELECT ... FOR UPDATE`, and a concurrency test fails without the lock.
- **Opaque, rotating refresh tokens** with reuse detection, moved to an HttpOnly cookie once the custom domain went live.
- **Postgres and Mongo together** is the weakest decision in the project, and the README explains why and what it costs. The larger decisions are recorded as ADRs.

## Quality
CI runs pytest, Vitest, ESLint, lockfile checks, migration drift and dependency audits. Deployed on Railway and Vercel, with Neon and MongoDB Atlas."""

PETDASH_PT = """## O problema
A Ângelo Spa Animal controlava cerca de 130 atendimentos por mês numa planilha, sem visão confiável de faturamento e margem.

## O que construí
Um SaaS de gestão operacional e financeira, em produção e em uso pelo cliente. Backend em Django e Django REST Framework com PostgreSQL, frontend em React com TypeScript.

## Decisões de modelagem
- **Número financeiro é derivado, nunca armazenado.** Faturamento, ticket médio e margem saem de consultas sobre os registros de origem, então os relatórios não se desencontram dos dados.
- **Receita em regime de caixa.**
- **Saldo de pacote calculado**, não guardado, e **preço congelado** no momento do atendimento.
- **Pagamento em tabela 1-N**, o que permite pagamento misto. Soft delete e chaves `PROTECT` preservam o histórico financeiro.

## Entrega
Deploy no Railway como config-as-code (migrações antes do deploy, healthcheck) e smoke test depois de cada publicação. Cada PR nasceu de uma spec e de um plano escritos antes do código. CI com ruff, pytest, Vitest e build."""

PETDASH_EN = """## The problem
Ângelo Spa Animal tracked about 130 appointments a month in a spreadsheet, with no reliable view of revenue or margin.

## What I built
An operations and finance SaaS, in production and in daily use by the client. Django and Django REST Framework with PostgreSQL on the backend, React with TypeScript on the frontend.

## Modeling decisions
- **Financial figures are derived, never stored.** Revenue, average ticket and margin come from queries over the source records, so reports cannot drift from the data.
- **Cash-basis revenue.**
- **Package balance is computed**, not stored, and **prices are snapshotted** at service time.
- **Payments as a 1-N table**, which supports mixed payment methods. Soft delete and `PROTECT` foreign keys keep the financial history intact.

## Delivery
Deployed on Railway as config-as-code (migrations before deploy, healthcheck) with a smoke test after every release. Each PR started from a spec and a plan written before the code. CI runs ruff, pytest, Vitest and the build."""

WARDEN_PT = """## O problema
Agentes de IA executam código e mexem em repositórios. Rodar isso com segurança exige o mesmo rigor de um deploy.

## O que estou construindo
Um control plane para workloads de agentes. Cada execução recebe uma identidade de curta duração, passa por uma checagem de política determinística, roda num sandbox sem rede, tem as evidências verificadas de forma independente e deixa uma trilha de auditoria à prova de adulteração.

## Decisões técnicas
- **Postgres como fila**, sem broker extra.
- **Sandbox sem rede**, e segredos nunca entram nele.
- **Log de auditoria encadeado**, que denuncia qualquer alteração posterior.
- **Passos duráveis com fencing**, para uma execução não sobrescrever outra.
- 17 decisões registradas como ADRs.

## Como está sendo feito
TDD estrito, visível no histórico de commits, com cerca de 420 testes no backend, incluindo testes que sobem containers de sandbox reais. CI com ruff, mypy, verificação de migrações e build da imagem do sandbox. Projeto em andamento, com escopo cortado de propósito para um plano solo de 12 semanas."""

WARDEN_EN = """## The problem
AI agents run code and touch repositories. Running them safely takes the same rigor as a deploy.

## What I am building
A control plane for agent workloads. Every run gets a short-lived identity, a deterministic policy check, a no-network sandbox, independent evidence checks and a tamper-evident audit trail.

## Technical decisions
- **Postgres as the queue**, with no extra broker.
- **No-network sandbox**, and secrets never enter it.
- **Chained audit log** that exposes any later change.
- **Durable steps with fencing**, so one run cannot overwrite another.
- 17 decisions recorded as ADRs.

## How it is being built
Strict TDD, visible in the commit history, with about 420 backend tests, including tests that start real sandbox containers. CI runs ruff, mypy, migration checks and the sandbox image build. Work in progress, with scope deliberately cut to a 12-week solo plan."""

PROJECTS = [
    dict(slug="norby", featured=True, order=1,
         title_pt="Norby", title_en="Norby",
         short_description_pt="Organizador financeiro pessoal com um analista de IA: score, leitura mensal e chat sobre os próprios dados. Em produção.",
         short_description_en="Personal finance organizer with an AI analyst: a score, a monthly reading and a chat about your own data. In production.",
         case_study_pt=NORBY_PT, case_study_en=NORBY_EN,
         repo_url="https://github.com/DigoDuck/Norby", live_url="https://norby.com.br",
         skills=("FastAPI", "React", "PostgreSQL", "MongoDB", "Gemini API", "pytest", "Vitest")),
    dict(slug="petdash", featured=True, order=2,
         title_pt="PetDash", title_en="PetDash",
         short_description_pt="Gestão operacional e financeira para um petshop real, em produção no lugar de uma planilha de 130 atendimentos por mês.",
         short_description_en="Operations and finance management for a real pet spa, in production in place of a spreadsheet of 130 appointments a month.",
         case_study_pt=PETDASH_PT, case_study_en=PETDASH_EN,
         repo_url="https://github.com/DigoDuck/Pet-Dash", live_url="",
         skills=("Django", "Django REST Framework", "PostgreSQL", "Docker", "React", "pytest")),
    dict(slug="warden", featured=False, order=3,
         title_pt="Warden", title_en="Warden",
         short_description_pt="Control plane para agentes de IA: identidade, política, sandbox sem rede, evidências e auditoria. Em desenvolvimento.",
         short_description_en="A control plane for AI agents: identity, policy, a no-network sandbox, evidence and audit. In progress.",
         case_study_pt=WARDEN_PT, case_study_en=WARDEN_EN,
         repo_url="https://github.com/DigoDuck/warden", live_url="",
         skills=("FastAPI", "PostgreSQL", "Docker", "React", "pytest", "Claude Code")),
]


class Command(BaseCommand):
    help = "Aplica o conteúdo do currículo: perfil, skills e os projetos Norby, PetDash e Warden."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run", action="store_true",
            help="Mostra o que mudaria e desfaz tudo no fim.",
        )

    def handle(self, *args, dry_run=False, **options):
        with transaction.atomic():
            profile = Profile.objects.first()
            if profile is None:
                raise CommandError("Nenhum perfil cadastrado: crie o perfil no admin antes.")

            for field, value in PROFILE.items():
                setattr(profile, field, value)
            profile.save()

            skills_created = 0
            for category, items in SKILLS.items():
                for order, (name, icon) in enumerate(items):
                    _, created = Skill.objects.update_or_create(
                        name=name, defaults={"category": category, "icon_name": icon, "order": order}
                    )
                    skills_created += created

            for data in PROJECTS:
                data = dict(data)
                names = data.pop("skills")
                project, created = Project.objects.update_or_create(slug=data.pop("slug"), defaults=data)
                project.skills.set(Skill.objects.filter(name__in=names))
                self.stdout.write(f"projeto {project.slug}: {'criado' if created else 'atualizado'}")

            # O projeto acadêmico antigo sai do destaque e vai para o fim da lista.
            Project.objects.filter(slug="pet-shop-full-stack").update(featured=False, order=4)

            self.stdout.write(
                f"perfil: {profile.role_pt} | skills: {Skill.objects.count()} "
                f"({skills_created} novas) | projetos: {Project.objects.count()}"
            )

            if dry_run:
                transaction.set_rollback(True)
                self.stdout.write(self.style.WARNING("dry-run: nada foi gravado."))
            else:
                self.stdout.write(self.style.SUCCESS("conteúdo aplicado."))
