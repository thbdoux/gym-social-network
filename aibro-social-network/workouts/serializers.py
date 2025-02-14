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
    
    class Meta:
        model = SetLog
        fields = [
            'id', 'reps', 'weight', 'rest_time', 'order',
            'based_on_instance_id'
        ]
        read_only_fields = ['id', 'based_on_instance_id']

class ExerciseLogSerializer(serializers.ModelSerializer):
    sets = SetLogSerializer(many=True, read_only=True)
    based_on_instance_id = serializers.IntegerField(source='based_on_instance.id', read_only=True)
    
    class Meta:
        model = ExerciseLog
        fields = [
            'id', 'name', 'equipment', 'notes', 'order',
            'sets', 'based_on_instance_id'
        ]
        read_only_fields = ['id', 'based_on_instance_id']

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
    """Serializer for creating workout logs with nested exercises and sets"""
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
        exercises_data = validated_data.pop('exercises', [])
        workout_log = WorkoutLog.objects.create(**validated_data)
        
        for exercise_data in exercises_data:
            sets_data = exercise_data.pop('sets', [])
            exercise = ExerciseLog.objects.create(
                workout=workout_log,
                **exercise_data
            )
            
            for set_data in sets_data:
                SetLog.objects.create(
                    exercise=exercise,
                    **set_data
                )
        
        return workout_log