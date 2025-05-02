# workouts/group_workouts.py
from django.db import models
from django.utils import timezone

class GroupWorkout(models.Model):
    """
    A group workout event that users can join and participate in.
    It becomes workout logs for all participants after completion.
    """
    PRIVACY_CHOICES = [
        ('public', 'Public - Anyone can join'),
        ('upon-request', 'Upon Request - Requires approval to join'),
        ('private', 'Private - Only invited users can join')
    ]
    
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled')
    ]
    
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    creator = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='created_group_workouts')
    workout_template = models.ForeignKey('workouts.WorkoutInstance', on_delete=models.SET_NULL, 
                                       null=True, blank=True, related_name='group_workouts')
    gym = models.ForeignKey('gyms.Gym', on_delete=models.SET_NULL, null=True, blank=True, related_name='group_workouts')
    scheduled_time = models.DateTimeField()
    privacy = models.CharField(max_length=20, choices=PRIVACY_CHOICES, default='public')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    max_participants = models.PositiveIntegerField(default=0, help_text="0 means unlimited")
    
    class Meta:
        ordering = ['-scheduled_time']
    
    @property
    def is_active(self):
        return self.scheduled_time > timezone.now() and self.status == 'scheduled'
    
    def __str__(self):
        return f"{self.title} at {self.gym} on {self.scheduled_time.strftime('%Y-%m-%d %H:%M')}"

class GroupWorkoutParticipant(models.Model):
    """
    Tracks user participation in group workouts
    """
    STATUS_CHOICES = [
        ('invited', 'Invited'),
        ('joined', 'Joined'),
        ('declined', 'Declined'),
        ('removed', 'Removed')
    ]
    
    group_workout = models.ForeignKey(GroupWorkout, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='group_workout_participations')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='invited')
    joined_at = models.DateTimeField(null=True, blank=True)
    workout_log = models.ForeignKey('workouts.WorkoutLog', on_delete=models.SET_NULL, 
                                   null=True, blank=True, related_name='from_group_workout')
    
    class Meta:
        unique_together = ['group_workout', 'user']
    
    def __str__(self):
        return f"{self.user.username} - {self.group_workout.title} ({self.get_status_display()})"

class GroupWorkoutJoinRequest(models.Model):
    """
    Track and manage join requests for 'upon-request' privacy group workouts
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected')
    ]
    
    group_workout = models.ForeignKey(GroupWorkout, on_delete=models.CASCADE, related_name='join_requests')
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='group_workout_requests')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    message = models.TextField(blank=True, help_text="Optional message with the request")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['group_workout', 'user']
    
    def __str__(self):
        return f"{self.user.username} - {self.group_workout.title} ({self.get_status_display()})"

class GroupWorkoutMessage(models.Model):
    """
    Chat messages for a group workout
    """
    group_workout = models.ForeignKey(GroupWorkout, on_delete=models.CASCADE, related_name='messages')
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='group_workout_messages')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.user.username}: {self.content[:50]}..."