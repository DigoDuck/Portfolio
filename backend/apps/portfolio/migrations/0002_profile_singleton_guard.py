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
