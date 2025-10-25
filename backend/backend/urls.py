"""
URL configuration for backend project.

Main URL router - includes all app URLs here.
All API endpoints will be under /api/v1/ prefix.
"""
from django.contrib import admin
from django.urls import path, include

from accounts.views import CustomPasswordResetView

urlpatterns = [
    # Django admin panel
    # Access at: http://localhost:8000/admin/
    path('admin/', admin.site.urls),
    
    # API endpoints (version 1)
    # All authentication endpoints will be under /api/v1/auth/
    # Example: http://localhost:8000/api/v1/auth/login/
    # Override the default password reset endpoint to return uid/token
    path('api/v1/auth/password/reset/', CustomPasswordResetView.as_view(), name='rest_password_reset'),
    path('api/v1/auth/', include('dj_rest_auth.urls')),
    path('api/v1/auth/registration/', include('dj_rest_auth.registration.urls')),
    
    # Dołączamy ścieżki z aplikacji accounts
    path('api/v1/accounts/', include('accounts.urls')),

    # Dołączenie django.contrib.auth.urls jest wymagane przez dj-rest-auth
    # do generowania linków resetowania hasła.
    # Te ścieżki nie będą bezpośrednio dostępne przez API, ale są potrzebne dla funkcji reverse().
    path('auth-utils/', include('django.contrib.auth.urls')),
]
