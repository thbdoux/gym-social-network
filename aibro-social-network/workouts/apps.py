from django.apps import AppConfig


class WorkoutsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "workouts"

    def ready(self):
        import workouts.signals  # Add this import