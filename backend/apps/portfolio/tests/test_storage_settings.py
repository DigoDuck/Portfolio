from django.core.files.storage import storages
from django.core.files.storage.filesystem import FileSystemStorage
from django.test import SimpleTestCase
from whitenoise.storage import CompressedManifestStaticFilesStorage


class StorageSettingsTests(SimpleTestCase):
    def test_staticfiles_use_whitenoise_compressed_manifest(self):
        self.assertIsInstance(
            storages["staticfiles"], CompressedManifestStaticFilesStorage
        )

    def test_media_uses_the_filesystem_for_now(self):
        self.assertIsInstance(storages["default"], FileSystemStorage)
