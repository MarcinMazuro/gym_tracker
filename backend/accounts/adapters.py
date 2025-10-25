from allauth.account.adapter import DefaultAccountAdapter
from django.conf import settings

class CustomAccountAdapter(DefaultAccountAdapter):
    def get_email_confirmation_url(self, request, emailconfirmation):
        """
        Zmienia domyślny adres URL potwierdzenia e-mail na adres frontendowy.
        """
        # Użyj FRONTEND_URL z settings.py i dołącz ścieżkę weryfikacji
        return f"{settings.FRONTEND_URL}/verify-email/{emailconfirmation.key}"
