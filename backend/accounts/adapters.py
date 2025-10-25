from allauth.account.adapter import DefaultAccountAdapter
from django.conf import settings

class CustomAccountAdapter(DefaultAccountAdapter):

    def get_email_confirmation_url(self, request, emailconfirmation):
        """
        Constructs the email confirmation URL.
        """
        # This will generate a URL like: http://localhost:5173/verify-email/the-key/
        return f"{settings.FRONTEND_URL}/verify-email/{emailconfirmation.key}/"

    def get_password_reset_url(self, request, password_reset_key):
        """
        Constructs the password reset URL.
        Note: this method is not in the default adapter, but we can create it
        to handle password resets consistently. dj-rest-auth will use it.
        """
        # This will generate a URL like: http://localhost:5173/reset-password/the-uid/the-token/
        # We need to handle this in our password reset serializer logic.
        # For now, let's focus on the confirmation URL.
        # The default behavior for password reset is handled by dj-rest-auth serializers.
        # We will customize that separately if needed.
        pass
