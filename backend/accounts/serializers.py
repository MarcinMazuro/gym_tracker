from rest_framework import serializers
from django.contrib.auth import get_user_model
from dj_rest_auth.registration.serializers import RegisterSerializer as BaseRegisterSerializer
from dj_rest_auth.serializers import PasswordResetSerializer
from allauth.account.forms import ResetPasswordForm
from django.conf import settings

# Get our CustomUser model
User = get_user_model()


class RegisterSerializer(BaseRegisterSerializer):
    """
    Custom registration serializer.
    
    Inherits from dj-rest-auth's RegisterSerializer which provides:
    - username field with validation
    - email field with validation
    - password1 and password2 fields (password confirmation)
    - Basic validation (passwords match, username unique, etc.)
    
    We're keeping it simple - just username, email, and password required.
    All other fields (first_name, last_name, etc.) can be added later via profile update.
    
    How it works:
    1. User sends: {username, email, password1, password2}
    2. Serializer validates data
    3. If valid, save() method creates the user
    4. django-allauth automatically sends verification email
    """
    
    def validate_email(self, email):
        """
        Check that email is unique before allowing registration.
        """
        email = email.lower()  # Normalize email to lowercase
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                "A user with that email already exists."
            )
        return email
    
    def save(self, request):
        """
        Create and return a new user instance.
        
        The parent class (BaseRegisterSerializer) handles:
        - Password validation
        - Username uniqueness check
        - Email format validation
        - Creating the user in database
        - Sending verification email (via django-allauth)
        
        We just call super().save() to use all that functionality.
        """
        user = super().save(request)
        return user


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for user details.
    
    Used when:
    - GET /api/auth/user/ - get current user info
    - Response after login/registration
    
    Shows basic user info. Does NOT include sensitive data like:
    - password (never return this!)
    - is_staff, is_superuser (internal flags)
    
    ModelSerializer automatically:
    - Creates fields based on the model
    - Handles validation
    - Provides default create() and update() methods
    """
    
    email_verified = serializers.SerializerMethodField()

    def get_email_verified(self, obj):
        try:
            from allauth.account.models import EmailAddress
            return EmailAddress.objects.filter(user=obj, email=obj.email, verified=True).exists()
        except Exception:
            return False

    class Meta:
        model = User
        
        # Fields to include in JSON response
        fields = [
            'id',           # User's unique ID
            'username',     # Username
            'email',        # Email address
            'first_name',   # Optional first name
            'last_name',    # Optional last name
            'email_verified', # Whether primary email is verified
        ]
        
        # Fields that cannot be modified via API
        # (id and email should not change after creation)
        read_only_fields = ['id', 'email', 'email_verified']


class CustomPasswordResetSerializer(PasswordResetSerializer):
    """
    Custom serializer for password reset that:
    - forces building a frontend URL in the e-mail, and
    - keeps `reset_form` populated so a custom view can extract uid/token.
    """

    def get_email_options(self):
        # Build a custom URL that points to the frontend route and includes uid-token
        from allauth.account.utils import user_pk_to_url_str
        from allauth.account.forms import default_token_generator

        # Initialize holders
        self._last_uid = None
        self._last_temp_key = None
        self._last_password_reset_url = None

        def frontend_url_generator(request, user, temp_key):
            uid = user_pk_to_url_str(user)
            url = f"{settings.FRONTEND_URL}/reset-password/{uid}-{temp_key}"
            # Capture for later retrieval by the API view
            self._last_uid = uid
            self._last_temp_key = temp_key
            self._last_password_reset_url = url
            return url

        return {
            # Supply our custom URL generator to dj-rest-auth form
            'url_generator': frontend_url_generator,
            # Extra context shows up in the email templates
            'extra_email_context': {
                'frontend_url': settings.FRONTEND_URL,
            },
            # Token generator explicit for clarity (same as default)
            'token_generator': default_token_generator,
        }

    def save(self):
        # Call parent save to send emails and trigger our url_generator
        super().save()
        # Expose captured values for the view to read
        return {
            'uid': getattr(self, '_last_uid', None),
            'token': getattr(self, '_last_temp_key', None),
            'password_reset_url': getattr(self, '_last_password_reset_url', None),
        }
