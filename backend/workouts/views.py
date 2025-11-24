from django.shortcuts import get_object_or_404, render
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from django.db import transaction, IntegrityError
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

User = get_user_model()

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

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['user_sessions', 'public_detail']:
            # For viewing public profiles, only require authentication
            return [permissions.IsAuthenticated()]
        # For all other actions, require ownership
        return [permissions.IsAuthenticated(), IsOwner()]

    def get_serializer_class(self):
        if self.action == 'list' or self.action == 'user_sessions':
            return WorkoutSessionListSerializer
        return WorkoutSessionSerializer
    
    def get_queryset(self):
        return WorkoutSession.objects.filter(owner=self.request.user).prefetch_related(
            'logged_sets__exercise',
            'plan__groups__sets__exercise'
        ).order_by('-date_started')

    def create(self, request, *args, **kwargs):
        """
        Atomically get an existing active session or create a new one.
        This prevents race conditions where multiple sessions could be created.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        
        # get_or_create is an atomic operation.
        # It will either find the existing session with status='in_progress'
        # or create a new one using the data from the serializer.
        session, created = WorkoutSession.objects.get_or_create(
            owner=user,
            status='in_progress',
            defaults=serializer.validated_data
        )
        
        # Re-serialize the instance we got from the database
        # to ensure the response data is complete.
        output_serializer = self.get_serializer(session)
        
        if created:
            # If a new session was created, return 201 CREATED.
            headers = self.get_success_headers(output_serializer.data)
            return Response(output_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        else:
            # If an existing session was found, return 200 OK.
            return Response(output_serializer.data, status=status.HTTP_200_OK)

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
    
    @action(detail=False, methods=['get'], url_path='user/(?P<username>[^/.]+)')
    def user_sessions(self, request, username=None):
        """
        Get completed workout sessions for a specific user (only if their profile is public).
        """
        # Use case-insensitive lookup for username
        user = get_object_or_404(User, username__iexact=username)

        # Check if the user's profile is public
        if not hasattr(user, 'profile') or not user.profile.is_public:
            return Response(
                {'detail': 'This user\'s workout history is not public.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Build a new queryset from scratch, ignoring the default get_queryset()
        queryset = WorkoutSession.objects.filter(
            owner=user,
        ).prefetch_related(
            'logged_sets__exercise',
            'plan__groups__sets__exercise'
        ).order_by('-date_started')

        
        # Paginate the results
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='public')
    def public_detail(self, request, pk=None):
        """
        Get the details of a single workout session, if the owner's profile is public.
        """
        session = get_object_or_404(
            WorkoutSession.objects.prefetch_related(
                'logged_sets__exercise',
                'plan__groups__sets__exercise'
            ),
            pk=pk
        )

        # Check if the owner's profile is public
        if not hasattr(session.owner, 'profile') or not session.owner.profile.is_public:
            return Response(
                {'detail': 'This user\'s workout history is not public.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(session)
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