# # workouts/models.py
from django.db import models

# class Workout(models.Model):
#     SPLIT_CHOICES = [
#         ('full_body', 'Full Body'),
#         ('push_pull_legs', 'Push/Pull/Legs'),
#         ('upper_lower', 'Upper/Lower'),
#         ('custom', 'Custom Split'),
#     ]
    
#     user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='workouts')
#     name = models.CharField(max_length=100)
#     description = models.TextField(blank=True)
#     frequency = models.CharField(max_length=50)  # e.g., "3 times per week"
#     split_method = models.CharField(max_length=20, choices=SPLIT_CHOICES)
#     is_template = models.BooleanField(default=False)
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     def __str__(self):
#         return f"{self.name} by {self.user.username}"

# class Exercise(models.Model):
#     workout = models.ForeignKey(Workout, on_delete=models.CASCADE, related_name='exercises')
#     name = models.CharField(max_length=100)
#     equipment = models.CharField(max_length=100, blank=True)
#     notes = models.TextField(blank=True)
#     order = models.PositiveIntegerField()

#     class Meta:
#         ordering = ['order']

#     def __str__(self):
#         return f"{self.name} in {self.workout.name}"

# class Set(models.Model):
#     exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, related_name='sets')
#     reps = models.PositiveIntegerField()
#     weight = models.DecimalField(max_digits=6, decimal_places=2)
#     rest_time = models.PositiveIntegerField(help_text="Rest time in seconds")
#     order = models.PositiveIntegerField()
    
#     class Meta:
#         ordering = ['order']

#     def __str__(self):
#         return f"{self.exercise.name} - Set {self.order}"



# class WorkoutPlan(models.Model):
#     FOCUS_CHOICES = [
#         ('strength', 'Strength'),
#         ('hypertrophy', 'Hypertrophy'),
#         ('endurance', 'Endurance'),
#         ('weight_loss', 'Weight Loss'),
#         ('strength_hypertrophy', 'Strength & Hypertrophy'),
#         ('general_fitness', 'General Fitness'),
#     ]
    
#     user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='workout_plans')
#     name = models.CharField(max_length=100)
#     description = models.TextField(blank=True)
#     focus = models.CharField(max_length=20, choices=FOCUS_CHOICES)
#     sessions_per_week = models.PositiveIntegerField()
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
#     is_active = models.BooleanField(default=True)

#     def __str__(self):
#         return f"{self.name} by {self.user.username}"


# class WorkoutLog(models.Model):
#     user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='workout_logs')
#     workout = models.ForeignKey(Workout, on_delete=models.CASCADE)
#     plan = models.ForeignKey(WorkoutPlan, on_delete=models.SET_NULL, null=True, blank=True, 
#                            related_name='workout_logs',
#                            help_text="The workout plan being followed when this workout was logged")
#     date = models.DateField()
#     gym = models.ForeignKey('gyms.Gym', on_delete=models.SET_NULL, null=True)
#     notes = models.TextField(blank=True)
#     completed = models.BooleanField(default=True)

#     def __str__(self):
#         plan_info = f" ({self.plan.name})" if self.plan else ""
#         return f"{self.workout.name}{plan_info} - {self.date}"

# class LoggedSet(models.Model):
#     workout_log = models.ForeignKey(WorkoutLog, on_delete=models.CASCADE, related_name='logged_sets')
#     exercise_name = models.CharField(max_length=100)
#     reps = models.PositiveIntegerField()
#     weight = models.DecimalField(max_digits=6, decimal_places=2)
#     order = models.PositiveIntegerField()
    
#     class Meta:
#         ordering = ['order']

#     def __str__(self):
#         return f"{self.exercise_name} - Set {self.order}"
# class PlanWorkout(models.Model):
#     WEEKDAY_CHOICES = [
#         (0, 'Monday'),
#         (1, 'Tuesday'),
#         (2, 'Wednesday'),
#         (3, 'Thursday'),
#         (4, 'Friday'),
#         (5, 'Saturday'),
#         (6, 'Sunday'),
#     ]
    
#     plan = models.ForeignKey(WorkoutPlan, on_delete=models.CASCADE, related_name='plan_workouts')
#     workout = models.ForeignKey(Workout, on_delete=models.CASCADE)
#     preferred_weekday = models.IntegerField(choices=WEEKDAY_CHOICES)
#     order = models.PositiveIntegerField(help_text="Order within the week's rotation")
#     notes = models.TextField(blank=True)

#     class Meta:
#         ordering = ['order']
#         unique_together = [['plan', 'order']]

#     def __str__(self):
#         return f"{self.workout.name} on {self.get_preferred_weekday_display()}"



# workouts/models.py

class ExerciseTemplate(models.Model):
    """Template for an exercise within a workout template"""
    workout = models.ForeignKey('WorkoutTemplate', on_delete=models.CASCADE, related_name='exercises')
    name = models.CharField(max_length=100)
    equipment = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    order = models.PositiveIntegerField()

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.name} in {self.workout.name}"

class SetTemplate(models.Model):
    """Template for a set within an exercise template"""
    exercise = models.ForeignKey(ExerciseTemplate, on_delete=models.CASCADE, related_name='sets')
    reps = models.PositiveIntegerField()
    weight = models.DecimalField(max_digits=6, decimal_places=2)
    rest_time = models.PositiveIntegerField(help_text="Rest time in seconds")
    order = models.PositiveIntegerField()
    
    class Meta:
        ordering = ['order']

class WorkoutTemplate(models.Model):
    """Blueprint for a workout that can be used in programs"""
    SPLIT_CHOICES = [
        ('full_body', 'Full Body'),
        ('push_pull_legs', 'Push/Pull/Legs'),
        ('upper_lower', 'Upper/Lower'),
        ('custom', 'Custom Split'),
    ]
    
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='workout_templates')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    split_method = models.CharField(max_length=20, choices=SPLIT_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} by {self.user.username}"

class Program(models.Model):
    """A workout program containing multiple scheduled workout templates"""
    FOCUS_CHOICES = [
        ('strength', 'Strength'),
        ('hypertrophy', 'Hypertrophy'),
        ('endurance', 'Endurance'),
        ('weight_loss', 'Weight Loss'),
        ('strength_hypertrophy', 'Strength & Hypertrophy'),
        ('general_fitness', 'General Fitness'),
    ]
    
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='programs')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    focus = models.CharField(max_length=20, choices=FOCUS_CHOICES)
    sessions_per_week = models.PositiveIntegerField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} by {self.user.username}"

class ScheduledWorkout(models.Model):
    """Links a workout template to a program with scheduling information"""
    WEEKDAY_CHOICES = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]
    
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='scheduled_workouts')
    workout_template = models.ForeignKey(WorkoutTemplate, on_delete=models.CASCADE)
    preferred_weekday = models.IntegerField(choices=WEEKDAY_CHOICES)
    order = models.PositiveIntegerField(help_text="Order in the week's rotation")
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['order']
        unique_together = [['program', 'order']]

    def __str__(self):
        return f"{self.workout_template.name} on {self.get_preferred_weekday_display()}"

class WorkoutLog(models.Model):
    """Record of an actual performed workout"""
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='workout_logs')
    program = models.ForeignKey(Program, on_delete=models.SET_NULL, null=True, blank=True,
                              help_text="Program being followed when this workout was performed")
    workout_template = models.ForeignKey(WorkoutTemplate, on_delete=models.SET_NULL, null=True,
                                       help_text="Original template this workout was based on")
    date = models.DateField()
    gym = models.ForeignKey('gyms.Gym', on_delete=models.SET_NULL, null=True)
    notes = models.TextField(blank=True)
    completed = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.workout_template.name if self.workout_template else 'Custom workout'} - {self.date}"

class ExerciseLog(models.Model):
    """Record of an actual performed exercise"""
    workout_log = models.ForeignKey(WorkoutLog, on_delete=models.CASCADE, related_name='exercises')
    template = models.ForeignKey(ExerciseTemplate, on_delete=models.SET_NULL, null=True,
                               help_text="Original template this exercise was based on")
    name = models.CharField(max_length=100)
    equipment = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    order = models.PositiveIntegerField()

    class Meta:
        ordering = ['order']

class SetLog(models.Model):
    """Record of an actual performed set"""
    exercise = models.ForeignKey(ExerciseLog, on_delete=models.CASCADE, related_name='sets')
    template = models.ForeignKey(SetTemplate, on_delete=models.SET_NULL, null=True,
                               help_text="Original template this set was based on")
    reps = models.PositiveIntegerField()
    weight = models.DecimalField(max_digits=6, decimal_places=2)
    rest_time = models.PositiveIntegerField(help_text="Rest time in seconds")
    order = models.PositiveIntegerField()
    
    class Meta:
        ordering = ['order']

