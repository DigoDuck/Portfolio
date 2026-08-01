import json
import os
import subprocess
import sys
from pathlib import Path

from django.test import SimpleTestCase


BACKEND_DIR = Path(__file__).resolve().parents[3]


class SecuritySettingsTests(SimpleTestCase):
    def test_production_enables_proxy_aware_https_defaults(self):
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
                "DEBUG": "False",
                "DATABASE_URL": "sqlite:///db.sqlite3",
                "ALLOWED_HOSTS": "testserver",
            }
        )

        result = subprocess.run(
            [sys.executable, "-c", code],
            cwd=BACKEND_DIR,
            env=env,
            capture_output=True,
            text=True,
            check=True,
        )
        config = json.loads(result.stdout)

        self.assertEqual(config["proxy"], ["HTTP_X_FORWARDED_PROTO", "https"])
        self.assertTrue(config["redirect"])
        self.assertTrue(config["session_secure"])
        self.assertTrue(config["csrf_secure"])
        self.assertEqual(config["hsts_seconds"], 3600)
        self.assertFalse(config["hsts_subdomains"])
        self.assertFalse(config["hsts_preload"])
