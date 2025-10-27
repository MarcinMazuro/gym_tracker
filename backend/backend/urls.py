"""
URL configuration for backend project.

Main URL router - includes all app URLs here.
All API endpoints are centralized under /api/v1/ via accounts.urls.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/v1/profiles/', include('profiles.urls')),
    path('api/v1/exercises/', include('exercises.urls')), # <-- ADD THIS LINE
    path('api/v1/auth/', include('accounts.urls')),

    path('auth-utils/', include('django.contrib.auth.urls')),
]
