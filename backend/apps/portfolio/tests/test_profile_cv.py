import tempfile
from urllib.parse import parse_qs, urlparse

from django.core.exceptions import ValidationError
from django.test import override_settings
from rest_framework.test import APITestCase

from apps.portfolio.models import Profile
from core.storage import build_media_storage

from .test_views import profile_data

# Credenciais falsas: a URL assinada é calculada localmente, sem chamar o bucket.
FAKE_BUCKET_ENV = {
    "AWS_ENDPOINT_URL": "https://storage.exemplo.test",
    "AWS_ACCESS_KEY_ID": "chave",
    "AWS_SECRET_ACCESS_KEY": "segredo",
    "AWS_S3_BUCKET_NAME": "midia",
    "AWS_DEFAULT_REGION": "auto",
}


@override_settings(MEDIA_ROOT=tempfile.gettempdir())
class ProfileCvTests(APITestCase):
    def cv_for(self, lang, **files):
        Profile.objects.create(**profile_data(), **files)
        return self.client.get(f"/api/profile/?lang={lang}").json()["cv"]

    def test_cv_is_null_without_a_file(self):
        self.assertIsNone(self.cv_for("pt"))

    def test_cv_follows_the_requested_language(self):
        files = {"cv_pt": "cv/curriculo.pdf", "cv_en": "cv/resume.pdf"}

        self.assertTrue(self.cv_for("en", **files).endswith("/cv/resume.pdf"))
        Profile.objects.all().delete()
        self.assertTrue(self.cv_for("pt", **files).endswith("/cv/curriculo.pdf"))

    def test_missing_language_falls_back_to_the_other_cv(self):
        self.assertTrue(self.cv_for("en", cv_pt="cv/curriculo.pdf").endswith("/cv/curriculo.pdf"))
        Profile.objects.all().delete()
        self.assertTrue(self.cv_for("pt", cv_en="cv/resume.pdf").endswith("/cv/resume.pdf"))

    def test_bucket_url_forces_a_download_named_after_the_cv_language(self):
        storages = {
            "default": build_media_storage(False, FAKE_BUCKET_ENV),
            "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
        }
        with override_settings(STORAGES=storages):
            # Pedido em inglês, mas só existe o PT: o nome do arquivo segue o PDF entregue.
            url = self.cv_for("en", cv_pt="cv/curriculo.pdf")

        disposition = parse_qs(urlparse(url).query)["response-content-disposition"][0]
        self.assertEqual(disposition, 'attachment; filename="diogo-ribeiro-curriculo.pdf"')

    def test_cv_accepts_only_pdf(self):
        profile = Profile(**profile_data(), cv_pt="cv/curriculo.docx")

        with self.assertRaises(ValidationError) as ctx:
            profile.full_clean()
        self.assertIn("cv_pt", ctx.exception.message_dict)
