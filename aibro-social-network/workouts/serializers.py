# # workouts/serializers.py
from rest_framework import serializers
from .models import ExerciseLog, ExerciseTemplate, SetLog, SetTemplate, WorkoutLog, WorkoutTemplate, Program

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
    weekday_name = serializers.CharField(source='get_preferred_weekday_display', read_only=True)
    program_name = serializers.CharField(source='program.name', read_only=True)
    
    class Meta:
        model = WorkoutTemplate
        fields = [
            'id', 'name', 'description', 'split_method',
            'program', 'program_name', 'preferred_weekday', 'weekday_name',
            'order', 'exercises', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class ProgramSerializer(serializers.ModelSerializer):
    workouts = WorkoutTemplateSerializer(many=True, read_only=True)
    
    class Meta:
        model = Program
        fields = [
            'id', 'name', 'description', 'focus',
            'sessions_per_week', 'workouts',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class SetLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SetLog
        fields = ['id', 'template', 'reps', 'weight', 'rest_time', 'order']
        read_only_fields = ['id']

class ExerciseLogSerializer(serializers.ModelSerializer):
    sets = SetLogSerializer(many=True, read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)
    
    class Meta:
        model = ExerciseLog
        fields = [
            'id', 'template', 'template_name', 'name',
            'equipment', 'notes', 'order', 'sets'
        ]
        read_only_fields = ['id']

class WorkoutLogSerializer(serializers.ModelSerializer):
    exercises = ExerciseLogSerializer(many=True, read_only=True)
    program_name = serializers.CharField(source='program.name', read_only=True)
    template_name = serializers.CharField(source='workout_template.name', read_only=True)
    gym_name = serializers.CharField(source='gym.name', read_only=True)
    
    class Meta:
        model = WorkoutLog
        fields = [
            'id', 'program', 'program_name',
            'workout_template', 'template_name',
            'date', 'gym', 'gym_name', 'notes',
            'completed', 'exercises'
        ]
        read_only_fields = ['id']