from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from dj_rest_auth.views import PasswordResetView as BasePasswordResetView
from .serializers import CustomPasswordResetSerializer


class CustomPasswordResetView(BasePasswordResetView):
    """
    Overrides dj-rest-auth PasswordResetView to return uid and token in response
    so the frontend can build links or navigate without waiting for e-mail.
    """
    permission_classes = (AllowAny,)
    serializer_class = CustomPasswordResetSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Our serializer.save() returns a dict with uid/token/url
        result = serializer.save() or {}
        payload = {
            'detail': 'Password reset e-mail has been sent.',
        }
        # Attach uid/token/url only if present (when a matching user exists)
        if isinstance(result, dict):
            uid = result.get('uid')
            token = result.get('token')
            if uid and token:
                payload.update({
                    'uid': uid,
                    'key': token,  # expose token as `key` to match frontend wording
                    'token': token,
                    'password_reset_url': result.get('password_reset_url'),
                    'combined_key': f"{uid}-{token}",
                })
        return Response(payload, status=status.HTTP_200_OK)
