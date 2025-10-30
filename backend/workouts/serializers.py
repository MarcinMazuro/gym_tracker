from rest_framework import serializers
from .models import WorkoutPlan, ExerciseGroup, PlannedSet, WorkoutSession, LoggedSet
from exercises.serializers import ExerciseSerializer

class PlannedSetSerializer(serializers.ModelSerializer):
    """
    Serializer for a single planned set.
    """
   
    class Meta:
        model = PlannedSet
        # Specify 'exercise' directly. The frontend will send the exercise ID.
        fields = ['id', 'exercise', 'order', 'target_reps', 'target_weight', 'rest_time_after']


class ExerciseGroupSerializer(serializers.ModelSerializer):
    """
    Serializer for an Exercise Group, which nests its sets.
    """
    # This nests the 'PlannedSetSerializer' inside the group
    sets = PlannedSetSerializer(many=True)

    class Meta:
        model = ExerciseGroup
        fields = ['id', 'order', 'name', 'sets']


class WorkoutPlanSerializer(serializers.ModelSerializer):
    """
    Serializer for the full Workout Plan.
    It nests groups, which in turn nest sets.
    """
    groups = ExerciseGroupSerializer(many=True)
    owner_username = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = WorkoutPlan
        fields = ['id', 'owner', 'owner_username', 'name', 'description', 'groups']
        read_only_fields = ['owner']

    def create(self, validated_data):
        """
        Custom create method to handle nested group and set creation.
        """
        groups_data = validated_data.pop('groups')
        # Create the plan instance
        workout_plan = WorkoutPlan.objects.create(**validated_data)
        
        # Loop through each group's data
        for group_data in groups_data:
            sets_data = group_data.pop('sets')
            # Create the group instance, linking it to the plan
            group = ExerciseGroup.objects.create(workout_plan=workout_plan, **group_data)
            
            # Loop through each set's data
            for set_data in sets_data:
                # Create the set instance, linking it to the group
                PlannedSet.objects.create(group=group, **set_data)
        return workout_plan

    def update(self, instance, validated_data):
        """
        Custom update method to handle nested updates.
        This is the "simple" way: delete all old children and recreate.
        """
        groups_data = validated_data.pop('groups')

        # Update the plan's top-level fields
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        instance.save()

        # Delete all old groups and their sets
        instance.groups.all().delete()

        # Re-create the groups and sets from the new data (just like in create)
        for group_data in groups_data:
            sets_data = group_data.pop('sets')
            group = ExerciseGroup.objects.create(workout_plan=instance, **group_data)
            for set_data in sets_data:
                PlannedSet.objects.create(group=group, **set_data)
        
        return instance


class LoggedSetSerializer(serializers.ModelSerializer):
    """
    Serializer for logging a single set.
    """
    class Meta:
        model = LoggedSet
        fields = ['id', 'session', 'exercise', 'planned_set', 'order', 'actual_reps', 
                  'actual_weight', 'actual_rest_time', 'completed_at']
        read_only_fields = ['session', 'completed_at']



class WorkoutSessionSerializer(serializers.ModelSerializer):
    """
    Serializer for the workout session (the history item).
    """
    # Make 'logged_sets' read_only because sets will be created
    # individually, not nested within the session creation.
    logged_sets = LoggedSetSerializer(many=True, read_only=True)
    owner_username = serializers.ReadOnlyField(source='owner.username')
    plan_details = WorkoutPlanSerializer(source='plan', read_only=True)

    class Meta:
        model = WorkoutSession
        fields = [
            'id', 'owner', 'owner_username', 'plan', 'plan_details',
            'status', 'current_group_index', 'current_set_index',
            'date_started', 'date_finished', 'notes', 'logged_sets'
        ]
        read_only_fields = ['owner', 'date_started']


class WorkoutSessionListSerializer(serializers.ModelSerializer):
    """
    Lighter serializer for listing sessions (without full plan details).
    """
    owner_username = serializers.ReadOnlyField(source='owner.username')
    set_count = serializers.SerializerMethodField()
    plan_name = serializers.CharField(source='plan.name', read_only=True)

    def get_set_count(self, obj):
        return obj.logged_sets.count()

    class Meta:
        model = WorkoutSession
        fields = [
            'id', 'owner_username', 'plan', 'status', 'plan_name',
            'date_started', 'date_finished', 'set_count'
        ]
        