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
