# workouts/serializers.py
from rest_framework import serializers
from .models import (
    WorkoutTemplate, ExerciseTemplate, SetTemplate,
    Program, WorkoutInstance, ExerciseInstance, SetInstance, ProgramShare,
    WorkoutLog, ExerciseLog, SetLog
)

# Template Serializers
class SetTemplateSerializer(serializers.ModelSerializer):
    weight_display = serializers.CharField(source='get_weight_display', read_only=True)
    weight_unit_display = serializers.CharField(source='get_weight_unit_display', read_only=True)
    
    class Meta:
        model = SetTemplate
        fields = ['id', 'reps', 'weight', 'weight_unit', 'weight_unit_display', 'weight_display', 
                 'duration', 'distance', 'rest_time', 'order']
        read_only_fields = ['id', 'weight_display', 'weight_unit_display']

    def validate(self, data):
        """Ensure appropriate fields are provided based on the exercise's effort_type"""
        # Note: We can't access the exercise's effort_type directly here since this is a set serializer
        # The validation will be handled at the exercise level or in the views
        return data

class ExerciseTemplateSerializer(serializers.ModelSerializer):
    sets = SetTemplateSerializer(many=True, read_only=True)
    superset_paired_exercise = serializers.SerializerMethodField()
    effort_type_display = serializers.CharField(source='get_effort_type_display', read_only=True)
    
    class Meta:
        model = ExerciseTemplate
        fields = [
            'id', 'name', 'equipment', 'notes', 'order', 'effort_type', 'effort_type_display',
            'sets', 'superset_with', 'superset_paired_exercise', 'is_superset'
        ]
        read_only_fields = ['id', 'effort_type_display']
    
    def get_superset_paired_exercise(self, obj):
        if obj.superset_with is not None:
            try:
                paired_exercise = obj.workout.exercises.filter(order=obj.superset_with).first()
                if paired_exercise:
                    return {
                        'id': paired_exercise.id,
                        'name': paired_exercise.name,
                        'order': paired_exercise.order
                    }
            except Exception as e:
                print(f"Error finding paired exercise: {e}")
                return None
        return None

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
    id = serializers.IntegerField(required=False)
    weight_display = serializers.CharField(source='get_weight_display', read_only=True)
    weight_unit_display = serializers.CharField(source='get_weight_unit_display', read_only=True)
    
    class Meta:
        model = SetInstance
        fields = ['id', 'reps', 'weight', 'weight_unit', 'weight_unit_display', 'weight_display',
                 'duration', 'distance', 'rest_time', 'order']
        read_only_fields = ['weight_display', 'weight_unit_display']

    def validate(self, data):
        """Custom validation based on the exercise's effort_type"""
        if hasattr(self, 'context') and 'exercise_effort_type' in self.context:
            effort_type = self.context['exercise_effort_type']
            
            if effort_type == 'reps':
                if not data.get('reps'):
                    raise serializers.ValidationError("Reps are required for repetition-based exercises")
            elif effort_type == 'time':
                if not data.get('duration'):
                    raise serializers.ValidationError("Duration is required for time-based exercises")
            elif effort_type == 'distance':
                if not data.get('distance'):
                    raise serializers.ValidationError("Distance is required for distance-based exercises")
        
        return data

class ExerciseInstanceSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    sets = SetInstanceSerializer(many=True)
    superset_paired_exercise = serializers.SerializerMethodField()
    effort_type_display = serializers.CharField(source='get_effort_type_display', read_only=True)
    
    class Meta:
        model = ExerciseInstance
        fields = [
            'id', 'name', 'equipment', 'notes', 'order', 'effort_type', 'effort_type_display',
            'sets', 'based_on_template', 'superset_with', 'superset_paired_exercise', 'is_superset'
        ]
        read_only_fields = ['effort_type_display']
    
    def get_superset_paired_exercise(self, obj):
        if obj.superset_with is not None:
            try:
                paired_exercise = obj.workout.exercises.get(order=obj.superset_with)
                return {
                    'id': paired_exercise.id,
                    'name': paired_exercise.name,
                    'order': paired_exercise.order
                }
            except ExerciseInstance.DoesNotExist:
                return None
        return None

    def validate(self, data):
        """Validate sets based on effort_type"""
        sets_data = data.get('sets', [])
        effort_type = data.get('effort_type', 'reps')
        
        for set_data in sets_data:
            if effort_type == 'reps' and not set_data.get('reps'):
                raise serializers.ValidationError("All sets must have reps for repetition-based exercises")
            elif effort_type == 'time' and not set_data.get('duration'):
                raise serializers.ValidationError("All sets must have duration for time-based exercises")
            elif effort_type == 'distance' and not set_data.get('distance'):
                raise serializers.ValidationError("All sets must have distance for distance-based exercises")
        
        return data

class WorkoutInstanceSerializer(serializers.ModelSerializer):
    exercises = ExerciseInstanceSerializer(many=True)
    weekday_name = serializers.CharField(source='get_preferred_weekday_display', read_only=True)
    
    class Meta:
        model = WorkoutInstance
        fields = [
            'id', 'name', 'description', 'split_method',
            'preferred_weekday', 'weekday_name', 'order',
            'exercises', 'based_on_template', 'program',
            'difficulty_level', 'estimated_duration',
            'equipment_required', 'tags'
        ]
        read_only_fields = ['id', 'weekday_name']

    def create(self, validated_data):
        exercises_data = validated_data.pop('exercises', [])
        workout = WorkoutInstance.objects.create(**validated_data)
        
        for exercise_data in exercises_data:
            sets_data = exercise_data.pop('sets', [])
            exercise = ExerciseInstance.objects.create(workout=workout, **exercise_data)
            
            for set_data in sets_data:
                SetInstance.objects.create(exercise=exercise, **set_data)
        
        return workout

    def update(self, instance, validated_data):
        validated_data['order'] = instance.order
        validated_data['program'] = instance.program
        
        exercises_data = validated_data.pop('exercises', [])
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        instance.exercises.all().delete()
        
        for exercise_data in exercises_data:
            sets_data = exercise_data.pop('sets', [])
            exercise = ExerciseInstance.objects.create(
                workout=instance,
                **exercise_data
            )
            
            for set_data in sets_data:
                SetInstance.objects.create(
                    exercise=exercise,
                    **set_data
                )
        
        return instance

class ProgramShareSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source='program.name', read_only=True)
    shared_with_username = serializers.CharField(source='shared_with.username', read_only=True)
    
    class Meta:
        model = ProgramShare
        fields = ['id', 'program', 'program_name', 'shared_with', 
                 'shared_with_username', 'created_at']
        read_only_fields = ['id', 'created_at']

class ProgramSerializer(serializers.ModelSerializer):
    workouts = WorkoutInstanceSerializer(source='workout_instances', many=True, read_only=True)
    likes_count = serializers.IntegerField(read_only=True)
    forks_count = serializers.IntegerField(read_only=True)
    is_liked = serializers.SerializerMethodField()
    creator_username = serializers.CharField(source='creator.username', read_only=True)
    is_owner = serializers.SerializerMethodField(read_only=True)
    is_shared_with_me = serializers.SerializerMethodField(read_only=True)
    shares = ProgramShareSerializer(source='shares.all', many=True, read_only=True)
    
    class Meta:
        model = Program
        fields = [
           'id', 'name', 'description', 'focus',
           'sessions_per_week', 'workouts', 'creator_username',
           'is_active', 'is_public', 'likes_count', 
           'difficulty_level', 'recommended_level',
           'required_equipment', 'estimated_completion_weeks',
           'tags', 'forks_count', 'is_liked',
           'forked_from', 'created_at', 'updated_at','is_owner','shares','is_shared_with_me',
       ]
        read_only_fields = [
            'id', 'creator_username', 'likes_count',
            'forks_count', 'is_liked','created_at', 'updated_at','is_owner','shares', 'is_shared_with_me',
        ]

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(id=request.user.id).exists()
        return False

    def get_is_shared_with_me(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.shares.filter(shared_with=request.user).exists()
        return False

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.creator_id == request.user.id
        return False

# Log Serializers - UNIFIED APPROACH
class SetLogSerializer(serializers.ModelSerializer):
    based_on_instance_id = serializers.IntegerField(source='based_on_instance.id', read_only=True)
    id = serializers.IntegerField(required=False)
    weight_display = serializers.CharField(source='get_weight_display', read_only=True)
    weight_unit_display = serializers.CharField(source='get_weight_unit_display', read_only=True)
    
    class Meta:
        model = SetLog
        fields = [
            'id', 'reps', 'weight', 'weight_unit', 'weight_unit_display', 'weight_display',
            'duration', 'distance', 'rest_time', 'order', 'based_on_instance_id'
        ]
        read_only_fields = ['based_on_instance_id', 'weight_display', 'weight_unit_display']

    def validate(self, data):
        """Custom validation based on the exercise's effort_type"""
        if hasattr(self, 'context') and 'exercise_effort_type' in self.context:
            effort_type = self.context['exercise_effort_type']
            
            if effort_type == 'reps':
                if not data.get('reps'):
                    raise serializers.ValidationError("Reps are required for repetition-based exercises")
            elif effort_type == 'time':
                if not data.get('duration'):
                    raise serializers.ValidationError("Duration is required for time-based exercises")
            elif effort_type == 'distance':
                if not data.get('distance'):
                    raise serializers.ValidationError("Distance is required for distance-based exercises")
        
        return data

class ExerciseLogSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)  
    sets = SetLogSerializer(many=True)
    based_on_instance_id = serializers.IntegerField(source='based_on_instance.id', read_only=True)
    superset_paired_exercise = serializers.SerializerMethodField()
    effort_type_display = serializers.CharField(source='get_effort_type_display', read_only=True)
    
    class Meta:
        model = ExerciseLog
        fields = [
            'id', 'name', 'equipment', 'notes', 'order', 'effort_type', 'effort_type_display',
            'sets', 'based_on_instance_id', 'superset_with', 'superset_paired_exercise', 'is_superset'
        ]
        read_only_fields = ['based_on_instance_id', 'effort_type_display']
    
    def get_superset_paired_exercise(self, obj):
        if obj.superset_with is not None:
            try:
                paired_exercise = obj.workout.exercises.get(order=obj.superset_with)
                return {
                    'id': paired_exercise.id,
                    'name': paired_exercise.name,
                    'order': paired_exercise.order
                }
            except ExerciseLog.DoesNotExist:
                return None
        return None

    def validate(self, data):
        """Validate sets based on effort_type"""
        sets_data = data.get('sets', [])
        effort_type = data.get('effort_type', 'reps')
        
        for set_data in sets_data:
            if effort_type == 'reps' and not set_data.get('reps'):
                raise serializers.ValidationError("All sets must have reps for repetition-based exercises")
            elif effort_type == 'time' and not set_data.get('duration'):
                raise serializers.ValidationError("All sets must have duration for time-based exercises")
            elif effort_type == 'distance' and not set_data.get('distance'):
                raise serializers.ValidationError("All sets must have distance for distance-based exercises")
        
        return data

class WorkoutLogSerializer(serializers.ModelSerializer):
    """Unified serializer for WorkoutLog - handles create, read, and update"""
    exercises = ExerciseLogSerializer(many=True)
    
    # Read-only computed fields
    based_on_instance_id = serializers.IntegerField(source='based_on_instance.id', read_only=True)
    program_name = serializers.CharField(source='program.name', read_only=True)
    gym_name = serializers.CharField(source='gym.name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    workout_partners_usernames = serializers.SerializerMethodField()
    workout_partners_details = serializers.SerializerMethodField()
    
    # Workout partners - handle both read and write
    workout_partners = serializers.SerializerMethodField()
    
    class Meta:
        model = WorkoutLog
        fields = [
           'id', 'name', 'user', 'username', 'program', 'program_name',
           'based_on_instance', 'based_on_instance_id', 'date', 'gym', 'gym_name',
           'notes', 'completed', 'mood_rating', 'perceived_difficulty', 
           'performance_notes', 'media', 'exercises', 'created_at',
           'workout_partners', 'workout_partners_usernames', 'workout_partners_details'
       ]
        read_only_fields = [
            'id', 'user', 'username', 'program_name',
            'gym_name', 'created_at', 'based_on_instance_id',
            'workout_partners', 'workout_partners_usernames', 'workout_partners_details'
        ]

    def get_workout_partners(self, obj):
        """Get list of workout partner IDs for read operations"""
        return [partner.id for partner in obj.workout_partners.all()]

    def get_workout_partners_usernames(self, obj):
        """Get list of usernames of workout partners"""
        return [partner.username for partner in obj.workout_partners.all()]
    
    def get_workout_partners_details(self, obj):
        """Get detailed info about workout partners"""
        return [
            {
                'id': partner.id,
                'username': partner.username,
                'first_name': partner.first_name,
                'last_name': partner.last_name,
            }
            for partner in obj.workout_partners.all()
        ]

    def validate(self, data):
        """Custom validation to handle workout_partners input"""
        # Get workout_partners from initial_data (since it's read-only in fields)
        request = self.context.get('request')
        if request and hasattr(request, 'data'):
            workout_partners = request.data.get('workout_partners', [])
            if workout_partners:
                # Validate that all provided user IDs exist
                from django.contrib.auth import get_user_model
                User = get_user_model()
                
                existing_users = User.objects.filter(id__in=workout_partners)
                existing_user_ids = list(existing_users.values_list('id', flat=True))
                
                invalid_ids = set(workout_partners) - set(existing_user_ids)
                if invalid_ids:
                    raise serializers.ValidationError({
                        'workout_partners': f"Invalid user IDs: {list(invalid_ids)}"
                    })
                
                # Store in validated_data for use in create/update
                data['_workout_partners'] = workout_partners
        
        return data

    def create(self, validated_data):
        exercises_data = validated_data.pop('exercises', [])
        workout_partners_data = validated_data.pop('_workout_partners', [])
        
        # Create the workout log
        workout_log = WorkoutLog.objects.create(**validated_data)
        
        # Add workout partners
        if workout_partners_data:
            workout_log.workout_partners.set(workout_partners_data)
        
        # Create exercises
        for exercise_data in exercises_data:
            sets_data = exercise_data.pop('sets', [])
            
            # Remove id field to ensure new records are created
            exercise_data.pop('id', None)
            
            exercise = ExerciseLog.objects.create(
                workout=workout_log,
                **exercise_data
            )
            
            # Create sets for this exercise
            for set_data in sets_data:
                set_data.pop('id', None)  # Remove id field
                SetLog.objects.create(
                    exercise=exercise,
                    reps=set_data.get('reps'),
                    weight=set_data.get('weight'),
                    weight_unit=set_data.get('weight_unit', 'kg'),
                    duration=set_data.get('duration'),
                    distance=set_data.get('distance'),
                    rest_time=set_data.get('rest_time', 60),
                    order=set_data.get('order', 0)
                )
        
        return workout_log

    def update(self, instance, validated_data):
        exercises_data = validated_data.pop('exercises', [])
        workout_partners_data = validated_data.pop('_workout_partners', None)
        
        # Update basic workout log fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update workout partners if provided
        if workout_partners_data is not None:
            instance.workout_partners.set(workout_partners_data)

        # Keep track of existing exercises
        current_exercises = {exercise.id: exercise for exercise in instance.exercises.all()}
        exercises_to_keep = []

        # Update or create exercises
        for exercise_data in exercises_data:
            exercise_id = exercise_data.get('id')
            sets_data = exercise_data.pop('sets', [])

            if exercise_id and exercise_id in current_exercises:
                # Update existing exercise
                exercise = current_exercises[exercise_id]
                for attr, value in exercise_data.items():
                    if attr != 'id':
                        setattr(exercise, attr, value)
                exercise.save()
            else:
                # Create new exercise
                exercise_data.pop('id', None)  # Remove id for new exercises
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
                    set_data.pop('id', None)  # Remove id for new sets
                    new_set = SetLog.objects.create(
                        exercise=exercise,
                        reps=set_data.get('reps'),
                        weight=set_data.get('weight'),
                        weight_unit=set_data.get('weight_unit', 'kg'),
                        duration=set_data.get('duration'),
                        distance=set_data.get('distance'),
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
            'exercises__sets', 'workout_partners'
        ).get(id=instance.id)