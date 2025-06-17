# notifications/models.py
from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

class Notification(models.Model):
    """Base model for all notifications"""
    NOTIFICATION_TYPES = [
        # Post interactions
        ('like', 'Like'),
        ('comment', 'Comment'),
        ('share', 'Share'),
        ('mention', 'Mention'),
        
        # Social interactions
        ('friend_request', 'Friend Request'),
        ('friend_accept', 'Friend Request Accepted'),
        
        # Program interactions
        ('program_fork', 'Program Forked'),
        ('program_shared', 'Program Shared'),
        ('program_liked', 'Program Liked'),
        ('program_used', 'Program Used'),
        
        # Template interactions
        ('template_used', 'Template Used'),
        ('template_forked', 'Template Forked'),
        
        # Workout milestones and achievements
        ('workout_milestone', 'Workout Milestone'),
        ('goal_achieved', 'Goal Achieved'),
        ('streak_milestone', 'Streak Milestone'),
        ('personal_record', 'Personal Record'),
        
        # Group workout interactions
        ('workout_invitation', 'Workout Invitation'),
        ('workout_join', 'Workout Join'),
        ('workout_join_request', 'Workout Join Request'),
        ('workout_request_approved', 'Workout Request Approved'),
        ('workout_request_rejected', 'Workout Request Rejected'),
        ('workout_cancelled', 'Workout Cancelled'),
        ('workout_removed', 'Removed from Workout'),
        ('workout_completed', 'Workout Completed'),
        ('workout_reminder', 'Workout Reminder'),
        
        # Group workout proposals and voting
        ('workout_proposal_submitted', 'Workout Proposal Submitted'),
        ('workout_proposal_voted', 'Workout Proposal Voted'),
        ('workout_proposal_selected', 'Workout Proposal Selected'),
        
        # Workout partnerships
        ('workout_partner_added', 'Workout Partner Added'),
        ('workout_partner_request', 'Workout Partner Request'),
        
        # Gym and system notifications
        ('gym_announcement', 'Gym Announcement'),
        ('system_update', 'System Update'),
        ('challenge_invitation', 'Challenge Invitation'),
        ('challenge_completed', 'Challenge Completed'),
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
    
    # Translation key and parameters for dynamic content
    title_key = models.CharField(max_length=100, help_text="Translation key for title")
    body_key = models.CharField(max_length=100, help_text="Translation key for body")
    
    # JSON field to store parameters for translation interpolation
    translation_params = models.JSONField(
        default=dict,
        help_text="Parameters for translation string interpolation (e.g., {username}, {count})"
    )
    
    # Fallback content for backwards compatibility
    content = models.TextField(blank=True, help_text="Fallback content if translation fails")
    
    # Generic relation to related objects
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    related_object = GenericForeignKey('content_type', 'object_id')
    
    # Additional metadata
    metadata = models.JSONField(
        default=dict,
        help_text="Additional data for notification handling (e.g., deep link info, actions)"
    )
    
    # Status fields
    is_read = models.BooleanField(default=False)
    is_seen = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Priority for notification ordering and delivery
    priority = models.CharField(
        max_length=10,
        choices=[
            ('low', 'Low'),
            ('normal', 'Normal'), 
            ('high', 'High'),
            ('urgent', 'Urgent'),
        ],
        default='normal'
    )
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read', 'created_at']),
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['notification_type', 'created_at']),
            models.Index(fields=['priority', 'created_at']),
        ]

class DeviceToken(models.Model):
    """Store device tokens for push notifications"""
    PLATFORM_CHOICES = [
        ('ios', 'iOS'),
        ('android', 'Android'),
        ('web', 'Web'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='device_tokens'
    )
    token = models.TextField(unique=True)
    platform = models.CharField(max_length=10, choices=PLATFORM_CHOICES)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Store device locale for targeted notifications
    locale = models.CharField(max_length=10, default='en', help_text="Device locale (e.g., 'en', 'es', 'fr')")
    
    class Meta:
        unique_together = ['user', 'token']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['token', 'is_active']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.platform} - {self.token[:20]}..."

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
    email_program_activities = models.BooleanField(default=True)
    email_workout_milestones = models.BooleanField(default=True)
    email_goal_achieved = models.BooleanField(default=True)
    email_mentions = models.BooleanField(default=True)
    email_gym_announcements = models.BooleanField(default=True)
    email_group_workouts = models.BooleanField(default=True)
    email_workout_reminders = models.BooleanField(default=True)
    
    # Push notification preferences
    push_likes = models.BooleanField(default=True)
    push_comments = models.BooleanField(default=True)
    push_shares = models.BooleanField(default=True)
    push_friend_requests = models.BooleanField(default=True)
    push_program_activities = models.BooleanField(default=True)
    push_workout_milestones = models.BooleanField(default=True)
    push_goal_achieved = models.BooleanField(default=True)
    push_mentions = models.BooleanField(default=True)
    push_gym_announcements = models.BooleanField(default=True)
    push_group_workouts = models.BooleanField(default=True)
    push_workout_reminders = models.BooleanField(default=True)
    
    # Global push notification toggle
    push_notifications_enabled = models.BooleanField(default=True)
    
    # Quiet hours for notifications
    quiet_hours_enabled = models.BooleanField(default=False)
    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)
    
    # Frequency settings
    digest_frequency = models.CharField(
        max_length=10,
        choices=[
            ('never', 'Never'),
            ('daily', 'Daily'),
            ('weekly', 'Weekly'),
        ],
        default='weekly'
    )

class NotificationTemplate(models.Model):
    """Template definitions for notification content"""
    notification_type = models.CharField(max_length=30, unique=True)
    title_key = models.CharField(max_length=100)
    body_key = models.CharField(max_length=100)
    
    # Default parameters schema (for validation)
    default_params = models.JSONField(
        default=dict,
        help_text="Default parameter values and schema"
    )
    
    # Push notification specific settings
    push_title_key = models.CharField(max_length=100, blank=True)
    push_body_key = models.CharField(max_length=100, blank=True)
    
    # Email specific settings
    email_subject_key = models.CharField(max_length=100, blank=True)
    email_body_key = models.CharField(max_length=100, blank=True)
    
    # Notification metadata
    priority = models.CharField(
        max_length=10,
        choices=[
            ('low', 'Low'),
            ('normal', 'Normal'), 
            ('high', 'High'),
            ('urgent', 'Urgent'),
        ],
        default='normal'
    )
    
    # Actions that can be taken on this notification type
    available_actions = models.JSONField(
        default=list,
        help_text="List of actions available for this notification type"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['notification_type']