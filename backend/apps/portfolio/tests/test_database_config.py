from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase

from core.database import build_database_config


class DatabaseConfigTests(SimpleTestCase):
    def test_decodes_postgres_credentials_and_database_name(self):
        config = build_database_config(
            "postgresql://user%40mail:p%40ss%2Fword@db.example.com:5433/my%20db",
            debug=False,
        )

        self.assertEqual(config["USER"], "user@mail")
        self.assertEqual(config["PASSWORD"], "p@ss/word")
        self.assertEqual(config["NAME"], "my db")
        self.assertEqual(config["HOST"], "db.example.com")
        self.assertEqual(config["PORT"], 5433)
        self.assertEqual(config["OPTIONS"], {"sslmode": "require"})

    def test_preserves_local_sqlite_path(self):
        config = build_database_config("sqlite:///db.sqlite3", debug=True)

        self.assertEqual(config["ENGINE"], "django.db.backends.sqlite3")
        self.assertEqual(config["NAME"], "db.sqlite3")


class InvalidDatabaseUrlTests(SimpleTestCase):
    # As duas primeiras tentativas reais de rodar o seed_content em produção.
    def test_rejects_placeholder_text(self):
        with self.assertRaisesMessage(ImproperlyConfigured, "DATABASE_URL"):
            build_database_config("<URL externa do Postgres de produção>", debug=False)

    def test_rejects_http_url_of_the_api(self):
        with self.assertRaisesMessage(ImproperlyConfigured, "postgresql://"):
            build_database_config("https://portfolio-vnxk.onrender.com", debug=False)

    def test_rejects_postgres_url_without_host(self):
        with self.assertRaisesMessage(ImproperlyConfigured, "host"):
            build_database_config("postgresql:///mydb", debug=False)

    def test_rejects_postgres_url_without_database_name(self):
        with self.assertRaisesMessage(ImproperlyConfigured, "nome do banco"):
            build_database_config("postgresql://user:pass@db.example.com/", debug=False)

    def test_rejects_sqlite_url_without_path(self):
        with self.assertRaises(ImproperlyConfigured):
            build_database_config("sqlite:///", debug=True)

    def test_error_never_echoes_the_password(self):
        with self.assertRaises(ImproperlyConfigured) as ctx:
            build_database_config("mysql://user:s3cr3t@db.example.com/app", debug=False)

        self.assertNotIn("s3cr3t", str(ctx.exception))

    def test_accepts_postgres_scheme_alias(self):
        config = build_database_config("postgres://user:pass@db.example.com/app", debug=False)

        self.assertEqual(config["HOST"], "db.example.com")
        self.assertEqual(config["NAME"], "app")
