from django.db import models

class MuscleGroup(models.Model):
    """Represents a muscle group, e.g., 'Chest', 'Back', 'Legs'."""
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class Equipment(models.Model):
    """Represents a piece of equipment, e.g., 'Barbell', 'Dumbbell', 'Body Only'."""
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class Exercise(models.Model):
    """Represents a single exercise from the library."""
    name = models.CharField(max_length=200, unique=True)
    source_id = models.CharField(max_length=100, unique=True, help_text="The ID from the source JSON file")
    force = models.CharField(max_length=50, null=True, blank=True)
    level = models.CharField(max_length=50)
    mechanic = models.CharField(max_length=50, null=True, blank=True)
    category = models.CharField(max_length=100)
    
    equipment = models.ForeignKey(Equipment, on_delete=models.SET_NULL, null=True, blank=True, related_name="exercises")
    primary_muscles = models.ManyToManyField(MuscleGroup, related_name="primary_exercises")
    secondary_muscles = models.ManyToManyField(MuscleGroup, related_name="secondary_exercises", blank=True)
    
    instructions = models.JSONField(default=list)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']
