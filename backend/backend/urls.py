"""
URL configuration for backend project.

Main URL router - includes all app URLs here.
All API endpoints are centralized under /api/v1/ via accounts.urls.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Django admin panel
    path('admin/', admin.site.urls),

    # Unified API v1: include all auth/account endpoints from accounts app
    # Example: http://localhost:8000/api/v1/auth/login/
    path('api/v1/profiles/', include('profiles.urls')),
    path('api/v1/exercises/', include('exercises.urls')),
    path('api/v1/', include('accounts.urls')),

    # Utility auth URLs required internally by dj-rest-auth/allauth (not part of public API)
    path('auth-utils/', include('django.contrib.auth.urls')),
]
