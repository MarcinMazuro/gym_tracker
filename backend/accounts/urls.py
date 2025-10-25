from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from .views import CustomPasswordResetView

app_name = 'accounts'
urlpatterns = [
    # Override password reset to return uid/token and a frontend URL
    # Must come BEFORE including dj_rest_auth.urls to take precedence
    path('auth/password/reset/', CustomPasswordResetView.as_view(), name='rest_password_reset'),

    # dj-rest-auth provides these endpoints under /auth/
    path('auth/', include('dj_rest_auth.urls')),

    # Registration endpoints under /auth/registration/
    path('auth/registration/', include('dj_rest_auth.registration.urls')),

    # django-allauth account URLs (required for email verification)
    path('auth/account/', include('allauth.account.urls')),

    # JWT token refresh endpoint
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
