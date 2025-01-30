# workouts/serializers.py
from rest_framework import serializers
from .models import Workout, Exercise, Set, WorkoutLog, LoggedSet

class SetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Set
        fields = ['id', 'reps', 'weight', 'rest_time', 'order']
        read_only_fields = ['id']

class ExerciseSerializer(serializers.ModelSerializer):
    sets = SetSerializer(many=True, read_only=True)
    
    class Meta:
        model = Exercise
        fields = ['id', 'name', 'equipment', 'notes', 'order', 'sets']
        read_only_fields = ['id']

class WorkoutSerializer(serializers.ModelSerializer):
    exercises = ExerciseSerializer(many=True, read_only=True)
    
    class Meta:
        model = Workout
        fields = [
            'id', 'name', 'description', 'frequency', 
            'split_method', 'is_template', 'exercises', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class LoggedSetSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoggedSet
        fields = ['id', 'exercise_name', 'reps', 'weight', 'order']
        read_only_fields = ['id']

class WorkoutLogSerializer(serializers.ModelSerializer):
    logged_sets = LoggedSetSerializer(many=True, read_only=True)
    workout_name = serializers.CharField(source='workout.name', read_only=True)
    gym_name = serializers.CharField(source='gym.name', read_only=True)
    
    class Meta:
        model = WorkoutLog
        fields = [
            'id', 'workout', 'workout_name', 'date',
            'gym', 'gym_name', 'notes', 'completed',
            'logged_sets'
        ]
        read_only_fields = ['id']