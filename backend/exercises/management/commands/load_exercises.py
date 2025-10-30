import json
from django.core.management.base import BaseCommand
from django.db import transaction
from exercises.models import Exercise, MuscleGroup, Equipment

class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('json_file', type=str)

    @transaction.atomic
    def handle(self, *args, **options):
        json_file_path = options['json_file']
        self.stdout.write(f"Loading exercises from {json_file_path}...")

        try:
            with open(json_file_path, 'r') as f:
                data = json.load(f)
        except FileNotFoundError:
            self.stderr.write(self.style.ERROR(f"Fiel not found at {json_file_path}"))
            return
        
        # Keep track of created objects to avoid redundant DB queries
        muscle_groups = {mg.name: mg for mg in MuscleGroup.objects.all()}
        equipments = {eq.name: eq for eq in Equipment.objects.all()}

        for exercise_data in data:
            # Get or create Equipment
            equipment_name = exercise_data.get('equipment')
            if equipment_name and equipment_name not in equipments:
                equipments[equipment_name] = Equipment.objects.create(name=equipment_name)
            equipment_obj = equipments.get(equipment_name)

            # Create the exercise object
            exercise, created = Exercise.objects.update_or_create(
                source_id=exercise_data['id'],
                defaults={
                    'name': exercise_data['name'],
                    'force': exercise_data.get('force'),
                    'level': exercise_data['level'],
                    'mechanic': exercise_data.get('mechanic'),
                    'category': exercise_data['category'],
                    'equipment': equipment_obj,
                    'instructions': exercise_data.get('instructions', []),
                }
            )

            # Handle Primary Muscles (ManyToMany)
            primary_muscle_names = exercise_data.get('primaryMuscles', [])
            primary_muscle_objs = []
            for name in primary_muscle_names:
                if name not in muscle_groups:
                    muscle_groups[name] = MuscleGroup.objects.create(name=name)
                primary_muscle_objs.append(muscle_groups[name])
            exercise.primary_muscles.set(primary_muscle_objs)

            # Handle Secondary Muscles (ManyToMany)
            secondary_muscle_names = exercise_data.get('secondaryMuscles', [])
            secondary_muscle_objs = []
            for name in secondary_muscle_names:
                if name not in muscle_groups:
                    muscle_groups[name] = MuscleGroup.objects.create(name=name)
                secondary_muscle_objs.append(muscle_groups[name])
            exercise.secondary_muscles.set(secondary_muscle_objs)

            if created:
                self.stdout.write(self.style.SUCCESS(f"Successfully created exercise: {exercise.name}"))
            else:
                self.stdout.write(f"Updated exercise: {exercise.name}")

        self.stdout.write(self.style.SUCCESS("Finished loading all exercises."))

