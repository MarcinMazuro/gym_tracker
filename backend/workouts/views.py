from django.shortcuts import render

from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import WorkoutPlan, ExerciseGroup, PlannedSet, WorkoutSession, LoggedSet
from .serializers import (
    WorkoutPlanSerializer, 
    WorkoutSessionSerializer, 
    LoggedSetSerializer
)

# Custom Permission
class IsOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to view or edit it.
    """
    def has_object_permission(self, request, view, obj):
        # The 'owner' field exists on WorkoutPlan and WorkoutSession
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        
        # For LoggedSet, we check the owner of the parent session
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
    # User must be authenticated AND be the owner to interact
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        """
        This view should only return plans owned by the currently
        authenticated user.
        """
        # We prefetch 'groups' and 'sets' to optimize database queries
        return WorkoutPlan.objects.filter(owner=self.request.user).prefetch_related(
            'groups__sets'
        )

    def perform_create(self, serializer):
        """
        Automatically assign the current user as the owner when
        a new workout plan is created.
        """
        serializer.save(owner=self.request.user)

# Workout Session ViewSet
class WorkoutSessionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for starting, viewing, and managing workout sessions (history).
    """
    serializer_class = WorkoutSessionSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        """
        Only return sessions owned by the current user.
        We prefetch 'logged_sets' for performance.
        """
        return WorkoutSession.objects.filter(owner=self.request.user).prefetch_related(
            'logged_sets__exercise'
        ).order_by('-date_started') # Show most recent first

    def perform_create(self, serializer):
        """
        Automatically assign the current user as the owner.
        The frontend will send the 'plan' ID (if any) and 'date_started'.
        """
        serializer.save(owner=self.request.user)

# Logged Set ViewSet
class LoggedSetViewSet(viewsets.ModelViewSet):
    """
    API endpoint for logging individual sets *during* a workout.
    The frontend will POST to this endpoint for every set completed.
    """
    serializer_class = LoggedSetSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner] # IsOwner checks session owner

    def get_queryset(self):
        """
        Only return sets that are part of sessions owned by the current user.
        """
        return LoggedSet.objects.filter(session__owner=self.request.user)

    def create(self, request, *args, **kwargs):
        """
        Custom create method to link the set to the correct session.
        We expect the frontend to send `session_id` in the request body.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Find the session the user wants to add this set to
        try:
            session = WorkoutSession.objects.get(
                id=request.data.get('session_id'), 
                owner=request.user
            )
        except WorkoutSession.DoesNotExist:
            return Response(
                {"error": "Invalid session ID or you are not the owner."}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Save the set, manually linking it to the user's session
        serializer.save(session=session)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    