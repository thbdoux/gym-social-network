# notifications/serializers.py (ENHANCED)
from rest_framework import serializers
from django.utils import timezone
from .models import Notification, NotificationPreference, DeviceToken, NotificationGroup
from .translation_service import translation_service

class NotificationSerializer(serializers.ModelSerializer):
    """Enhanced serializer for notifications with translation support"""
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    sender_display_name = serializers.SerializerMethodField()
    sender_avatar = serializers.ImageField(source='sender.avatar', read_only=True)
    
    # Translated content
    translated_title = serializers.SerializerMethodField()
    translated_body = serializers.SerializerMethodField()
    
    # Time-related fields
    time_ago = serializers.SerializerMethodField()
    is_recent = serializers.SerializerMethodField()
    
    # Related object info
    related_object_info = serializers.SerializerMethodField()
    
    # Action buttons
    available_actions = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'sender', 'sender_username', 'sender_display_name', 'sender_avatar',
            'notification_type', 'title_key', 'body_key', 'translation_params',
            'translated_title', 'translated_body', 'content',
            'content_type', 'object_id', 'related_object_info',
            'metadata', 'is_read', 'is_seen', 'created_at', 'priority',
            'time_ago', 'is_recent', 'available_actions'
        ]
        read_only_fields = fields
    
    def get_sender_display_name(self, obj):
        """Get the display name for the sender"""
        if obj.sender:
            return obj.sender.get_full_name() or obj.sender.username
        return None
    
    def get_translated_title(self, obj):
        """Get translated title based on user's language preference"""
        request = self.context.get('request')
        if request and request.user:
            return translation_service.translate(
                obj.title_key,
                translation_service.get_user_language(request.user),
                obj.translation_params
            )
        return translation_service.translate(obj.title_key, 'en', obj.translation_params)
    
    def get_translated_body(self, obj):
        """Get translated body based on user's language preference"""
        request = self.context.get('request')
        if request and request.user:
            return translation_service.translate(
                obj.body_key,
                translation_service.get_user_language(request.user),
                obj.translation_params
            )
        return translation_service.translate(obj.body_key, 'en', obj.translation_params)
    
    def get_time_ago(self, obj):
        """Get human-readable time ago"""
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        else:
            return "Just now"
    
    def get_is_recent(self, obj):
        """Check if notification is recent (within last hour)"""
        now = timezone.now()
        diff = now - obj.created_at
        return diff.total_seconds() < 3600
    
    def get_related_object_info(self, obj):
        """Get information about the related object"""
        if not obj.related_object:
            return None
        
        try:
            related_obj = obj.related_object
            info = {
                'type': obj.content_type.model,
                'id': obj.object_id
            }
            
            # Add specific fields based on object type
            if hasattr(related_obj, 'title'):
                info['title'] = related_obj.title
            elif hasattr(related_obj, 'name'):
                info['name'] = related_obj.name
            elif hasattr(related_obj, 'content'):
                content = related_obj.content
                info['preview'] = content[:100] + '...' if len(content) > 100 else content
            
            # Add URL for deep linking
            if hasattr(related_obj, 'get_absolute_url'):
                info['url'] = related_obj.get_absolute_url()
            
            return info
        except Exception:
            return None
    
    def get_available_actions(self, obj):
        """Get available actions for this notification type"""
        actions = ['mark_read'] if not obj.is_read else []
        
        # Add type-specific actions
        if obj.notification_type == 'friend_request':
            actions.extend(['accept', 'decline'])
        elif obj.notification_type == 'workout_invitation':
            actions.extend(['accept', 'decline'])
        elif obj.notification_type == 'workout_join_request':
            actions.extend(['approve', 'reject'])
        elif obj.notification_type in ['comment', 'mention']:
            actions.append('reply')
        elif obj.notification_type in ['like', 'comment']:
            actions.append('view_post')
        
        return actions

class NotificationGroupSerializer(serializers.ModelSerializer):
    """Serializer for grouped notifications"""
    first_notification = NotificationSerializer(read_only=True)
    last_notification = NotificationSerializer(read_only=True)
    preview_senders = serializers.SerializerMethodField()
    group_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = NotificationGroup
        fields = [
            'id', 'notification_type', 'group_key', 'count', 'is_read',
            'first_notification', 'last_notification', 'preview_senders',
            'group_summary', 'created_at', 'updated_at'
        ]
        read_only_fields = fields
    
    def get_preview_senders(self, obj):
        """Get preview of senders in this group"""
        # This would need to be implemented based on your grouping logic
        # For now, return basic info
        return [
            {
                'username': obj.first_notification.sender.username if obj.first_notification.sender else None,
                'display_name': obj.first_notification.sender.get_full_name() if obj.first_notification.sender else None
            }
        ]
    
    def get_group_summary(self, obj):
        """Get a summary description of the group"""
        if obj.count == 1:
            return f"1 {obj.notification_type.replace('_', ' ')}"
        elif obj.count <= 3:
            return f"{obj.count} {obj.notification_type.replace('_', ' ')}s"
        else:
            return f"{obj.count} {obj.notification_type.replace('_', ' ')}s"

class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Enhanced serializer for notification preferences"""
    
    # Computed fields for easier frontend handling
    all_push_enabled = serializers.SerializerMethodField()
    all_email_enabled = serializers.SerializerMethodField()
    
    # Category summaries
    social_push_enabled = serializers.SerializerMethodField()
    social_email_enabled = serializers.SerializerMethodField()
    workout_push_enabled = serializers.SerializerMethodField()
    workout_email_enabled = serializers.SerializerMethodField()
    
    class Meta:
        model = NotificationPreference
        exclude = ['user']
        
    def get_all_push_enabled(self, obj):
        """Check if all push notifications are enabled"""
        push_fields = [f for f in obj._meta.get_fields() 
                      if f.name.startswith('push_') and hasattr(f, 'get_internal_type')]
        return all(getattr(obj, field.name, False) for field in push_fields)
    
    def get_all_email_enabled(self, obj):
        """Check if all email notifications are enabled"""
        email_fields = [f for f in obj._meta.get_fields() 
                       if f.name.startswith('email_') and hasattr(f, 'get_internal_type')]
        return all(getattr(obj, field.name, False) for field in email_fields)
    
    def get_social_push_enabled(self, obj):
        """Check if social push notifications are enabled"""
        social_fields = ['push_likes', 'push_comments', 'push_shares', 'push_mentions']
        return all(getattr(obj, field, False) for field in social_fields)
    
    def get_social_email_enabled(self, obj):
        """Check if social email notifications are enabled"""
        social_fields = ['email_likes', 'email_comments', 'email_shares', 'email_mentions']
        return all(getattr(obj, field, False) for field in social_fields)
    
    def get_workout_push_enabled(self, obj):
        """Check if workout push notifications are enabled"""
        workout_fields = ['push_workout_milestones', 'push_group_workouts', 'push_workout_reminders']
        return all(getattr(obj, field, False) for field in workout_fields)
    
    def get_workout_email_enabled(self, obj):
        """Check if workout email notifications are enabled"""
        workout_fields = ['email_workout_milestones', 'email_group_workouts', 'email_workout_reminders']
        return all(getattr(obj, field, False) for field in workout_fields)
    
    def validate(self, data):
        """Validate notification preferences"""
        # Ensure at least some notifications are enabled
        push_enabled = data.get('push_notifications_enabled', True)
        email_enabled = data.get('email_notifications_enabled', True)
        
        if not push_enabled and not email_enabled:
            # Allow but warn
            pass
        
        # Validate quiet hours
        quiet_enabled = data.get('quiet_hours_enabled', False)
        if quiet_enabled:
            start_time = data.get('quiet_hours_start')
            end_time = data.get('quiet_hours_end')
            
            if not start_time or not end_time:
                raise serializers.ValidationError(
                    "Quiet hours start and end times are required when quiet hours are enabled."
                )
        
        return data

class DeviceTokenSerializer(serializers.ModelSerializer):
    """Enhanced serializer for device tokens"""
    
    # Additional computed fields
    is_expo_token = serializers.SerializerMethodField()
    token_preview = serializers.SerializerMethodField()
    days_since_registered = serializers.SerializerMethodField()
    
    class Meta:
        model = DeviceToken
        fields = [
            'id', 'token', 'platform', 'locale', 'is_active', 
            'device_info', 'created_at', 'updated_at',
            'is_expo_token', 'token_preview', 'days_since_registered'
        ]
        extra_kwargs = {
            'token': {'write_only': True}  # Don't expose full token in responses
        }
    
    def get_is_expo_token(self, obj):
        """Check if this is a valid Expo token"""
        return obj.token.startswith(('ExponentPushToken[', 'ExpoPushToken[')) and obj.token.endswith(']')
    
    def get_token_preview(self, obj):
        """Get a preview of the token for display"""
        if len(obj.token) > 20:
            return obj.token[:10] + '...' + obj.token[-10:]
        return obj.token
    
    def get_days_since_registered(self, obj):
        """Get days since token was registered"""
        now = timezone.now()
        diff = now - obj.created_at
        return diff.days
    
    def validate_token(self, value):
        """Validate Expo push token format"""
        if not value.startswith(('ExponentPushToken[', 'ExpoPushToken[')) or not value.endswith(']'):
            raise serializers.ValidationError(
                "Invalid Expo push token format. Token should start with 'ExponentPushToken[' or 'ExpoPushToken[' and end with ']'"
            )
        return value
    
    def validate_locale(self, value):
        """Validate locale format"""
        valid_locales = ['en', 'fr', 'es', 'de', 'it', 'pt', 'zh', 'ja', 'ko']
        if value not in valid_locales:
            raise serializers.ValidationError(
                f"Invalid locale. Must be one of: {', '.join(valid_locales)}"
            )
        return value
    
    def create(self, validated_data):
        """Create device token with Expo service registration"""
        from .expo_push_notification_service import expo_push_service
        
        user = self.context['request'].user
        token = validated_data['token']
        platform = validated_data['platform']
        locale = validated_data.get('locale', 'en')
        
        # Create or update device token
        device_token, created = DeviceToken.objects.update_or_create(
            user=user,
            token=token,
            defaults=validated_data
        )
        
        # Register with Expo service
        success = expo_push_service.register_device_token(user, token, platform, locale)
        
        if not success:
            raise serializers.ValidationError("Failed to register Expo push token with service")
        
        return device_token

class NotificationStatsSerializer(serializers.Serializer):
    """Serializer for notification statistics"""
    total_notifications = serializers.IntegerField()
    unread_notifications = serializers.IntegerField()
    read_rate_percent = serializers.FloatField()
    most_common_type = serializers.CharField()
    avg_daily_notifications = serializers.FloatField()
    last_notification_date = serializers.DateTimeField()
    
    # Breakdown by type
    notifications_by_type = serializers.DictField()
    notifications_by_priority = serializers.DictField()
    
    # Recent activity
    recent_activity = serializers.ListField()

class BulkNotificationActionSerializer(serializers.Serializer):
    """Serializer for bulk notification actions"""
    ACTION_CHOICES = [
        ('mark_read', 'Mark as Read'),
        ('mark_unread', 'Mark as Unread'),
        ('delete', 'Delete'),
        ('mark_seen', 'Mark as Seen'),
    ]
    
    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=True,
        help_text="List of notification IDs to perform action on"
    )
    action = serializers.ChoiceField(
        choices=ACTION_CHOICES,
        required=True,
        help_text="Action to perform on selected notifications"
    )
    
    def validate_notification_ids(self, value):
        """Validate that notification IDs exist and belong to user"""
        if not value:
            raise serializers.ValidationError("At least one notification ID is required")
        
        user = self.context['request'].user
        existing_ids = Notification.objects.filter(
            id__in=value,
            recipient=user
        ).values_list('id', flat=True)
        
        invalid_ids = set(value) - set(existing_ids)
        if invalid_ids:
            raise serializers.ValidationError(
                f"Invalid notification IDs: {list(invalid_ids)}"
            )
        
        return value

class NotificationTypeStatsSerializer(serializers.Serializer):
    """Serializer for notification type statistics"""
    notification_type = serializers.CharField()
    count = serializers.IntegerField()
    unread_count = serializers.IntegerField()
    percentage = serializers.FloatField()
    avg_per_day = serializers.FloatField()
    last_received = serializers.DateTimeField()
    read_rate = serializers.FloatField()