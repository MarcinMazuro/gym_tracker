from django.db import models
from django.conf import settings
from exercises.models import Exercise

# Get the user model defined in 'accounts' app
User = settings.AUTH_USER_MODEL

class WorkoutPlan(models.Model):
    """
    The routine, whole workout e.g., "Push Day A"
    """
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workout_plans')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
    
class ExerciseGroup(models.Model):
    """
    A block of exercises/sets in the plan.
    e.g., "1. Warm up" or "2. Squats" or "3. Superset: Pullups & Dips"
    """
    workout_plan = models.ForeignKey(WorkoutPlan, on_delete=models.CASCADE, related_name='groups')
    # The order of this block in the workout (e.g., 1, 2, 3...)
    order = models.PositiveIntegerField()
    # Optional name for the group
    name = models.CharField(max_length=100, blank=True, null=True, help_text="e.g., 'Main Lift' or 'Accessory Superset'")

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Group {self.order}: {self.name or 'Group'} in '{self.workout_plan.name}'"
    
class PlannedSet(models.Model):
    """
    A single planned set within an ExerciseGroup.
    This is the core of flexible logic.
    """
    group = models.ForeignKey(ExerciseGroup, on_delete=models.CASCADE, related_name='sets')
    # The exercise for this *specific* set
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, related_name='planned_sets')
    
    # The order of this set *within the group*
    order = models.PositiveIntegerField()

    # Target (Plan) Fields
    target_reps = models.CharField(max_length=20, blank=True, null=True, help_text="e.g., '8' or '8-12'")
    target_weight = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    
    # Custom Rest Time
    # The rest time *after* this set is completed
    # Stored in seconds
    rest_time_after = models.PositiveIntegerField(null=True, blank=True, help_text="Rest in seconds AFTER this set")
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Set {self.order}: {self.exercise.name} ({self.target_reps} reps)"
    
class WorkoutSession(models.Model):
    """
    A single, logged workout instance. This is the "History" item.
    """
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    # Link to the plan this session was based on (optional)
    # SET_NULL: If a plan is deleted, the history remains.
    plan = models.ForeignKey(WorkoutPlan, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')

    current_group_index = models.PositiveIntegerField(default=0, help_text="Index of the current exercise group")
    current_set_index = models.PositiveIntegerField(default=0, help_text="Index of the current set within the group")

    date_started = models.DateTimeField(auto_now_add=True)
    date_finished = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-date_started']

    def __str__(self):
        return f"Session for {self.owner.username} on {self.date_started.strftime('%Y-%m-%d')}"
    
class LoggedSet(models.Model):
    """
    A log of a single, *actually performed* set.
    """
    session = models.ForeignKey(WorkoutSession, on_delete=models.CASCADE, related_name='logged_sets')
    # The exercise that was performed
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, related_name='logged_sets')
    
    # Link to the plan, so you can compare target vs. actual
    planned_set = models.ForeignKey(PlannedSet, on_delete=models.SET_NULL, null=True, blank=True)
    
    # The order this set was performed in the *overall session*
    order = models.PositiveIntegerField()

    # --- Actual (Logged) Fields ---
    actual_reps = models.PositiveIntegerField()
    actual_weight = models.DecimalField(max_digits=6, decimal_places=2)
    # The rest time the user *actually* took
    actual_rest_time = models.PositiveIntegerField(null=True, blank=True, help_text="Actual rest in seconds")

    class Meta:
        ordering = ['order']
