# Portfolio Hardening Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar exposição de erros internos, estabilizar o contrato do perfil, garantir o singleton no banco e endurecer a configuração de banco e HTTPS.

**Architecture:** A API adotará um exception handler central do DRF para respostas 500 genéricas e logs internos. O singleton de perfil será protegido por uma restrição única no banco, enquanto parsing de `DATABASE_URL` e hardening HTTPS permanecerão explícitos na camada de configuração.

**Tech Stack:** Python 3.12, Django 6.0.3, Django REST Framework 3.16.1, SQLite/PostgreSQL, `django.test` e `rest_framework.test`.

## Global Constraints

* Executar cada mudança comportamental em ciclo TDD vermelho, verde e refatoração.
* Não alterar o contrato público além da correção `detaild` para `detail` e da resposta 500 genérica.
* Não alterar frontend, storage, deploy, DNS nem serviços externos nesta fase.
* Usar somente a biblioteca padrão para interpretar `DATABASE_URL`.
* Usar mensagem de commit em inglês e sem atribuição de IA.
* Preservar mudanças locais não relacionadas.

---

### Task 1: Stabilize API error responses

**Files:**

* Delete: `backend/apps/portfolio/tests.py`
* Create: `backend/apps/portfolio/tests/__init__.py`
* Create: `backend/apps/portfolio/tests/test_views.py`
* Create: `backend/core/exceptions.py`
* Modify: `backend/apps/portfolio/views.py`
* Modify: `backend/core/settings.py`

**Interfaces:**

* Consumes: DRF `exception_handler`, `ProfileView` at `GET /api/profile/`.
* Produces: `core.exceptions.api_exception_handler(exc, context)` and JSON `{"detail": "Internal server error."}` for unexpected API exceptions.

- [ ] **Step 1: Replace the empty test module with a test package**

Delete `backend/apps/portfolio/tests.py`, create an empty `backend/apps/portfolio/tests/__init__.py`, and create `test_views.py` with:

```python
from unittest.mock import patch

from django.db import DatabaseError
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.portfolio.models import Profile


def profile_data():
    return {
        "full_name": "Diogo Ribeiro",
        "role_pt": "Desenvolvedor",
        "role_en": "Developer",
        "bio_pt": "Biografia",
        "bio_en": "Biography",
    }


class ProfileViewTests(APITestCase):
    def test_missing_profile_uses_stable_detail_contract(self):
        response = self.client.get("/api/profile/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.json(), {"detail": "Profile not configured."})

    def test_profile_uses_requested_language(self):
        Profile.objects.create(**profile_data())

        response = self.client.get("/api/profile/?lang=en")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["role"], "Developer")
        self.assertEqual(response.json()["bio"], "Biography")

    @override_settings(DEBUG=False)
    @patch(
        "apps.portfolio.views.Profile.objects.first",
        side_effect=DatabaseError("database-secret"),
    )
    def test_unexpected_exception_returns_generic_json(self, _mock_first):
        self.client.raise_request_exception = False

        response = self.client.get("/api/profile/")

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.json(), {"detail": "Internal server error."})
        self.assertNotContains(response, "database-secret", status_code=500)
```

- [ ] **Step 2: Run the view tests and verify RED**

Run:

```powershell
.\.venv\Scripts\python.exe .\backend\manage.py test apps.portfolio.tests.test_views -v 2
```

Expected: the missing-profile assertion fails because the response uses `detaild`, and the exception test fails because the database message is returned.

- [ ] **Step 3: Add the central exception handler**

Create `backend/core/exceptions.py`:

```python
import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


logger = logging.getLogger(__name__)


def api_exception_handler(exc, context):
    response = drf_exception_handler(exc, context)
    if response is not None:
        return response

    logger.error(
        "Unhandled API exception",
        exc_info=(type(exc), exc, exc.__traceback__),
        extra={"view": context.get("view")},
    )
    return Response(
        {"detail": "Internal server error."},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
```

Add to `REST_FRAMEWORK` in `backend/core/settings.py`:

```python
"EXCEPTION_HANDLER": "core.exceptions.api_exception_handler",
```

Replace `ProfileView.get` with:

```python
def get(self, request):
    profile = Profile.objects.first()
    if profile is None:
        return Response(
            {"detail": "Profile not configured."},
            status=status.HTTP_404_NOT_FOUND,
        )
    serializer = ProfileSerializer(profile, context={"request": request})
    return Response(serializer.data)
```

Import `status` from `rest_framework` and remove the broad `try/except`.

- [ ] **Step 4: Run the view tests and verify GREEN**

Run the command from Step 2.

Expected: 3 tests pass. The exception test may emit one intentional error log, but the response must remain generic.

- [ ] **Step 5: Commit the API error contract**

```powershell
git add backend/apps/portfolio/tests.py backend/apps/portfolio/tests backend/apps/portfolio/views.py backend/core/exceptions.py backend/core/settings.py
git commit -m "fix: protect portfolio API error details"
```

---

### Task 2: Enforce the profile singleton in the database

**Files:**

* Create: `backend/apps/portfolio/tests/test_models.py`
* Modify: `backend/apps/portfolio/models.py`
* Create: `backend/apps/portfolio/migrations/0002_profile_singleton_guard.py`

**Interfaces:**

* Consumes: `Profile` model and existing application-level `save()` guard.
* Produces: `Profile.singleton_guard`, an internal integer sentinel forced to `1` by a check constraint and protected by a unique constraint.

- [ ] **Step 1: Write a database-level regression test**

Create `backend/apps/portfolio/tests/test_models.py`:

```python
from django.db import IntegrityError
from django.test import TransactionTestCase

from apps.portfolio.models import Profile


def unsaved_profile(name, singleton_guard=1):
    return Profile(
        full_name=name,
        role_pt="Desenvolvedor",
        role_en="Developer",
        bio_pt="Biografia",
        bio_en="Biography",
        singleton_guard=singleton_guard,
    )


class ProfileSingletonTests(TransactionTestCase):
    def test_database_rejects_multiple_profiles_when_save_is_bypassed(self):
        with self.assertRaises(IntegrityError):
            Profile.objects.bulk_create(
                [unsaved_profile("Primeiro"), unsaved_profile("Segundo")]
            )

    def test_database_rejects_a_noncanonical_singleton_guard(self):
        with self.assertRaises(IntegrityError):
            Profile.objects.bulk_create(
                [unsaved_profile("Inválido", singleton_guard=2)]
            )
```

- [ ] **Step 2: Run the model test and verify RED**

```powershell
.\.venv\Scripts\python.exe .\backend\manage.py test apps.portfolio.tests.test_models -v 2
```

Expected: both tests fail because `bulk_create` accepts multiple profiles and arbitrary sentinel values.

- [ ] **Step 3: Add the unique guard and migration**

Add to `Profile` in `models.py`:

```python
singleton_guard = models.PositiveSmallIntegerField(default=1, editable=False)
```

Add these constraints to `Profile.Meta`:

```python
constraints = [
    models.CheckConstraint(
        condition=models.Q(singleton_guard=1),
        name="profile_singleton_guard_is_one",
    ),
    models.UniqueConstraint(
        fields=["singleton_guard"],
        name="unique_profile_singleton_guard",
    ),
]
```

Keep the current `save()` validation for a friendly application-level error and fix its indentation. Generate the migration, then adjust it so existing data is validated before both constraints are applied:

```python
from django.db import migrations, models


def ensure_single_profile(apps, schema_editor):
    profile = apps.get_model("portfolio", "Profile")
    if profile.objects.count() > 1:
        raise RuntimeError(
            "Cannot enforce Profile singleton while multiple profiles exist."
        )


class Migration(migrations.Migration):
    dependencies = [("portfolio", "0001_initial")]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="singleton_guard",
            field=models.PositiveSmallIntegerField(default=1, editable=False),
        ),
        migrations.RunPython(ensure_single_profile, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name="profile",
            constraint=models.CheckConstraint(
                condition=models.Q(singleton_guard=1),
                name="profile_singleton_guard_is_one",
            ),
        ),
        migrations.AddConstraint(
            model_name="profile",
            constraint=models.UniqueConstraint(
                fields=("singleton_guard",),
                name="unique_profile_singleton_guard",
            ),
        ),
    ]
```

- [ ] **Step 4: Run the model test and migration checks**

```powershell
.\.venv\Scripts\python.exe .\backend\manage.py test apps.portfolio.tests.test_models -v 2
.\.venv\Scripts\python.exe .\backend\manage.py makemigrations --check --dry-run
```

Expected: the test passes and Django reports `No changes detected`.

- [ ] **Step 5: Commit the database invariant**

```powershell
git add backend/apps/portfolio/models.py backend/apps/portfolio/migrations/0002_profile_singleton_guard.py backend/apps/portfolio/tests/test_models.py
git commit -m "fix: enforce a single portfolio profile"
```

---

### Task 3: Parse database URLs without encoded credentials

**Files:**

* Create: `backend/apps/portfolio/tests/test_database_config.py`
* Create: `backend/core/database.py`
* Modify: `backend/core/settings.py`

**Interfaces:**

* Consumes: a `sqlite:///...` or PostgreSQL database URL and the current `DEBUG` Boolean.
* Produces: `build_database_config(database_url: str, debug: bool) -> dict` in Django `DATABASES["default"]` format.

- [ ] **Step 1: Write parser tests**

Create `backend/apps/portfolio/tests/test_database_config.py`:

```python
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
```

- [ ] **Step 2: Run parser tests and verify RED**

```powershell
.\.venv\Scripts\python.exe .\backend\manage.py test apps.portfolio.tests.test_database_config -v 2
```

Expected: import error because `core.database` does not exist.

- [ ] **Step 3: Implement the parser and connect settings**

Create `backend/core/database.py`:

```python
from urllib.parse import unquote, urlparse


def build_database_config(database_url, debug):
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
```

In `settings.py`, import the helper and replace the manual database branch with:

```python
DATABASES = {
    "default": build_database_config(database_url, DEBUG),
}
```

- [ ] **Step 4: Run parser and Django checks**

```powershell
.\.venv\Scripts\python.exe .\backend\manage.py test apps.portfolio.tests.test_database_config -v 2
.\.venv\Scripts\python.exe .\backend\manage.py check
```

Expected: 2 tests pass and Django reports no issues.

- [ ] **Step 5: Commit URL parsing**

```powershell
git add backend/core/database.py backend/core/settings.py backend/apps/portfolio/tests/test_database_config.py
git commit -m "fix: decode database URL credentials"
```

---

### Task 4: Enable proxy-aware HTTPS hardening

**Files:**

* Create: `backend/apps/portfolio/tests/test_security_settings.py`
* Modify: `backend/core/settings.py`

**Interfaces:**

* Consumes: `DEBUG` and the `X-Forwarded-Proto` header supplied by Render or Railway.
* Produces: redirect, secure cookie and one-hour HSTS defaults only when `DEBUG=False`.

- [ ] **Step 1: Write a production-settings integration test**

Create `backend/apps/portfolio/tests/test_security_settings.py`:

```python
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
```

- [ ] **Step 2: Run the security test and verify RED**

```powershell
.\.venv\Scripts\python.exe .\backend\manage.py test apps.portfolio.tests.test_security_settings -v 2
```

Expected: the subprocess fails because the security settings are absent.

- [ ] **Step 3: Add explicit production security settings**

Add to `backend/core/settings.py` after `DEBUG` is defined:

```python
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = not DEBUG
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_HSTS_SECONDS = 0 if DEBUG else 3600
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False
```

- [ ] **Step 4: Run the security test and deploy check**

```powershell
.\.venv\Scripts\python.exe .\backend\manage.py test apps.portfolio.tests.test_security_settings -v 2
$env:DJANGO_SECRET_KEY = "phase-one-deploy-check-secret-key-with-sufficient-length"
$env:DEBUG = "False"
$env:DATABASE_URL = "sqlite:///db.sqlite3"
$env:ALLOWED_HOSTS = "testserver"
.\.venv\Scripts\python.exe .\backend\manage.py check --deploy
```

Expected: the test passes. `check --deploy` may still report the intentionally short HSTS duration; it must not report missing HTTPS redirect, insecure cookies or a weak secret key.

- [ ] **Step 5: Commit security defaults**

```powershell
git add backend/core/settings.py backend/apps/portfolio/tests/test_security_settings.py
git commit -m "fix: harden production HTTPS settings"
```

---

### Task 5: Verify Phase 1 as a complete unit

**Files:**

* Verify only; no production file is added in this task.

**Interfaces:**

* Consumes: all Phase 1 changes.
* Produces: evidence that tests, migrations and Django checks agree with the implemented state.

- [ ] **Step 1: Run the full backend suite**

```powershell
.\.venv\Scripts\python.exe .\backend\manage.py test -v 2
```

Expected: all Phase 1 tests pass with zero failures.

- [ ] **Step 2: Verify migrations and Django configuration**

```powershell
.\.venv\Scripts\python.exe .\backend\manage.py makemigrations --check --dry-run
.\.venv\Scripts\python.exe .\backend\manage.py check
```

Expected: `No changes detected` and no system-check issues.

- [ ] **Step 3: Inspect the exact patch**

```powershell
git diff --check
git status --short
git log --oneline -5
```

Expected: no whitespace errors, only intended Phase 1 paths changed, and four focused implementation commits follow the design commit.

- [ ] **Step 4: Request code review**

Invoke `superpowers:requesting-code-review` against the Phase 1 commit range. Address only confirmed blockers before presenting the phase as complete.
