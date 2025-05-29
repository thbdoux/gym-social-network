# notifications/models.py
from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

class Notification(models.Model):
    """Base model for all notifications"""
    NOTIFICATION_TYPES = [
        ('like', 'Like'),
        ('comment', 'Comment'),
        ('share', 'Share'),
        ('friend_request', 'Friend Request'),
        ('friend_accept', 'Friend Request Accepted'),
        ('program_fork', 'Program Forked'),
        ('workout_milestone', 'Workout Milestone'),
        ('goal_achieved', 'Goal Achieved'),
        ('mention', 'Mention'),
        ('gym_announcement', 'Gym Announcement'),
        ('workout_invitation', 'Workout Invitation'),
        ('workout_join', 'Workout Join'),
        ('workout_join_request', 'Workout Join Request'),
        ('workout_request_approved', 'Workout Request Approved'),
        ('workout_request_rejected', 'Workout Request Rejected'),
        ('workout_cancelled', 'Workout Cancelled'),
        ('workout_removed', 'Removed from Workout'),
        ('workout_completed', 'Workout Completed'),

    ]
    
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='sent_notifications',
        null=True,
        blank=True
    )
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    content = models.TextField(blank=True)
    
    # Generic relation to related objects
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    related_object = GenericForeignKey('content_type', 'object_id')
    
    # Status fields
    is_read = models.BooleanField(default=False)
    is_seen = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read', 'created_at']),
            models.Index(fields=['content_type', 'object_id']),
        ]

class NotificationPreference(models.Model):
    """User preferences for notifications"""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notification_preferences'
    )
    # Email notification preferences
    email_likes = models.BooleanField(default=True)
    email_comments = models.BooleanField(default=True)
    email_shares = models.BooleanField(default=True)
    email_friend_requests = models.BooleanField(default=True)
    email_program_forks = models.BooleanField(default=True)
    email_workout_milestones = models.BooleanField(default=True)
    email_goal_achieved = models.BooleanField(default=True)
    email_mentions = models.BooleanField(default=True)
    email_gym_announcements = models.BooleanField(default=True)
    
    # Push notification preferences
    push_likes = models.BooleanField(default=True)
    push_comments = models.BooleanField(default=True)
    push_shares = models.BooleanField(default=True)
    push_friend_requests = models.BooleanField(default=True)
    push_program_forks = models.BooleanField(default=True)
    push_workout_milestones = models.BooleanField(default=True)
    push_goal_achieved = models.BooleanField(default=True)
    push_mentions = models.BooleanField(default=True)
    push_gym_announcements = models.BooleanField(default=True)