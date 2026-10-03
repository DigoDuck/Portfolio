# Portfolio

Backend Django (`backend/`) e frontend React + Vite (`frontend/`).

## Deploy do backend na Railway

Projeto com três peças: o serviço `backend` (este repositório), `Postgres` e o bucket `portfolio-media`, todos em US East.

- **Root Directory** do serviço: `/backend`.
- `RAILPACK_START_CMD=bash start.sh`: sem isso, o Railpack detecta Django e sobe `migrate && gunicorn` sem `collectstatic`, e o admin quebra por falta do manifest do WhiteNoise.
- Variáveis por referência, então trocar uma credencial no Postgres ou no bucket propaga sozinho:

| Variável | Valor |
|---|---|
| `DJANGO_SECRET_KEY` | aleatória |
| `ALLOWED_HOSTS` | `${{RAILWAY_PUBLIC_DOMAIN}}` |
| `CORS_ALLOWED_ORIGINS` | `https://diogo-dev.vercel.app` |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |

## Mídia em produção

Foto do perfil e thumbnails enviadas pelo admin ficam num **Railway Bucket** privado e são servidas por URL assinada (válida por 1 hora). Com `DEBUG=False`, o backend **não sobe** sem as cinco variáveis abaixo, e o erro diz quais faltam.

| Variável no serviço do backend | Valor |
|---|---|
| `AWS_ENDPOINT_URL` | `${{portfolio-media.ENDPOINT}}` |
| `AWS_ACCESS_KEY_ID` | `${{portfolio-media.ACCESS_KEY_ID}}` |
| `AWS_SECRET_ACCESS_KEY` | `${{portfolio-media.SECRET_ACCESS_KEY}}` |
| `AWS_S3_BUCKET_NAME` | `${{portfolio-media.BUCKET}}` |
| `AWS_DEFAULT_REGION` | `${{portfolio-media.REGION}}` (`iad`) |

Arquivos enviados antes do bucket existir se perderam no disco efêmero do Render: reenvie a foto e as thumbnails pelo admin depois do deploy.

Comandos de gerenciamento rodados na máquina local contra o banco de produção (por exemplo `seed_content`) carregam as settings de produção e também precisam dessas variáveis, ou de `DEBUG=True`, que usa o disco local. `railway run --service backend` injeta as do bucket, mas o `DATABASE_URL` dele aponta para a rede interna (`postgres.railway.internal`), que não responde fora da Railway: da máquina local, use o `DATABASE_PUBLIC_URL` do serviço Postgres. Passe `DEBUG=False` explicitamente, porque o `.env` local define `DEBUG=True` e o `load_dotenv` preenche o que faltar.
