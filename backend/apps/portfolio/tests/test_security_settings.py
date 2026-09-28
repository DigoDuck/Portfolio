import json
import os
import subprocess
import sys
from pathlib import Path

from django.test import SimpleTestCase

from apps.portfolio.tests.test_media_storage import BUCKET_ENV


BACKEND_DIR = Path(__file__).resolve().parents[3]


class SecuritySettingsTests(SimpleTestCase):
    def run_settings(self, debug, extra_env):
        code = """
import json
from django.conf import settings
print(json.dumps({
    'proxy': settings.SECURE_PROXY_SSL_HEADER,
    'redirect': settings.SECURE_SSL_REDIRECT,
    'session_secure': settings.SESSION_COOKIE_SECURE,
    'csrf_secure': settings.CSRF_COOKIE_SECURE,
    'hsts_seconds': settings.SECURE_HSTS_SECONDS,
    'hsts_subdomains': settings.SECURE_HSTS_INCLUDE_SUBDOMAINS,
    'hsts_preload': settings.SECURE_HSTS_PRELOAD,
}))
"""
        env = os.environ.copy()
        env.update(
            {
                "DJANGO_SETTINGS_MODULE": "core.settings",
                "DJANGO_SECRET_KEY": "test-only-secret-key",
                "DEBUG": debug,
                "DATABASE_URL": "sqlite:///db.sqlite3",
                "ALLOWED_HOSTS": "testserver",
            }
        )
        for name in BUCKET_ENV:
            env.pop(name, None)
        env.update(extra_env)

        return subprocess.run(
            [sys.executable, "-c", code],
            cwd=BACKEND_DIR,
            env=env,
            capture_output=True,
            text=True,
        )

    def load_settings(self, debug):
        # Produção exige o bucket de mídia (core/storage.py); valores falsos bastam.
        result = self.run_settings(debug, BUCKET_ENV if debug == "False" else {})
        self.assertEqual(result.returncode, 0, result.stderr)
        return json.loads(result.stdout)

    def test_production_refuses_to_start_without_media_bucket(self):
        result = self.run_settings("False", {})

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("AWS_S3_BUCKET_NAME", result.stderr)

    def test_production_enables_proxy_aware_https_defaults(self):
        config = self.load_settings("False")

        self.assertEqual(config["proxy"], ["HTTP_X_FORWARDED_PROTO", "https"])
        self.assertTrue(config["redirect"])
        self.assertTrue(config["session_secure"])
        self.assertTrue(config["csrf_secure"])
        self.assertEqual(config["hsts_seconds"], 3600)
        self.assertFalse(config["hsts_subdomains"])
        self.assertFalse(config["hsts_preload"])

    def test_development_disables_https_defaults(self):
        config = self.load_settings("True")

        self.assertEqual(config["proxy"], ["HTTP_X_FORWARDED_PROTO", "https"])
        self.assertFalse(config["redirect"])
        self.assertFalse(config["session_secure"])
        self.assertFalse(config["csrf_secure"])
        self.assertEqual(config["hsts_seconds"], 0)
