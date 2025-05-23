from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        import api.signals  # Ky rresht importon dhe lidh sinjalet tuaja

# If this file was missing or the class name was different (e.g., ApiConfigdjango),
# you would need to create/correct it as shown above.
