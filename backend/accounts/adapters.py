from allauth.account.adapter import DefaultAccountAdapter
from django.conf import settings
from django.urls import reverse

class CustomAccountAdapter(DefaultAccountAdapter):
    def get_email_confirmation_url(self, request, emailconfirmation):
        """
        Zmienia domyślny adres URL potwierdzenia e-mail na adres frontendowy.
        """
        # Użyj FRONTEND_URL z settings.py i dołącz ścieżkę weryfikacji
        return f"{settings.FRONTEND_URL}/verify-email/{emailconfirmation.key}"

    def get_reset_password_from_key_url(self, key):
        """
        Constructs the password reset URL to point to the frontend.
        This method is called by allauth during the password reset flow.
        """
        return f"{settings.FRONTEND_URL}/reset-password/{key}"
