# Portfolio Hardening Design

**Data:** 2026-08-01

## Objetivo

Corrigir os bugs confirmados na revisão do portfólio, criar proteção automatizada contra regressões e preparar o backend para a migração do Render para a Railway, sem redesenhar a interface nem converter o frontend para TypeScript.

## Contexto de deploy

O frontend React/Vite é publicado na Vercel. O backend Django/DRF está no Render e será migrado para a Railway. Como os serviços usam domínios diferentes, a URL da API deve ser configurada explicitamente no build da Vercel e a origem do frontend deve permanecer autorizada no CORS do backend.

Uploads de perfil e projetos serão armazenados em um Railway Bucket S3 compatível. Desenvolvimento local continuará usando o filesystem. Produção não poderá iniciar com um storage local efêmero configurado silenciosamente.

## Princípios

1. Cada correção comportamental começa com um teste de regressão que falha pelo motivo esperado.
2. Cada fase termina com testes, lint, typecheck e build proporcionais às mudanças realizadas.
3. As mudanças seguem o desenho atual do projeto e evitam refatorações não relacionadas.
4. Configurações obrigatórias de produção falham de maneira explícita, em vez de usar valores locais perigosos.
5. Nenhuma fase publica ou migra o deploy automaticamente.

## Fase 1: Segurança e contratos do backend

### Escopo

* Remover o `try/except` que devolve exceções internas em `ProfileView`.
* Corrigir a chave `detaild` para `detail` na resposta de perfil ausente.
* Adicionar uma restrição de banco para garantir somente um `Profile`, eliminando a condição de corrida do `save()` atual.
* Preservar respostas públicas somente para leitura.
* Decodificar usuário, senha e nome do banco provenientes de `DATABASE_URL` com as funções da biblioteca padrão.
* Configurar `SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')`, `SECURE_SSL_REDIRECT=True`, cookies `Secure` e HSTS de 3.600 segundos em produção, sem `includeSubDomains` nem preload nesta etapa de migração.

### Resultado verificável

Testes Django demonstram que o endpoint não expõe mensagens de exceção, que o perfil ausente retorna o contrato correto, que os campos multilíngues continuam funcionando e que o banco rejeita um segundo perfil.

## Fase 2: Storage e configuração de produção

### Escopo

* Substituir `STATICFILES_STORAGE` pela configuração `STORAGES` do Django 6.
* Usar WhiteNoise somente para arquivos estáticos versionados.
* Adicionar `django-storages` com suporte S3 para mídia.
* Configurar o storage S3 por `AWS_ENDPOINT_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME` e `AWS_DEFAULT_REGION`.
* Manter `FileSystemStorage` somente quando `DEBUG=True`.
* Gerar URLs assinadas para os objetos privados do Railway Bucket.
* Interromper a inicialização de produção com erro claro quando as credenciais de mídia estiverem incompletas.
* Documentar as variáveis da Railway e o procedimento manual para copiar imagens existentes do Render.

### Resultado verificável

Testes de configuração confirmam WhiteNoise para `staticfiles`, filesystem em desenvolvimento, S3 em produção e falha explícita quando uma credencial obrigatória estiver ausente.

## Fase 3: Contratos e estados do frontend

### Escopo

* Consumir `photo`, `bio` e `seal_text` retornados pelo perfil, mantendo fallbacks locais somente quando a API não fornecer valores opcionais.
* Corrigir as chaves de tradução de estudo de caso, repositório e demonstração.
* Adicionar mensagens traduzidas para carregamento e falhas de API.
* Sincronizar o idioma persistido com i18next e com `document.documentElement.lang` antes e depois da renderização.
* Aplicar o tema persistido antes da primeira renderização.
* Tratar erros e cancelamentos nos hooks de perfil, habilidades e projetos.
* Impedir que uma resposta antiga de idioma sobrescreva a resposta atual.
* Usar `try/catch/finally` ao carregar o detalhe de projeto e sempre liberar o botão.
* Atualizar o conteúdo do modal quando o idioma mudar.
* Em produção, exigir `VITE_API_URL`; em desenvolvimento, permitir o fallback `http://localhost:8000/api`.

### Resultado verificável

Testes React demonstram sincronização de idioma e tema, contrato correto do perfil, recuperação após falha de detalhe e descarte de respostas obsoletas. O build de produção falha com mensagem clara quando `VITE_API_URL` não existe.

## Fase 4: Acessibilidade, acabamento e qualidade do frontend

### Escopo

* Implementar no modal `role="dialog"`, `aria-modal`, título associado, foco inicial, contenção de foco, fechamento com Escape e restauração do foco.
* Adicionar nomes e estados acessíveis aos controles móveis e de tema.
* Respeitar `prefers-reduced-motion` nas animações contínuas.
* Carregar o modal e suas dependências sob demanda.
* Mover o carregamento da fonte Prompt para o HTML e corrigir o nome da família.
* Criar estilos explícitos para o Markdown, sem adicionar o plugin Typography.
* Atualizar título e descrição do documento.
* Configurar ESLint para JavaScript e JSX.
* Adicionar Vitest, React Testing Library, `jest-dom` e jsdom.
* Remover o `EOF` literal do `.gitignore`.

### Resultado verificável

Testes cobrem teclado, foco, atributos ARIA e preferências reduzidas. ESLint analisa os arquivos `.js` e `.jsx`. Typecheck e build terminam sem o aviso da fonte, e o modal fica em um chunk separado.

## Fluxo de dados final

1. A Vercel injeta `VITE_API_URL` durante o build.
2. O frontend solicita perfil, habilidades e projetos ao backend externo, enviando o idioma atual.
3. Os hooks ignoram respostas canceladas ou pertencentes a um idioma antigo.
4. O Django seleciona os campos traduzidos e devolve URLs assinadas para as imagens armazenadas no Railway Bucket.
5. Estados de carregamento e erro são apresentados com mensagens traduzidas.

## Tratamento de erros

O backend registra exceções inesperadas no servidor e usa respostas genéricas do DRF. Erros esperados preservam códigos HTTP e contratos estáveis. O frontend diferencia cancelamento de falha real, sempre encerra estados de carregamento e oferece uma mensagem visível sem remover os fallbacks úteis da página.

## Estratégia de testes

O backend usará `django.test.TestCase`, `APIClient` e testes de configuração isolados. O frontend usará Vitest e React Testing Library com Axios mockado somente na fronteira HTTP. Cada bug comportamental será reproduzido por um teste falhando antes da implementação.

Ao final de cada fase serão executados os testes afetados. Ao final da última fase serão executados:

* `python backend/manage.py check`
* `python backend/manage.py makemigrations --check --dry-run`
* `python backend/manage.py test`
* `npm run test`
* `npm run lint`
* `npm run build`

## Migração operacional

A implementação prepara o código e documenta as variáveis, mas não cria recursos na Railway, altera variáveis da Vercel, transfere arquivos existentes, publica builds nem muda DNS. Essas ações exigem acesso aos serviços e uma confirmação separada.

## Fora de escopo

* Conversão do frontend para TypeScript.
* Redesign visual.
* Substituição de Zustand, Axios ou i18next.
* Criação automática do projeto Railway.
* Deploy, mudança de DNS ou remoção do serviço Render.
* Otimizações que não estejam relacionadas aos achados da revisão.
