from urllib.parse import unquote, urlparse


def build_database_config(database_url: str, debug: bool) -> dict:
    if database_url.startswith("sqlite"):
        return {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": database_url.removeprefix("sqlite:///"),
        }

    parsed = urlparse(database_url)
    return {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": unquote(parsed.path.lstrip("/")),
        "USER": unquote(parsed.username or ""),
        "PASSWORD": unquote(parsed.password or ""),
        "HOST": parsed.hostname or "",
        "PORT": parsed.port or 5432,
        "OPTIONS": {} if debug else {"sslmode": "require"},
    }
