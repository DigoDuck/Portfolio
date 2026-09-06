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
