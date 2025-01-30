# # workouts/serializers.py
from rest_framework import serializers
# from .models import Workout, Exercise, Set, WorkoutLog, LoggedSet, PlanWorkout, WorkoutPlan

# class SetSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Set
#         fields = ['id', 'reps', 'weight', 'rest_time', 'order']
#         read_only_fields = ['id']

# class ExerciseSerializer(serializers.ModelSerializer):
#     sets = SetSerializer(many=True, read_only=True)
    
#     class Meta:
#         model = Exercise
#         fields = ['id', 'name', 'equipment', 'notes', 'order', 'sets']
#         read_only_fields = ['id']

# class WorkoutSerializer(serializers.ModelSerializer):
#     exercises = ExerciseSerializer(many=True, read_only=True)
    
#     class Meta:
#         model = Workout
#         fields = [
#             'id', 'name', 'description', 'frequency', 
#             'split_method', 'is_template', 'exercises', 
#             'created_at', 'updated_at'
#         ]
#         read_only_fields = ['id', 'created_at', 'updated_at']

# class LoggedSetSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = LoggedSet
#         fields = ['id', 'exercise_name', 'reps', 'weight', 'order']
#         read_only_fields = ['id']

# class WorkoutLogSerializer(serializers.ModelSerializer):
#     logged_sets = LoggedSetSerializer(many=True, read_only=True)
#     workout_name = serializers.CharField(source='workout.name', read_only=True)
#     gym_name = serializers.CharField(source='gym.name', read_only=True)
#     plan_name = serializers.CharField(source='plan.name', read_only=True)
    
#     class Meta:
#         model = WorkoutLog
#         fields = [
#             'id', 'workout', 'workout_name', 'date',
#             'gym', 'gym_name', 'plan', 'plan_name',
#             'notes', 'completed', 'logged_sets'
#         ]
#         read_only_fields = ['id']

# class PlanWorkoutSerializer(serializers.ModelSerializer):
#     workout_name = serializers.CharField(source='workout.name', read_only=True)
#     weekday_name = serializers.CharField(source='get_preferred_weekday_display', read_only=True)
    
#     class Meta:
#         model = PlanWorkout
#         fields = [
#             'id', 'workout', 'workout_name', 'preferred_weekday',
#             'weekday_name', 'order', 'notes'
#         ]
#         read_only_fields = ['id']

# class WorkoutPlanSerializer(serializers.ModelSerializer):
#     plan_workouts = PlanWorkoutSerializer(many=True, read_only=True)
    
#     class Meta:
#         model = WorkoutPlan
#         fields = [
#             'id', 'name', 'description', 'focus',
#             'sessions_per_week', 'plan_workouts',
#             'created_at', 'updated_at', 'is_active'
#         ]
#         read_only_fields = ['id', 'created_at', 'updated_at']

from .models import ExerciseLog, ExerciseTemplate, SetLog, SetTemplate, WorkoutLog, WorkoutTemplate, ScheduledWorkout, Program

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
    
    class Meta:
        model = WorkoutTemplate
        fields = [
            'id', 'name', 'description', 'split_method',
            'exercises', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class ScheduledWorkoutSerializer(serializers.ModelSerializer):
    workout_template_name = serializers.CharField(source='workout_template.name', read_only=True)
    weekday_name = serializers.CharField(source='get_preferred_weekday_display', read_only=True)
    
    class Meta:
        model = ScheduledWorkout
        fields = [
            'id', 'workout_template', 'workout_template_name',
            'preferred_weekday', 'weekday_name', 'order', 'notes'
        ]
        read_only_fields = ['id']

class ProgramSerializer(serializers.ModelSerializer):
    scheduled_workouts = ScheduledWorkoutSerializer(many=True, read_only=True)
    
    class Meta:
        model = Program
        fields = [
            'id', 'name', 'description', 'focus',
            'sessions_per_week', 'scheduled_workouts',
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