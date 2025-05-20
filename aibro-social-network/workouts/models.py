# workouts/models.py
from django.db import models
# Add this at the end of workouts/models.py
from .group_workouts import (
    GroupWorkout, 
    GroupWorkoutParticipant, 
    GroupWorkoutJoinRequest, 
    GroupWorkoutMessage
)

class BaseExercise(models.Model):
    """Base abstract model for exercises"""
    name = models.CharField(max_length=100)
    equipment = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    order = models.PositiveIntegerField()
    superset_with = models.PositiveIntegerField(null=True, blank=True, 
                                               help_text="ID of paired exercise in superset")

    is_superset = models.BooleanField(default=False, help_text="Whether this exercise is part of a superset")

    class Meta:
        abstract = True
        ordering = ['order']

class BaseSet(models.Model):
    """Base abstract model for sets"""
    reps = models.PositiveIntegerField()
    weight = models.DecimalField(max_digits=6, decimal_places=2)
    rest_time = models.PositiveIntegerField(help_text="Rest time in seconds")
    order = models.PositiveIntegerField()

    class Meta:
        abstract = True
        ordering = ['order']

# Template Models
class WorkoutTemplate(models.Model):
    """Blueprint for a workout"""
    SPLIT_CHOICES = [
        ('full_body', 'Full Body'),
        ('push_pull_legs', 'Push/Pull/Legs'),
        ('upper_lower', 'Upper/Lower'),
        ('custom', 'Custom Split'),
    ]
    
    creator = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='workout_templates')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    split_method = models.CharField(max_length=20, choices=SPLIT_CHOICES)
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    difficulty_level = models.CharField(max_length=20, choices=[
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced')
    ])
    estimated_duration = models.PositiveIntegerField(help_text="Duration in minutes")
    equipment_required = models.JSONField(default=list)
    tags = models.JSONField(default=list)
    use_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['created_at']

class ExerciseTemplate(BaseExercise):
    """Exercise within a workout template"""
    workout = models.ForeignKey(WorkoutTemplate, on_delete=models.CASCADE, related_name='exercises')

class SetTemplate(BaseSet):
    """Set within a template exercise"""
    exercise = models.ForeignKey(ExerciseTemplate, on_delete=models.CASCADE, related_name='sets')

# Instance Models (Program-specific workouts)
class Program(models.Model):
    """A workout program"""
    FOCUS_CHOICES = [
        ('strength', 'Strength'),
        ('hypertrophy', 'Hypertrophy'),
        ('endurance', 'Endurance'),
        ('weight_loss', 'Weight Loss'),
        ('strength_hypertrophy', 'Strength & Hypertrophy'),
        ('general_fitness', 'General Fitness'),
    ]
    
    creator = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='created_programs')
    forked_from = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, 
                                   related_name='forks')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    focus = models.CharField(max_length=20, choices=FOCUS_CHOICES)
    sessions_per_week = models.PositiveIntegerField()
    is_active = models.BooleanField(default=True)
    is_public = models.BooleanField(default=False)
    likes = models.ManyToManyField('users.User', related_name='liked_programs', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    difficulty_level = models.CharField(max_length=20)
    recommended_level = models.CharField(max_length=20)
    required_equipment = models.JSONField(default=list)
    estimated_completion_weeks = models.PositiveIntegerField()
    tags = models.JSONField(default=list)

class WorkoutInstance(models.Model):
    """A workout within a program"""
    WEEKDAY_CHOICES = [
        (0, 'Monday'), (1, 'Tuesday'), (2, 'Wednesday'),
        (3, 'Thursday'), (4, 'Friday'), (5, 'Saturday'), (6, 'Sunday')
    ]
    SPLIT_CHOICES = [
        ('full_body', 'Full Body'),
        ('push_pull_legs', 'Push/Pull/Legs'),
        ('upper_lower', 'Upper/Lower'),
        ('custom', 'Custom Split'),
    ]
    
    
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='workout_instances')
    based_on_template = models.ForeignKey(WorkoutTemplate, on_delete=models.SET_NULL, null=True,
                                        help_text="Original template this workout was based on")
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    split_method = models.CharField(max_length=20, choices=SPLIT_CHOICES)
    order = models.IntegerField()
    preferred_weekday = models.IntegerField(choices=WEEKDAY_CHOICES, default=0)
    difficulty_level = models.CharField(max_length=20, choices=[
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced')
    ], default='beginner')
    estimated_duration = models.PositiveIntegerField(help_text="Duration in minutes", default=60)
    equipment_required = models.JSONField(default=list)
    tags = models.JSONField(default=list)
    class Meta:
        ordering = ['order']
        unique_together = ['program', 'order']

class ExerciseInstance(BaseExercise):
    """Exercise within a program workout"""
    workout = models.ForeignKey(WorkoutInstance, on_delete=models.CASCADE, related_name='exercises')
    based_on_template = models.ForeignKey(ExerciseTemplate, on_delete=models.SET_NULL, null=True,
                                        help_text="Original template this exercise was based on")

class SetInstance(BaseSet):
    """Set within a program exercise"""
    exercise = models.ForeignKey(ExerciseInstance, on_delete=models.CASCADE, related_name='sets')
    based_on_template = models.ForeignKey(SetTemplate, on_delete=models.SET_NULL, null=True,
                                        help_text="Original template this set was based on")

# Log Models (Actual workouts performed)
class WorkoutLog(models.Model):
    """Record of an actual performed workout"""
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='workout_logs')
    based_on_instance = models.ForeignKey(WorkoutInstance, on_delete=models.SET_NULL, null=True,
                                        help_text="Original instance this workout was based on")
    program = models.ForeignKey(Program, on_delete=models.SET_NULL, null=True, blank=True)
    name = models.CharField(max_length=100)
    date = models.DateTimeField()
    gym = models.ForeignKey('gyms.Gym', 
                           on_delete=models.SET_NULL, 
                           null=True,
                           related_name='workout_logs')
    notes = models.TextField(blank=True)
    completed = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    mood_rating = models.PositiveSmallIntegerField(null=True)
    perceived_difficulty = models.PositiveSmallIntegerField(null=True)
    performance_notes = models.TextField(blank=True)
    media = models.JSONField(default=list)

    class Meta:
        ordering = ['-date', '-created_at']

class ExerciseLog(BaseExercise):
    """Record of an actual performed exercise"""
    workout = models.ForeignKey(WorkoutLog, on_delete=models.CASCADE, related_name='exercises')
    based_on_instance = models.ForeignKey(ExerciseInstance, on_delete=models.SET_NULL, null=True,
                                        help_text="Original instance this exercise was based on")

class SetLog(BaseSet):
    """Record of an actual performed set"""
    exercise = models.ForeignKey(ExerciseLog, on_delete=models.CASCADE, related_name='sets')
    based_on_instance = models.ForeignKey(SetInstance, on_delete=models.SET_NULL, null=True,
                                        help_text="Original instance this set was based on")



class ProgramShare(models.Model):
    """Record of a program being shared with another user"""
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='shares')
    shared_with = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='shared_programs')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['program', 'shared_with']  # Prevent duplicate shares

    def __str__(self):
        return f"{self.program.name} shared with {self.shared_with.username}"