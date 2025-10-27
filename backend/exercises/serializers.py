from rest_framework import serializers
from .models import Exercise, MuscleGroup, Equipment

class MuscleGroupSerializer(serializers.ModelSerializer):
    """Serializer for the MuscleGroup model."""
    class Meta:
        model = MuscleGroup
        fields = ['id', 'name']

class EquipmentSerializer(serializers.ModelSerializer):
    """Serializer for the Equipment model"""
    class Meta:
        model = Equipment
        fields = ['id', 'name']

class ExerciseSerializer(serializers.ModelSerializer):
    """Serializer for the Exercise model"""
    equipment = serializers.StringRelatedField()
    primary_muscles = serializers.SerializerMethodField()
    secondary_muscles = serializers.SerializerMethodField()

    def get_primary_muscles(self, obj):
        return [str(m) for m in obj.primary_muscles.all()] if obj.primary_muscles.exists() else []

    def get_secondary_muscles(self, obj):
        return [str(m) for m in obj.secondary_muscles.all()] if obj.secondary_muscles.exists() else []

    class Meta:
        model = Exercise
        fields = [
            'id', 'name', 'force', 'level', 'mechanic', 'category', 
            'equipment', 'primary_muscles', 'secondary_muscles', 'instructions'
        ]
