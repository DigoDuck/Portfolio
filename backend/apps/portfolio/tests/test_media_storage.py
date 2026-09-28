from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase
from storages.backends.s3 import S3Storage

from core.storage import MEDIA_ENV, build_media_storage

BUCKET_ENV = {
    "AWS_ENDPOINT_URL": "https://storage.example.test",
    "AWS_ACCESS_KEY_ID": "key-id",
    "AWS_SECRET_ACCESS_KEY": "s3cr3t-value",
    "AWS_S3_BUCKET_NAME": "portfolio-media",
    "AWS_DEFAULT_REGION": "auto",
}


class MediaStorageTests(SimpleTestCase):
    def test_development_uses_the_filesystem(self):
        config = build_media_storage(debug=True, env={})

        self.assertEqual(config["BACKEND"], "django.core.files.storage.FileSystemStorage")

    def test_production_uses_the_s3_bucket(self):
        config = build_media_storage(debug=False, env=BUCKET_ENV)

        self.assertEqual(config["BACKEND"], "storages.backends.s3.S3Storage")
        self.assertEqual(config["OPTIONS"]["bucket_name"], "portfolio-media")
        self.assertEqual(config["OPTIONS"]["endpoint_url"], "https://storage.example.test")

    def test_production_fails_naming_every_missing_variable(self):
        env = {k: v for k, v in BUCKET_ENV.items() if k not in ("AWS_ACCESS_KEY_ID", "AWS_S3_BUCKET_NAME")}

        with self.assertRaises(ImproperlyConfigured) as ctx:
            build_media_storage(debug=False, env=env)

        message = str(ctx.exception)
        self.assertIn("AWS_ACCESS_KEY_ID", message)
        self.assertIn("AWS_S3_BUCKET_NAME", message)
        self.assertNotIn("AWS_ENDPOINT_URL", message)

    def test_blank_variable_counts_as_missing(self):
        with self.assertRaisesMessage(ImproperlyConfigured, "AWS_SECRET_ACCESS_KEY"):
            build_media_storage(debug=False, env={**BUCKET_ENV, "AWS_SECRET_ACCESS_KEY": " "})

    def test_error_never_echoes_a_credential(self):
        with self.assertRaises(ImproperlyConfigured) as ctx:
            build_media_storage(debug=False, env={**BUCKET_ENV, "AWS_S3_BUCKET_NAME": ""})

        self.assertNotIn("s3cr3t-value", str(ctx.exception))

    def test_all_five_variables_are_required(self):
        self.assertEqual(set(MEDIA_ENV), set(BUCKET_ENV))

    def test_urls_are_signed_and_virtual_hosted(self):
        # Railway Buckets são privados e usam endereçamento virtual-hosted. A
        # assinatura é calculada localmente pelo boto3: nada vai para a rede.
        storage = S3Storage(**build_media_storage(debug=False, env=BUCKET_ENV)["OPTIONS"])

        url = storage.url("profile/foto.jpg")

        self.assertTrue(
            url.startswith("https://portfolio-media.storage.example.test/profile/foto.jpg?"),
            url,
        )
        self.assertIn("X-Amz-Signature=", url)
        self.assertIn("X-Amz-Expires=3600", url)
