from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'plans', views.WorkoutPlanViewSet, basename='workoutplan')
router.register(r'sessions', views.WorkoutSessionViewSet, basename='workoutsession')
router.register(r'logged-sets', views.LoggedSetViewSet, basename='loggedset')

urlpatterns = [
    path('', include(router.urls)),
]
