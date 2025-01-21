from django.db import models
from apps.users.models import User

class WorkoutSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workout_sessions')
    date = models.DateTimeField()
    exercises = models.JSONField()
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-date']
