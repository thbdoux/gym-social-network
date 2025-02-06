# workouts/serializers.py
from rest_framework import serializers
from .models import (
    WorkoutTemplate, ExerciseTemplate, SetTemplate,
    Program, WorkoutInstance, ProgramShare,
    WorkoutLog, ExerciseLog, SetLog
)

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

class WorkoutTemplateDetailSerializer(WorkoutTemplateSerializer):
    """Detailed version of WorkoutTemplate serializer with more info"""
    class Meta(WorkoutTemplateSerializer.Meta):
        fields = WorkoutTemplateSerializer.Meta.fields + [
            'creator'
        ]
        read_only_fields = WorkoutTemplateSerializer.Meta.read_only_fields + ['creator']

class WorkoutInstanceSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='template.id')
    name = serializers.CharField(source='template.name')
    split_method = serializers.CharField(source='template.split_method')
    description = serializers.CharField(source='template.description')
    exercises = ExerciseTemplateSerializer(source='template.exercises', many=True)
    instance_id = serializers.IntegerField(source='id')
    weekday_name = serializers.CharField(source='get_preferred_weekday_display')
    creator_username = serializers.CharField(source='template.creator.username')
    
    class Meta:
        model = WorkoutInstance
        fields = [
            'instance_id', 'id', 'name', 'description',
            'split_method', 'preferred_weekday', 'weekday_name',
            'order', 'exercises', 'creator_username'
        ]

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
           'tags','forked_from_name', 'forks_count', 'is_liked', 'forked_from',
           'created_at', 'updated_at'
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

class SetLogSerializer(serializers.ModelSerializer):
    template_id = serializers.IntegerField(source='template.id', read_only=True)
    
    class Meta:
        model = SetLog
        fields = ['id', 'template', 'template_id', 'reps', 
                 'weight', 'rest_time', 'order']
        read_only_fields = ['id', 'template_id']

class ExerciseLogSerializer(serializers.ModelSerializer):
    sets = SetLogSerializer(many=True, read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)
    
    class Meta:
        model = ExerciseLog
        fields = [
            'id', 'template', 'template_name', 'name',
            'equipment', 'notes', 'order', 'sets'
        ]
        read_only_fields = ['id', 'template_name']

class WorkoutLogSerializer(serializers.ModelSerializer):
    exercises = ExerciseLogSerializer(many=True, read_only=True)
    program_name = serializers.CharField(source='program.name', read_only=True)
    workout_name = serializers.CharField(source='workout_instance.template.name', read_only=True)
    gym_name = serializers.CharField(source='gym.name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = WorkoutLog
        fields = [
           'id', 'user', 'username', 'program', 'program_name',
           'workout_instance', 'workout_name', 'date',
           'gym', 'gym_name', 'notes', 'completed',
           'mood_rating', 'perceived_difficulty', 
           'performance_notes', 'media',
           'exercises', 'created_at'
       ]
        read_only_fields = [
            'id', 'user', 'username', 'program_name',
            'workout_name', 'gym_name', 'created_at'
        ]

class WorkoutLogCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating workout logs with nested exercises and sets"""
    exercises = ExerciseLogSerializer(many=True)
    
    class Meta:
        model = WorkoutLog
        fields = [
            'workout_instance', 'program', 'date',
            'gym', 'notes', 'completed', 'exercises'
        ]

    def create(self, validated_data):
        exercises_data = validated_data.pop('exercises')
        workout_log = WorkoutLog.objects.create(**validated_data)
        
        for exercise_data in exercises_data:
            sets_data = exercise_data.pop('sets', [])
            exercise = ExerciseLog.objects.create(workout_log=workout_log, **exercise_data)
            
            for set_data in sets_data:
                SetLog.objects.create(exercise=exercise, **set_data)
        
        return workout_log