from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.db.migrations.recorder import MigrationRecorder
from django.test import TransactionTestCase


class ProfileSingletonMigrationTests(TransactionTestCase):
    migrate_from = ("portfolio", "0001_initial")
    migrate_to = ("portfolio", "0002_profile_singleton_guard")

    def setUp(self):
        super().setUp()
        self.executor = MigrationExecutor(connection)
        self.executor.migrate([self.migrate_from])
        self.executor = MigrationExecutor(connection)
        old_apps = self.executor.loader.project_state([self.migrate_from]).apps
        self.Profile = old_apps.get_model("portfolio", "Profile")

    def tearDown(self):
        if hasattr(self, "Profile"):
            self.Profile.objects.all().delete()

        executor = MigrationExecutor(connection)
        executor.migrate(executor.loader.graph.leaf_nodes())
        super().tearDown()

    def create_profile(self, name):
        self.Profile.objects.create(
            full_name=name,
            role_pt="Desenvolvedor",
            role_en="Developer",
            bio_pt="Biografia",
            bio_en="Biography",
        )

    def migrate_to_singleton_guard(self):
        self.executor.migrate([self.migrate_to])
        apps = self.executor.loader.project_state([self.migrate_to]).apps
        return apps.get_model("portfolio", "Profile")

    def test_migration_allows_zero_existing_profiles(self):
        profile = self.migrate_to_singleton_guard()

        self.assertEqual(profile.objects.count(), 0)
        self.assertIn(self.migrate_to, MigrationRecorder(connection).applied_migrations())

    def test_migration_allows_one_existing_profile(self):
        self.create_profile("Único")

        profile = self.migrate_to_singleton_guard()

        self.assertEqual(profile.objects.get().singleton_guard, 1)

    def test_migration_rejects_multiple_profiles_without_partial_schema(self):
        self.create_profile("Primeiro")
        self.create_profile("Segundo")

        with self.assertRaises(RuntimeError):
            self.executor.migrate([self.migrate_to])

        with connection.cursor() as cursor:
            columns = connection.introspection.get_table_description(
                cursor, self.Profile._meta.db_table
            )

        self.assertNotIn("singleton_guard", {column.name for column in columns})
        self.assertNotIn(self.migrate_to, MigrationRecorder(connection).applied_migrations())
        self.assertEqual(self.Profile.objects.count(), 2)
