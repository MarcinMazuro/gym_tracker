from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExerciseViewSet, MuscleGroupListView, EquipmentListView

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'', ExerciseViewSet, basename='exercise')

# The API URLs are now determined automatically by the router.
# Additionally, we include the URLs for our other list views.
urlpatterns = [
    path('', include(router.urls)),
    path('muscle-groups/', MuscleGroupListView.as_view(), name='muscle-group-list'),
    path('equipment/', EquipmentListView.as_view(), name='equipment-list'),
]