# Portfolio

Backend Django (`backend/`) e frontend React + Vite (`frontend/`).

## Mídia em produção

Foto do perfil e thumbnails enviadas pelo admin ficam num **Railway Bucket** privado e são servidas por URL assinada (válida por 1 hora). Com `DEBUG=False`, o backend **não sobe** sem as cinco variáveis abaixo, e o erro diz quais faltam.

| Variável no serviço do backend | Valor, na aba Credentials do bucket |
|---|---|
| `AWS_ENDPOINT_URL` | `ENDPOINT` |
| `AWS_ACCESS_KEY_ID` | `ACCESS_KEY_ID` |
| `AWS_SECRET_ACCESS_KEY` | `SECRET_ACCESS_KEY` |
| `AWS_S3_BUCKET_NAME` | `BUCKET` |
| `AWS_DEFAULT_REGION` | `REGION` (normalmente `auto`) |

Arquivos enviados antes do bucket existir se perderam no disco efêmero do Render: reenvie a foto e as thumbnails pelo admin depois do deploy.

Comandos de gerenciamento rodados na máquina local contra o banco de produção (por exemplo `seed_content`) carregam as settings de produção e também precisam dessas variáveis, ou de `DEBUG=True`, que usa o disco local.
