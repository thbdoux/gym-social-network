# notifications/models.py (ENHANCED)
from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

class Notification(models.Model):
    """Enhanced model for all notifications with comprehensive notification types"""
    NOTIFICATION_TYPES = [
        # === POST INTERACTIONS ===
        ('like', 'Like'),
        ('comment', 'Comment'),
        ('comment_reply', 'Comment Reply'),
        ('mention', 'Mention'),
        ('post_reaction', 'Post Reaction'),
        ('comment_reaction', 'Comment Reaction'),
        ('share', 'Share'),
        
        # === SOCIAL INTERACTIONS ===
        ('friend_request', 'Friend Request'),
        ('friend_accept', 'Friend Request Accepted'),
        
        # === PROGRAM INTERACTIONS ===
        ('program_fork', 'Program Forked'),
        ('program_shared', 'Program Shared'),
        ('program_liked', 'Program Liked'),
        ('program_used', 'Program Used'),
        
        # === TEMPLATE INTERACTIONS ===
        ('template_used', 'Template Used'),
        ('template_forked', 'Template Forked'),
        
        # === WORKOUT MILESTONES AND ACHIEVEMENTS ===
        ('workout_milestone', 'Workout Milestone'),
        ('goal_achieved', 'Goal Achieved'),
        ('streak_milestone', 'Streak Milestone'),
        ('personal_record', 'Personal Record'),
        
        # === GROUP WORKOUT INTERACTIONS ===
        ('workout_invitation', 'Workout Invitation'),
        ('workout_join', 'Workout Join'),
        ('workout_join_request', 'Workout Join Request'),
        ('workout_request_approved', 'Workout Request Approved'),
        ('workout_request_rejected', 'Workout Request Rejected'),
        ('workout_cancelled', 'Workout Cancelled'),
        ('workout_removed', 'Removed from Workout'),
        ('workout_completed', 'Workout Completed'),
        ('workout_reminder', 'Workout Reminder'),
        
        # === GROUP WORKOUT MESSAGES ===
        ('group_workout_message', 'Group Workout Message'),
        
        # === GROUP WORKOUT PROPOSALS AND VOTING ===
        ('workout_proposal_submitted', 'Workout Proposal Submitted'),
        ('workout_proposal_voted', 'Workout Proposal Voted'),
        ('workout_proposal_selected', 'Workout Proposal Selected'),
        
        # === WORKOUT PARTNERSHIPS ===
        ('workout_partner_added', 'Workout Partner Added'),
        ('workout_partner_request', 'Workout Partner Request'),
        
        # === GYM AND SYSTEM NOTIFICATIONS ===
        ('gym_announcement', 'Gym Announcement'),
        ('system_update', 'System Update'),
        ('challenge_invitation', 'Challenge Invitation'),
        ('challenge_completed', 'Challenge Completed'),
        
        # === TEST ===
        ('test', 'Test Notification'),
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
            models.Index(fields=['sender', 'created_at']),
        ]

    def __str__(self):
        return f"{self.notification_type} notification for {self.recipient.username}"

class DeviceToken(models.Model):
    """Store device tokens for push notifications with enhanced locale support"""
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
    locale = models.CharField(
        max_length=10, 
        default='en', 
        help_text="Device locale (e.g., 'en', 'es', 'fr')"
    )
    
    # Device info for analytics
    device_info = models.JSONField(
        default=dict,
        help_text="Additional device information (app version, OS version, etc.)"
    )
    
    class Meta:
        unique_together = ['user', 'token']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['token', 'is_active']),
            models.Index(fields=['locale', 'is_active']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.platform} - {self.token[:20]}..."

class NotificationPreference(models.Model):
    """Enhanced user preferences for notifications with granular control"""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notification_preferences'
    )
    
    # === EMAIL NOTIFICATION PREFERENCES ===
    # Post interactions
    email_likes = models.BooleanField(default=True)
    email_comments = models.BooleanField(default=True)
    email_shares = models.BooleanField(default=True)
    email_mentions = models.BooleanField(default=True)
    email_post_reactions = models.BooleanField(default=True)
    email_comment_reactions = models.BooleanField(default=True)
    
    # Social interactions
    email_friend_requests = models.BooleanField(default=True)
    
    # Program activities
    email_program_activities = models.BooleanField(default=True)
    
    # Workout milestones
    email_workout_milestones = models.BooleanField(default=True)
    email_goal_achieved = models.BooleanField(default=True)
    
    # Group workouts
    email_group_workouts = models.BooleanField(default=True)
    email_workout_reminders = models.BooleanField(default=True)
    email_group_workout_messages = models.BooleanField(default=False)  # Usually too frequent for email
    
    # System notifications
    email_gym_announcements = models.BooleanField(default=True)
    
    # === PUSH NOTIFICATION PREFERENCES ===
    # Post interactions
    push_likes = models.BooleanField(default=True)
    push_comments = models.BooleanField(default=True)
    push_shares = models.BooleanField(default=True)
    push_mentions = models.BooleanField(default=True)
    push_post_reactions = models.BooleanField(default=True)
    push_comment_reactions = models.BooleanField(default=True)
    
    # Social interactions
    push_friend_requests = models.BooleanField(default=True)
    
    # Program activities
    push_program_activities = models.BooleanField(default=True)
    
    # Workout milestones
    push_workout_milestones = models.BooleanField(default=True)
    push_goal_achieved = models.BooleanField(default=True)
    
    # Group workouts
    push_group_workouts = models.BooleanField(default=True)
    push_workout_reminders = models.BooleanField(default=True)
    push_group_workout_messages = models.BooleanField(default=True)
    
    # System notifications
    push_gym_announcements = models.BooleanField(default=True)
    
    # === GLOBAL SETTINGS ===
    push_notifications_enabled = models.BooleanField(default=True)
    email_notifications_enabled = models.BooleanField(default=True)
    
    # === QUIET HOURS ===
    quiet_hours_enabled = models.BooleanField(default=False)
    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)
    
    # === FREQUENCY SETTINGS ===
    digest_frequency = models.CharField(
        max_length=10,
        choices=[
            ('never', 'Never'),
            ('daily', 'Daily'),
            ('weekly', 'Weekly'),
        ],
        default='weekly'
    )
    
    # === ADVANCED SETTINGS ===
    group_notifications = models.BooleanField(
        default=True,
        help_text="Group similar notifications together"
    )
    
    sound_enabled = models.BooleanField(
        default=True,
        help_text="Play sound for push notifications"
    )
    
    vibration_enabled = models.BooleanField(
        default=True,
        help_text="Vibrate for push notifications"
    )
    
    # Language preference for notifications
    notification_language = models.CharField(
        max_length=5,
        choices=[
            ('en', 'English'),
            ('fr', 'French'),
            ('es', 'Spanish'),
            ('de', 'German'),
            ('it', 'Italian'),
        ],
        default='en'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Notification preferences for {self.user.username}"

class NotificationTemplate(models.Model):
    """Enhanced template definitions for notification content with versioning"""
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
    
    # Template versioning
    version = models.CharField(max_length=10, default='1.0')
    is_active = models.BooleanField(default=True)
    
    # Customization options
    supports_grouping = models.BooleanField(
        default=False,
        help_text="Whether notifications of this type can be grouped together"
    )
    
    max_frequency = models.CharField(
        max_length=20,
        choices=[
            ('unlimited', 'Unlimited'),
            ('once_per_hour', 'Once per hour'),
            ('once_per_day', 'Once per day'),
            ('once_per_week', 'Once per week'),
        ],
        default='unlimited',
        help_text="Maximum frequency for this notification type per user"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['notification_type']
        indexes = [
            models.Index(fields=['notification_type', 'is_active']),
            models.Index(fields=['priority', 'is_active']),
        ]

    def __str__(self):
        return f"Template for {self.notification_type} (v{self.version})"

class NotificationGroup(models.Model):
    """Group similar notifications together to reduce notification spam"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notification_groups'
    )
    notification_type = models.CharField(max_length=30)
    group_key = models.CharField(
        max_length=255,
        help_text="Key to group notifications (e.g., post_id for post interactions)"
    )
    
    # Group metadata
    first_notification = models.ForeignKey(
        Notification,
        on_delete=models.CASCADE,
        related_name='first_in_group'
    )
    last_notification = models.ForeignKey(
        Notification,
        on_delete=models.CASCADE,
        related_name='last_in_group'
    )
    
    count = models.PositiveIntegerField(default=1)
    is_read = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'notification_type', 'group_key']
        indexes = [
            models.Index(fields=['user', 'is_read', 'updated_at']),
            models.Index(fields=['notification_type', 'group_key']),
        ]

    def __str__(self):
        return f"{self.notification_type} group for {self.user.username} ({self.count} notifications)"

class NotificationDeliveryLog(models.Model):
    """Log notification delivery attempts for debugging and analytics"""
    DELIVERY_TYPES = [
        ('push', 'Push Notification'),
        ('email', 'Email'),
        ('websocket', 'WebSocket'),
        ('sms', 'SMS'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
        ('bounced', 'Bounced'),
    ]
    
    notification = models.ForeignKey(
        Notification,
        on_delete=models.CASCADE,
        related_name='delivery_logs'
    )
    delivery_type = models.CharField(max_length=20, choices=DELIVERY_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Delivery details
    recipient_address = models.CharField(
        max_length=255,
        help_text="Email address, device token, etc."
    )
    external_id = models.CharField(
        max_length=255,
        blank=True,
        help_text="External service ID (e.g., Expo receipt ID)"
    )
    
    # Error tracking
    error_message = models.TextField(blank=True)
    retry_count = models.PositiveIntegerField(default=0)
    
    # Timing
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['notification', 'delivery_type']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['delivery_type', 'status']),
        ]

    def __str__(self):
        return f"{self.delivery_type} delivery for notification {self.notification.id} - {self.status}"