# workouts/models.py
from django.db import models

class WorkoutTemplate(models.Model):
    """Blueprint for a workout that can be used in programs"""
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

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.name} by {self.creator.username}"

class ExerciseTemplate(models.Model):
    """Template for an exercise within a workout template"""
    workout = models.ForeignKey(WorkoutTemplate, on_delete=models.CASCADE, related_name='exercises')
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

    def __str__(self):
        return f"Set {self.order} of {self.exercise.name}"

class Program(models.Model):
    """A workout program that can be shared and forked"""
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

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} by {self.creator.username}"

    # @property
    # def likes_count(self):
    #     return self.likes.count()

    # @property
    # def forks_count(self):
    #     return self.forks.count()

class WorkoutInstance(models.Model):
    """Instance of a workout template within a program"""
    WEEKDAY_CHOICES = [
        (0, 'Monday'), (1, 'Tuesday'), (2, 'Wednesday'),
        (3, 'Thursday'), (4, 'Friday'), (5, 'Saturday'), (6, 'Sunday')
    ]
    
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='workout_instances')
    template = models.ForeignKey(WorkoutTemplate, on_delete=models.CASCADE)
    order = models.IntegerField()
    preferred_weekday = models.IntegerField(choices=WEEKDAY_CHOICES, default=0)
    
    class Meta:
        ordering = ['order']
        unique_together = ['program', 'order']  # Prevent duplicate ordering in a program

    def __str__(self):
        return f"{self.template.name} in {self.program.name}"

class ProgramShare(models.Model):
    """Record of a program being shared with another user"""
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='shares')
    shared_with = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='shared_programs')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['program', 'shared_with']  # Prevent duplicate shares

    def __str__(self):
        return f"{self.program.name} shared with {self.shared_with.username}"

class WorkoutLog(models.Model):
    """Record of an actual performed workout"""
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='workout_logs')
    workout_instance = models.ForeignKey(WorkoutInstance, on_delete=models.SET_NULL, null=True,
                                       related_name='logs',
                                       help_text="Original instance this workout was based on")
    program = models.ForeignKey(Program, on_delete=models.SET_NULL, null=True, blank=True,
                              related_name='workout_logs')
    date = models.DateField()
    gym = models.ForeignKey('gyms.Gym', on_delete=models.SET_NULL, null=True)
    notes = models.TextField(blank=True)
    completed = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.user.username}'s workout on {self.date}"

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

    def __str__(self):
        return f"{self.name} in {self.workout_log}"

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

    def __str__(self):
        return f"Set {self.order} of {self.exercise.name}"