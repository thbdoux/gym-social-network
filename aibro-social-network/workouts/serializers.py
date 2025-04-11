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
    superset_paired_exercise = serializers.SerializerMethodField()
    
    class Meta:
        model = ExerciseTemplate
        fields = ['id', 'name', 'equipment', 'notes', 'order', 'sets', 'superset_with', 'superset_paired_exercise',  'is_superset']
        read_only_fields = ['id']
    
    def get_superset_paired_exercise(self, obj):
        if obj.superset_with is not None:
            try:
                paired_exercise = obj.workout.exercises.get(order=obj.superset_with)
                return {
                    'id': paired_exercise.id,
                    'name': paired_exercise.name,
                    'order': paired_exercise.order
                }
            except ExerciseTemplate.DoesNotExist:
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
    id = serializers.IntegerField(required=False)  # Allow passing ID for updates
    
    class Meta:
        model = SetInstance
        fields = ['id', 'reps', 'weight', 'rest_time', 'order']
        read_only_fields = []  # Allow updating all fields

class ExerciseInstanceSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)  # Allow passing ID for updates
    sets = SetInstanceSerializer(many=True)
    superset_paired_exercise = serializers.SerializerMethodField()
    
    class Meta:
        model = ExerciseInstance
        fields = [
            'id', 'name', 'equipment', 'notes', 'order',
            'sets', 'based_on_template', 'superset_with', 'superset_paired_exercise',  'is_superset'
        ]
        read_only_fields = []  # Allow updating all fields
    
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
        # Ensure order and program are preserved from instance
        validated_data['order'] = instance.order  # Keep existing order
        validated_data['program'] = instance.program  # Keep existing program
        
        exercises_data = validated_data.pop('exercises', [])
        
        # Update basic instance fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Handle exercises
        instance.exercises.all().delete()  # Remove existing exercises
        
        for exercise_data in exercises_data:
            sets_data = exercise_data.pop('sets', [])
            exercise = ExerciseInstance.objects.create(
                workout=instance,
                **exercise_data
            )
            
            # Create new sets for this exercise
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
# Program Serializers
class ProgramSerializer(serializers.ModelSerializer):
    workouts = WorkoutInstanceSerializer(source='workout_instances', many=True, read_only=True)
    likes_count = serializers.IntegerField(read_only=True)
    forks_count = serializers.IntegerField(read_only=True)
    is_liked = serializers.SerializerMethodField()
    creator_username = serializers.CharField(source='creator.username', read_only=True)
    is_owner = serializers.SerializerMethodField(read_only=True)  # Add this field
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
        """
        Determine if this program has been shared with the current user.
        """
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.shares.filter(shared_with=request.user).exists()
        return False

    def get_is_owner(self, obj):
        """
        Determine if the current user is the owner of this program.
        A user owns a program if they created it.
        """
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.creator_id == request.user.id
        return False


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
    superset_paired_exercise = serializers.SerializerMethodField()
    
    class Meta:
        model = ExerciseLog
        fields = [
            'id', 'name', 'equipment', 'notes', 'order',
            'sets', 'based_on_instance_id', 'superset_with', 'superset_paired_exercise', 'is_superset'
        ]
        read_only_fields = ['based_on_instance_id']
    
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
    
    def validate(self, data):
        """Add validation debugging"""
        import logging
        logger = logging.getLogger(__name__)
        
        # Log the incoming data for debugging
        logger.info(f"Validating data: {data}")
        
        # Check specific fields that might be causing issues
        if 'based_on_instance' in data:
            logger.info(f"based_on_instance: {data['based_on_instance']} (type: {type(data['based_on_instance'])})")
            
            # Try to validate the based_on_instance explicitly
            try:
                from .models import WorkoutInstance
                instance_id = data['based_on_instance']
                if instance_id is not None:
                    try:
                        instance = WorkoutInstance.objects.get(pk=instance_id)
                        logger.info(f"Found valid workout instance: {instance}")
                    except WorkoutInstance.DoesNotExist:
                        logger.error(f"WorkoutInstance with id {instance_id} does not exist")
                        raise serializers.ValidationError({"based_on_instance": f"WorkoutInstance with id {instance_id} does not exist"})
            except Exception as e:
                logger.error(f"Error validating based_on_instance: {str(e)}")
        
        if 'program' in data:
            logger.info(f"program: {data['program']} (type: {type(data['program'])})")
            
        return data

    # Update this method in your WorkoutLogCreateSerializer class
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
                
                # Remove id fields to ensure new records are created
                if 'id' in exercise_data:
                    exercise_data.pop('id')
                
                # Create exercise
                exercise = ExerciseLog.objects.create(
                    workout=workout_log,
                    **exercise_data
                )
                print("Debug - Created exercise:", exercise)
                
                # Create sets for this exercise
                for set_data in sets_data:
                    print("Debug - Processing set:", set_data)
                    
                    # Remove id field from sets data
                    if 'id' in set_data:
                        set_data.pop('id')
                    
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