# workouts/serializers.py
from rest_framework import serializers
from .models import (
    WorkoutTemplate, ExerciseTemplate, SetTemplate,
    Program, WorkoutInstance, ExerciseInstance, SetInstance, ProgramShare,
    WorkoutLog, ExerciseLog, SetLog
)

# Template Serializers
class SetTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SetTemplate
        fields = ['id', 'reps', 'weight', 'rest_time', 'order']
        read_only_fields = ['id']

class ExerciseTemplateSerializer(serializers.ModelSerializer):
    sets = SetTemplateSerializer(many=True, read_only=True)
    
    class Meta:
        model = ExerciseTemplate
        fields = ['id', 'name', 'equipment', 'notes', 'order', 'sets']
        read_only_fields = ['id']

class WorkoutTemplateSerializer(serializers.ModelSerializer):
    exercises = ExerciseTemplateSerializer(many=True, read_only=True)
    creator_username = serializers.CharField(source='creator.username', read_only=True)
    
    class Meta:
        model = WorkoutTemplate
        fields = [
           'id', 'name', 'description', 'split_method',
           'creator_username', 'is_public', 'exercises',
           'difficulty_level', 'estimated_duration',
           'equipment_required', 'tags', 'use_count',
           'created_at', 'updated_at'
       ]
        read_only_fields = ['id', 'creator_username', 'created_at', 'updated_at']

# Instance Serializers
class SetInstanceSerializer(serializers.ModelSerializer):
    based_on_template_id = serializers.IntegerField(source='based_on_template.id', read_only=True)
    
    class Meta:
        model = SetInstance
        fields = ['id', 'reps', 'weight', 'rest_time', 'order', 'based_on_template_id']
        read_only_fields = ['id', 'based_on_template_id']

class ExerciseInstanceSerializer(serializers.ModelSerializer):
    sets = SetInstanceSerializer(many=True, read_only=True)
    based_on_template_id = serializers.IntegerField(source='based_on_template.id', read_only=True)
    
    class Meta:
        model = ExerciseInstance
        fields = [
            'id', 'name', 'equipment', 'notes', 'order',
            'sets', 'based_on_template_id'
        ]
        read_only_fields = ['id', 'based_on_template_id']

class WorkoutInstanceSerializer(serializers.ModelSerializer):
    exercises = ExerciseInstanceSerializer(many=True, read_only=True)
    based_on_template_id = serializers.IntegerField(source='based_on_template.id', read_only=True)
    weekday_name = serializers.CharField(source='get_preferred_weekday_display', read_only=True)
    
    class Meta:
        model = WorkoutInstance
        fields = [
            'id', 'name', 'description', 'split_method',
            'preferred_weekday', 'weekday_name', 'order',
            'exercises', 'based_on_template_id'
        ]
        read_only_fields = ['id', 'based_on_template_id', 'weekday_name']

# Program Serializers
class ProgramSerializer(serializers.ModelSerializer):
    workouts = WorkoutInstanceSerializer(source='workout_instances', many=True, read_only=True)
    likes_count = serializers.IntegerField(read_only=True)
    forks_count = serializers.IntegerField(read_only=True)
    is_liked = serializers.SerializerMethodField()
    creator_username = serializers.CharField(source='creator.username', read_only=True)
    forked_from_name = serializers.CharField(source='forked_from.name', read_only=True)
    
    class Meta:
        model = Program
        fields = [
           'id', 'name', 'description', 'focus',
           'sessions_per_week', 'workouts', 'creator_username',
           'is_active', 'is_public', 'likes_count', 
           'difficulty_level', 'recommended_level',
           'required_equipment', 'estimated_completion_weeks',
           'tags', 'forked_from_name', 'forks_count', 'is_liked',
           'forked_from', 'created_at', 'updated_at'
       ]
        read_only_fields = [
            'id', 'creator_username', 'likes_count',
            'forks_count', 'is_liked', 'forked_from',
            'forked_from_name', 'created_at', 'updated_at'
        ]

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(id=request.user.id).exists()
        return False

class ProgramShareSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source='program.name', read_only=True)
    shared_with_username = serializers.CharField(source='shared_with.username', read_only=True)
    
    class Meta:
        model = ProgramShare
        fields = ['id', 'program', 'program_name', 'shared_with', 
                 'shared_with_username', 'created_at']
        read_only_fields = ['id', 'created_at']

# Log Serializers
class SetLogSerializer(serializers.ModelSerializer):
    based_on_instance_id = serializers.IntegerField(source='based_on_instance.id', read_only=True)
    id = serializers.IntegerField(required=False)
    
    class Meta:
        model = SetLog
        fields = [
            'id', 'reps', 'weight', 'rest_time', 'order',
            'based_on_instance_id'
        ]
        read_only_fields = ['based_on_instance_id']

class ExerciseLogSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)  
    sets = SetLogSerializer(many=True)
    based_on_instance_id = serializers.IntegerField(source='based_on_instance.id', read_only=True)
    
    class Meta:
        model = ExerciseLog
        fields = [
            'id', 'name', 'equipment', 'notes', 'order',
            'sets', 'based_on_instance_id'
        ]
        read_only_fields = ['based_on_instance_id']

class WorkoutLogSerializer(serializers.ModelSerializer):
    exercises = ExerciseLogSerializer(many=True, read_only=True)
    based_on_instance_id = serializers.IntegerField(source='based_on_instance.id', read_only=True)
    program_name = serializers.CharField(source='program.name', read_only=True)
    gym_name = serializers.CharField(source='gym.name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = WorkoutLog
        fields = [
           'id', 'name', 'user', 'username', 'program', 'program_name',
           'based_on_instance_id', 'date', 'gym', 'gym_name',
           'notes', 'completed', 'mood_rating', 'perceived_difficulty', 
           'performance_notes', 'media', 'exercises', 'created_at'
       ]
        read_only_fields = [
            'id', 'user', 'username', 'program_name',
            'gym_name', 'created_at', 'based_on_instance_id'
        ]

class WorkoutLogCreateSerializer(serializers.ModelSerializer):
    exercises = ExerciseLogSerializer(many=True)
    
    class Meta:
        model = WorkoutLog
        fields = [
            'name', 'based_on_instance', 'program', 'date',
            'gym', 'notes', 'completed', 'exercises',
            'mood_rating', 'perceived_difficulty',
            'performance_notes', 'media'
        ]

    def create(self, validated_data):
        print("Debug - Create method called")
        print("Debug - Validated data:", validated_data)
        
        exercises_data = validated_data.pop('exercises', [])
        print("Debug - Exercises data:", exercises_data)
        
        try:
            # Create the workout log
            workout_log = WorkoutLog.objects.create(**validated_data)
            print("Debug - Created workout log:", workout_log)
            
            # Create exercises
            for exercise_data in exercises_data:
                print("Debug - Processing exercise:", exercise_data)
                sets_data = exercise_data.pop('sets', [])
                
                # Create exercise
                exercise = ExerciseLog.objects.create(
                    workout=workout_log,
                    **exercise_data
                )
                print("Debug - Created exercise:", exercise)
                
                # Create sets for this exercise
                for set_data in sets_data:
                    print("Debug - Processing set:", set_data)
                    set_obj = SetLog.objects.create(
                        exercise=exercise,
                        **set_data
                    )
                    print("Debug - Created set:", set_obj)
            
            return workout_log
            
        except Exception as e:
            print("Debug - Error occurred:", str(e))
            print("Debug - Error type:", type(e))
            import traceback
            print("Debug - Traceback:", traceback.format_exc())
            raise

class WorkoutLogUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating workout logs with nested exercises and sets"""
    exercises = ExerciseLogSerializer(many=True)
    
    class Meta:
        model = WorkoutLog
        fields = [
            'name', 'based_on_instance', 'program', 'date',
            'gym', 'notes', 'completed', 'exercises',
            'mood_rating', 'perceived_difficulty',
            'performance_notes', 'media'
        ]

    def update(self, instance, validated_data):
        exercises_data = validated_data.pop('exercises', [])
        
        # Update basic workout log fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Keep track of existing exercises
        current_exercises = {exercise.id: exercise for exercise in instance.exercises.all()}
        
        # Track which exercises to keep
        exercises_to_keep = []

        # Update or create exercises
        for exercise_data in exercises_data:
            exercise_id = exercise_data.get('id')
            sets_data = exercise_data.pop('sets', [])

            if exercise_id and exercise_id in current_exercises:
                # Update existing exercise
                exercise = current_exercises[exercise_id]
                for attr, value in exercise_data.items():
                    if attr != 'sets':
                        setattr(exercise, attr, value)
                exercise.save()
            else:
                # Create new exercise
                exercise = ExerciseLog.objects.create(
                    workout=instance,
                    **exercise_data
                )

            # Keep track of existing sets for this exercise
            current_sets = {set_obj.id: set_obj for set_obj in exercise.sets.all()}
            sets_to_keep = []

            # Update or create sets
            for set_data in sets_data:
                set_id = set_data.get('id')
                
                if set_id and set_id in current_sets:
                    # Update existing set
                    set_obj = current_sets[set_id]
                    for attr, value in set_data.items():
                        if attr != 'id':
                            setattr(set_obj, attr, value)
                    set_obj.save()
                    sets_to_keep.append(set_obj.id)
                else:
                    # Create new set
                    new_set = SetLog.objects.create(
                        exercise=exercise,
                        reps=set_data.get('reps', 0),
                        weight=set_data.get('weight', 0),
                        rest_time=set_data.get('rest_time', 60),
                        order=set_data.get('order', 0)
                    )
                    sets_to_keep.append(new_set.id)

            # Delete sets that are no longer present
            exercise.sets.exclude(id__in=sets_to_keep).delete()
            exercises_to_keep.append(exercise.id)

        # Delete exercises that are no longer present
        instance.exercises.exclude(id__in=exercises_to_keep).delete()

        # Refresh from db to get the updated instance with all relations
        return WorkoutLog.objects.prefetch_related(
            'exercises__sets'
        ).get(id=instance.id)