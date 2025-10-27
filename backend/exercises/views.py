from rest_framework import viewsets, generics
from rest_framework.permissions import IsAuthenticated
from .models import Exercise, MuscleGroup, Equipment
from .serializers import ExerciseSerializer, MuscleGroupSerializer, EquipmentSerializer

class ExerciseViewSet(viewsets.ReadOnlyModelViewSet):
    """
    A viewset for viewing exercises. Provides `list` and `retrieve` actions.
    """
    # Add prefetching to optimize database queries
    queryset = Exercise.objects.all().select_related('equipment').prefetch_related('primary_muscles', 'secondary_muscles')
    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticated] # Only logged-in users can see exercises

class MuscleGroupListView(generics.ListAPIView):
    """
    An API view for listing all muscle groups. Useful for frontend filters.
    """
    queryset = MuscleGroup.objects.all().order_by('name')
    serializer_class = MuscleGroupSerializer
    permission_classes = [IsAuthenticated]

class EquipmentListView(generics.ListAPIView):
    """
    An API view for listing all available equipment. Useful for frontend filters.
    """
    queryset = Equipment.objects.all().order_by('name')
    serializer_class = EquipmentSerializer
    permission_classes = [IsAuthenticated]
    