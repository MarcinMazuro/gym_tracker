from django.shortcuts import render
from django.utils import timezone
from datetime import timedelta
from rest_framework.exceptions import ValidationError
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import WorkoutPlan, ExerciseGroup, PlannedSet, WorkoutSession, LoggedSet
from .serializers import (
    WorkoutPlanSerializer, 
    WorkoutSessionSerializer,
    WorkoutSessionListSerializer,
    LoggedSetSerializer
)

# Custom Permission
class IsOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to view or edit it.
    """
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        if hasattr(obj, 'session'):
            return obj.session.owner == request.user
        return False

# Workout Plan ViewSet
class WorkoutPlanViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to create, view, edit, and delete
    their personal workout plans.
    """
    serializer_class = WorkoutPlanSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        return WorkoutPlan.objects.filter(owner=self.request.user).prefetch_related(
            'groups__sets'
        )

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

# Workout Session ViewSet
class WorkoutSessionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for workout sessions with active session support.
    """
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_serializer_class(self):
        if self.action == 'list':
            return WorkoutSessionListSerializer
        return WorkoutSessionSerializer

    def get_queryset(self):
        return WorkoutSession.objects.filter(owner=self.request.user).prefetch_related(
            'logged_sets__exercise',
            'plan__groups__sets__exercise'
        ).order_by('-date_started')

    def perform_create(self, serializer):
        # Throttle rapid creation: prevent creating multiple sessions within a short window
        # This helps avoid duplicates when the client retries (e.g. after auth refresh)
        window_seconds = 30
        threshold = timezone.now() - timedelta(seconds=window_seconds)

        recent_exists = WorkoutSession.objects.filter(
            owner=self.request.user,
            date_started__gte=threshold
        ).exists()

        if recent_exists:
            raise ValidationError({'detail': f'A workout session was created less than {window_seconds} seconds ago. Please resume the active session or wait a moment.'})

        # Check if user already has an active session and mark it cancelled if present
        active_session = WorkoutSession.objects.filter(
            owner=self.request.user,
            status='in_progress'
        ).first()

        if active_session:
            # Auto-cancel the old session
            active_session.status = 'cancelled'
            active_session.date_finished = timezone.now()
            active_session.save()

        serializer.save(owner=self.request.user)

    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        Get the current active (in_progress) session for the user.
        Returns 404 if no active session exists.
        """
        active_session = WorkoutSession.objects.filter(
            owner=request.user,
            status='in_progress'
        ).prefetch_related(
            'logged_sets__exercise',
            'plan__groups__sets__exercise'
        ).first()
        
        if not active_session:
            return Response(
                {'detail': 'No active workout session found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(active_session)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def update_progress(self, request, pk=None):
        """
        Update the current position in the workout.
        Expects: { current_group_index, current_set_index }
        """
        session = self.get_object()
        
        if session.status != 'in_progress':
            return Response(
                {'error': 'Cannot update progress of a finished session.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        current_group_index = request.data.get('current_group_index')
        current_set_index = request.data.get('current_set_index')
        
        if current_group_index is not None:
            session.current_group_index = current_group_index
        if current_set_index is not None:
            session.current_set_index = current_set_index
        
        session.save()
        serializer = self.get_serializer(session)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def finish(self, request, pk=None):
        """
        Mark the session as completed.
        """
        session = self.get_object()
        
        if session.status != 'in_progress':
            return Response(
                {'error': 'Session is already finished.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        session.status = 'completed'
        session.date_finished = timezone.now()
        session.save()
        
        serializer = self.get_serializer(session)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Mark the session as cancelled.
        """
        session = self.get_object()
        
        if session.status != 'in_progress':
            return Response(
                {'error': 'Session is already finished.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        session.status = 'cancelled'
        session.date_finished = timezone.now()
        session.save()
        
        serializer = self.get_serializer(session)
        return Response(serializer.data)


class LoggedSetViewSet(viewsets.ModelViewSet):
    """
    API endpoint for logging individual sets.
    """
    serializer_class = LoggedSetSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        return LoggedSet.objects.filter(session__owner=self.request.user)

    def create(self, request, *args, **kwargs):
        """
        Log a set and automatically update session progress.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Find the session
        session_id = request.data.get('session_id')
        try:
            session = WorkoutSession.objects.get(
                id=session_id,
                owner=request.user,
                status='in_progress'
            )
        except WorkoutSession.DoesNotExist:
            return Response(
                {"error": "Invalid or finished session."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Save the logged set
        logged_set = serializer.save(session=session)
        
        # Auto-update progress if provided
        current_group_index = request.data.get('current_group_index')
        current_set_index = request.data.get('current_set_index')
        
        if current_group_index is not None:
            session.current_group_index = current_group_index
        if current_set_index is not None:
            session.current_set_index = current_set_index
        session.save()
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)