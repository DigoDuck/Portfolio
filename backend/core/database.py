from urllib.parse import unquote, urlparse

from django.core.exceptions import ImproperlyConfigured

POSTGRES_SCHEMES = ("postgres", "postgresql")
EXPECTED = (
    "DATABASE_URL inválida: use postgresql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO "
    "ou sqlite:///caminho/para/db.sqlite3"
)


def build_database_config(database_url: str, debug: bool) -> dict:
    # As mensagens de erro nunca repetem a URL: ela pode conter a senha do banco.
    if database_url.startswith("sqlite"):
        path = database_url.removeprefix("sqlite:///")
        if path == database_url or not path:
            raise ImproperlyConfigured(f"{EXPECTED} (faltou o caminho do arquivo SQLite).")
        return {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": path,
        }

    parsed = urlparse(database_url)
    if parsed.scheme not in POSTGRES_SCHEMES:
        raise ImproperlyConfigured(f"{EXPECTED} (esquema não suportado).")
    if not parsed.hostname:
        raise ImproperlyConfigured(f"{EXPECTED} (faltou o host).")
    name = unquote(parsed.path.lstrip("/"))
    if not name:
        raise ImproperlyConfigured(f"{EXPECTED} (faltou o nome do banco).")

    return {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": name,
        "USER": unquote(parsed.username or ""),
        "PASSWORD": unquote(parsed.password or ""),
        "HOST": parsed.hostname,
        "PORT": parsed.port or 5432,
        "OPTIONS": {} if debug else {"sslmode": "require"},
    }
