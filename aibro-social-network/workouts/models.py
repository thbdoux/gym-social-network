# workouts/models.py
from django.db import models

class Workout(models.Model):
    SPLIT_CHOICES = [
        ('full_body', 'Full Body'),
        ('push_pull_legs', 'Push/Pull/Legs'),
        ('upper_lower', 'Upper/Lower'),
        ('custom', 'Custom Split'),
    ]
    
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='workouts')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    frequency = models.CharField(max_length=50)  # e.g., "3 times per week"
    split_method = models.CharField(max_length=20, choices=SPLIT_CHOICES)
    is_template = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} by {self.user.username}"

class Exercise(models.Model):
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, related_name='exercises')
    name = models.CharField(max_length=100)
    equipment = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    order = models.PositiveIntegerField()

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.name} in {self.workout.name}"

class Set(models.Model):
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, related_name='sets')
    reps = models.PositiveIntegerField()
    weight = models.DecimalField(max_digits=6, decimal_places=2)
    rest_time = models.PositiveIntegerField(help_text="Rest time in seconds")
    order = models.PositiveIntegerField()
    
    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.exercise.name} - Set {self.order}"

class WorkoutLog(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='workout_logs')
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE)
    date = models.DateField()
    gym = models.ForeignKey('gyms.Gym', on_delete=models.SET_NULL, null=True)
    notes = models.TextField(blank=True)
    completed = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.workout.name} - {self.date}"

class LoggedSet(models.Model):
    workout_log = models.ForeignKey(WorkoutLog, on_delete=models.CASCADE, related_name='logged_sets')
    exercise_name = models.CharField(max_length=100)
    reps = models.PositiveIntegerField()
    weight = models.DecimalField(max_digits=6, decimal_places=2)
    order = models.PositiveIntegerField()
    
    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.exercise_name} - Set {self.order}"