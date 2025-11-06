from rest_framework import viewsets, generics
from rest_framework.permissions import IsAuthenticated
from .models import Exercise, MuscleGroup, Equipment
from .serializers import ExerciseSerializer, MuscleGroupSerializer, EquipmentSerializer, CategorySerializer
from django_filters.rest_framework import DjangoFilterBackend, FilterSet
import django_filters

class ExerciseFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(lookup_expr='icontains')
    force = django_filters.CharFilter(lookup_expr='iexact')
    level = django_filters.CharFilter(lookup_expr='iexact')
    mechanic = django_filters.CharFilter(lookup_expr='iexact')
    category = django_filters.CharFilter(lookup_expr='iexact')
    equipment = django_filters.CharFilter(field_name='equipment__name', lookup_expr='iexact')
    primary_muscles = django_filters.CharFilter(field_name='primary_muscles__name', lookup_expr='iexact')
    secondary_muscles = django_filters.CharFilter(field_name='secondary_muscles__name', lookup_expr='iexact')
    id_in = django_filters.CharFilter(method='filter_id_in')

    def filter_id_in(self, queryset, name, value):
        """Filter exercises by comma-separated list of IDs"""
        if value:
            ids = [int(id.strip()) for id in value.split(',') if id.strip().isdigit()]
            return queryset.filter(id__in=ids)
        return queryset

    class Meta:
        model = Exercise
        fields = [
            'name', 'force', 'level', 'mechanic', 'category',
            'equipment', 'primary_muscles', 'secondary_muscles', 'id_in'
        ]

class ExerciseViewSet(viewsets.ReadOnlyModelViewSet):
    """
    A viewset for viewing exercises. Provides `list` and `retrieve` actions.
    """
    queryset = Exercise.objects.all().select_related('equipment').prefetch_related('primary_muscles', 'secondary_muscles')
    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = ExerciseFilter

class MuscleGroupListView(generics.ListAPIView):
    """
    An API view for listing all muscle groups. Useful for frontend filters.
    """
    queryset = MuscleGroup.objects.all().order_by('name')
    serializer_class = MuscleGroupSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Disable pagination for this endpoint

class EquipmentListView(generics.ListAPIView):
    """
    An API view for listing all available equipment. Useful for frontend filters.
    """
    queryset = Equipment.objects.all().order_by('name')
    serializer_class = EquipmentSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Disable pagination for this endpoint

class CategoryListView(generics.ListAPIView):
    """
    An API view for listing all exercise categories. Useful for frontend filters.
    """
    queryset = Exercise.objects.values_list('category', flat=True).distinct().order_by('category')
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Disable pagination for this endpoint
