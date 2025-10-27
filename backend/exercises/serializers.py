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
    primary_muscles = serializers.StringRelatedField(many=True)
    secondary_muscles = serializers.StringRelatedField(many=True)

    class Meta:
        model = Exercise
        fields = [
            'id', 'name', 'force', 'level', 'mechanic', 'category', 
            'equipment', 'primary_muscles', 'secondary_muscles', 'instructions'
        ]
