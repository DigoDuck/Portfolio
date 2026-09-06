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
