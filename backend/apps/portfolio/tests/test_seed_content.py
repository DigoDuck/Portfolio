from io import StringIO

from django.core.management import CommandError, call_command
from django.test import TestCase

from apps.portfolio.models import Profile, Project, Skill


def run(**options):
    call_command("seed_content", stdout=StringIO(), **options)


class SeedContentTests(TestCase):
    def setUp(self):
        Profile.objects.create(
            full_name="Diogo",
            role_pt="Desenvolvedor Full-Stack",
            role_en="Full-Stack Developer",
            bio_pt="bio antiga",
            bio_en="old bio",
        )

    def test_applies_cv_profile_skills_and_projects(self):
        run()

        profile = Profile.objects.get()
        self.assertEqual(profile.role_pt, "AI Engineer Full-Stack")
        self.assertIn("PetDash", profile.bio_pt)
        self.assertEqual(
            set(Project.objects.values_list("slug", flat=True)),
            {"norby", "petdash", "warden"},
        )
        self.assertTrue(Skill.objects.filter(category="ai", name="Gemini API").exists())
        self.assertIn(
            "FastAPI",
            Project.objects.get(slug="norby").skills.values_list("name", flat=True),
        )

    def test_running_twice_changes_nothing(self):
        run()
        counts = (Project.objects.count(), Skill.objects.count())

        run()

        self.assertEqual((Project.objects.count(), Skill.objects.count()), counts)

    def test_dry_run_rolls_everything_back(self):
        run(dry_run=True)

        self.assertEqual(Profile.objects.get().role_pt, "Desenvolvedor Full-Stack")
        self.assertFalse(Project.objects.exists())
        self.assertFalse(Skill.objects.exists())

    def test_fails_clearly_without_a_profile(self):
        Profile.objects.all().delete()

        with self.assertRaisesMessage(CommandError, "perfil"):
            run()
