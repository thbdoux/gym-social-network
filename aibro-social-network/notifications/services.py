# notifications/services.py (UPDATED)
from django.contrib.contenttypes.models import ContentType
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json
from typing import Dict, Any, Optional

from .models import Notification, NotificationPreference, NotificationTemplate
from .expo_push_notification_service import expo_push_service
from .translation_service import translation_service  # Import translation service

class NotificationService:
    """Enhanced notification service with translation key support"""
    
    # Translation key mappings for each notification type (same as before)
    NOTIFICATION_TRANSLATIONS = {
        # Post interactions
        'like': {
            'title_key': 'notifications.like.title',
            'body_key': 'notifications.like.body',
            'push_title_key': 'notifications.like.push_title', 
            'push_body_key': 'notifications.like.push_body',
            'email_subject_key': 'notifications.like.email_subject',
            'email_body_key': 'notifications.like.email_body',
        },
        'comment': {
            'title_key': 'notifications.comment.title',
            'body_key': 'notifications.comment.body',
            'push_title_key': 'notifications.comment.push_title',
            'push_body_key': 'notifications.comment.push_body',
            'email_subject_key': 'notifications.comment.email_subject',
            'email_body_key': 'notifications.comment.email_body',
        },
        'share': {
            'title_key': 'notifications.share.title',
            'body_key': 'notifications.share.body',
            'push_title_key': 'notifications.share.push_title',
            'push_body_key': 'notifications.share.push_body',
            'email_subject_key': 'notifications.share.email_subject',
            'email_body_key': 'notifications.share.email_body',
        },
        'mention': {
            'title_key': 'notifications.mention.title',
            'body_key': 'notifications.mention.body',
            'push_title_key': 'notifications.mention.push_title',
            'push_body_key': 'notifications.mention.push_body',
            'email_subject_key': 'notifications.mention.email_subject',
            'email_body_key': 'notifications.mention.email_body',
        },
        
        # Social interactions
        'friend_request': {
            'title_key': 'notifications.friend_request.title',
            'body_key': 'notifications.friend_request.body',
            'push_title_key': 'notifications.friend_request.push_title',
            'push_body_key': 'notifications.friend_request.push_body',
            'email_subject_key': 'notifications.friend_request.email_subject',
            'email_body_key': 'notifications.friend_request.email_body',
        },
        'friend_accept': {
            'title_key': 'notifications.friend_accept.title',
            'body_key': 'notifications.friend_accept.body',
            'push_title_key': 'notifications.friend_accept.push_title',
            'push_body_key': 'notifications.friend_accept.push_body',
            'email_subject_key': 'notifications.friend_accept.email_subject',
            'email_body_key': 'notifications.friend_accept.email_body',
        },
        
        # Program interactions
        'program_fork': {
            'title_key': 'notifications.program_fork.title',
            'body_key': 'notifications.program_fork.body',
            'push_title_key': 'notifications.program_fork.push_title',
            'push_body_key': 'notifications.program_fork.push_body',
            'email_subject_key': 'notifications.program_fork.email_subject',
            'email_body_key': 'notifications.program_fork.email_body',
        },
        'program_shared': {
            'title_key': 'notifications.program_shared.title',
            'body_key': 'notifications.program_shared.body',
            'push_title_key': 'notifications.program_shared.push_title',
            'push_body_key': 'notifications.program_shared.push_body',
            'email_subject_key': 'notifications.program_shared.email_subject',
            'email_body_key': 'notifications.program_shared.email_body',
        },
        'program_liked': {
            'title_key': 'notifications.program_liked.title',
            'body_key': 'notifications.program_liked.body',
            'push_title_key': 'notifications.program_liked.push_title',
            'push_body_key': 'notifications.program_liked.push_body',
            'email_subject_key': 'notifications.program_liked.email_subject',
            'email_body_key': 'notifications.program_liked.email_body',
        },
        'program_used': {
            'title_key': 'notifications.program_used.title',
            'body_key': 'notifications.program_used.body',
            'push_title_key': 'notifications.program_used.push_title',
            'push_body_key': 'notifications.program_used.push_body',
            'email_subject_key': 'notifications.program_used.email_subject',
            'email_body_key': 'notifications.program_used.email_body',
        },
        
        # Template interactions
        'template_used': {
            'title_key': 'notifications.template_used.title',
            'body_key': 'notifications.template_used.body',
            'push_title_key': 'notifications.template_used.push_title',
            'push_body_key': 'notifications.template_used.push_body',
            'email_subject_key': 'notifications.template_used.email_subject',
            'email_body_key': 'notifications.template_used.email_body',
        },
        'template_forked': {
            'title_key': 'notifications.template_forked.title',
            'body_key': 'notifications.template_forked.body',
            'push_title_key': 'notifications.template_forked.push_title',
            'push_body_key': 'notifications.template_forked.push_body',
            'email_subject_key': 'notifications.template_forked.email_subject',
            'email_body_key': 'notifications.template_forked.email_body',
        },
        
        # Workout milestones and achievements
        'workout_milestone': {
            'title_key': 'notifications.workout_milestone.title',
            'body_key': 'notifications.workout_milestone.body',
            'push_title_key': 'notifications.workout_milestone.push_title',
            'push_body_key': 'notifications.workout_milestone.push_body',
            'email_subject_key': 'notifications.workout_milestone.email_subject',
            'email_body_key': 'notifications.workout_milestone.email_body',
        },
        # ... (include all other notification types from your original file)
        
        # Test notification
        'test': {
            'title_key': 'notifications.test.title',
            'body_key': 'notifications.test.body',
            'push_title_key': 'notifications.test.push_title',
            'push_body_key': 'notifications.test.push_body',
            'email_subject_key': 'notifications.test.email_subject',
            'email_body_key': 'notifications.test.email_body',
        },
    }
    
    @classmethod
    def create_notification(
        cls, 
        recipient,
        notification_type: str,
        sender=None,
        related_object=None,
        translation_params: Dict[str, Any] = None,
        content: str = '',
        priority: str = 'normal',
        metadata: Dict[str, Any] = None
    ):
        """
        Create a new notification with translation key support - UPDATED
        """
        content_type = None
        object_id = None
        
        if related_object:
            content_type = ContentType.objects.get_for_model(related_object)
            object_id = related_object.id
        
        # Get translation keys for this notification type
        translation_config = cls.NOTIFICATION_TRANSLATIONS.get(notification_type, {})
        
        # Prepare translation parameters
        if translation_params is None:
            translation_params = {}
        
        # Add common parameters
        if sender:
            translation_params.update({
                'sender_username': sender.username,
                'sender_first_name': sender.first_name,
                'sender_last_name': sender.last_name,
                'sender_display_name': sender.get_full_name() or sender.username,
            })
        
        # Add related object parameters if available
        if related_object:
            translation_params.update(cls._extract_object_params(related_object))
        
        notification = Notification.objects.create(
            recipient=recipient,
            sender=sender,
            notification_type=notification_type,
            title_key=translation_config.get('title_key', f'notifications.{notification_type}.title'),
            body_key=translation_config.get('body_key', f'notifications.{notification_type}.body'),
            translation_params=translation_params,
            content=content,  # Fallback content
            content_type=content_type,
            object_id=object_id,
            priority=priority,
            metadata=metadata or {}
        )
        
        # Send real-time notification
        cls.send_realtime_notification(notification)
        
        # Send push notification - UPDATED TO USE TRANSLATION KEYS
        cls.send_push_notification(notification)
        
        # Send email notification if configured
        cls.send_email_notification(notification)
        
        return notification
    
    @classmethod
    def _extract_object_params(cls, obj) -> Dict[str, Any]:
        """Extract relevant parameters from related objects for translation"""
        params = {}
        
        # Program-related parameters
        if hasattr(obj, 'name') and hasattr(obj, 'creator'):
            params.update({
                'program_name': obj.name,
                'object_name': obj.name,
            })
        
        # Workout-related parameters
        if hasattr(obj, 'title') and hasattr(obj, 'scheduled_time'):
            params.update({
                'workout_title': obj.title,
                'object_name': obj.title,
                'scheduled_time': obj.scheduled_time.isoformat(),
            })
        
        # Post-related parameters
        if hasattr(obj, 'content') and hasattr(obj, 'user'):
            params.update({
                'post_content': obj.content[:100] + '...' if len(obj.content) > 100 else obj.content,
            })
        
        # Generic object name fallback
        if hasattr(obj, 'name'):
            params['object_name'] = obj.name
        elif hasattr(obj, 'title'):
            params['object_name'] = obj.title
        
        return params
    
    @classmethod
    def send_realtime_notification(cls, notification):
        """Send real-time notification via WebSocket - UPDATED"""
        channel_layer = get_channel_layer()
        
        # Check if user has push notifications enabled for this type
        pref_field = f"push_{cls._get_preference_category(notification.notification_type)}"
        try:
            prefs = NotificationPreference.objects.get(user=notification.recipient)
            if not getattr(prefs, pref_field, True):
                return
        except NotificationPreference.DoesNotExist:
            pass
        
        # Translate notification for WebSocket (using user's language preference)
        translated_content = translation_service.translate_notification(
            user=notification.recipient,
            title_key=notification.title_key,
            body_key=notification.body_key,
            params=notification.translation_params
        )
        
        notification_data = {
            'id': notification.id,
            'type': notification.notification_type,
            'title_key': notification.title_key,
            'body_key': notification.body_key,
            'translation_params': notification.translation_params,
            'title': translated_content['title'],  # Add translated title
            'body': translated_content['body'],    # Add translated body
            'content': notification.content,  # Fallback
            'created_at': notification.created_at.isoformat(),
            'is_read': notification.is_read,
            'priority': notification.priority,
            'metadata': notification.metadata,
        }
        
        # Add sender info if available
        if notification.sender:
            notification_data['sender'] = {
                'id': notification.sender.id,
                'username': notification.sender.username,
                'avatar': notification.sender.avatar.url if notification.sender.avatar else None,
            }
        
        # Send to user's notification group
        async_to_sync(channel_layer.group_send)(
            f"notifications_{notification.recipient.id}",
            {
                'type': 'notification_message',
                'notification': notification_data
            }
        )
    
    @classmethod
    def send_push_notification(cls, notification):
        """Send push notification using Expo with translation keys - UPDATED"""
        try:
            # Get push-specific translation keys
            translation_config = cls.NOTIFICATION_TRANSLATIONS.get(notification.notification_type, {})
            push_title_key = translation_config.get('push_title_key', notification.title_key)
            push_body_key = translation_config.get('push_body_key', notification.body_key)
            
            # Prepare push notification data
            push_data = {
                'notification_id': str(notification.id),
                'notification_type': notification.notification_type,
                'title_key': push_title_key,
                'body_key': push_body_key,
                'translation_params': notification.translation_params,
                'object_id': str(notification.object_id) if notification.object_id else None,
                'sender_id': str(notification.sender.id) if notification.sender else None,
                'priority': notification.priority,
                'metadata': notification.metadata,
            }
            
            # UPDATED: Send push notification using translation keys (expo service will translate)
            success = expo_push_service.send_push_notification(
                user=notification.recipient,
                title_key=push_title_key,
                body_key=push_body_key,
                translation_params=notification.translation_params,
                data=push_data,
                notification_type=notification.notification_type,
                priority=notification.priority
            )
            
            if success:
                print(f"✅ Expo push notification sent successfully for notification {notification.id}")
            else:
                print(f"❌ Failed to send Expo push notification for notification {notification.id}")
                
        except Exception as e:
            print(f"❌ Error sending Expo push notification: {e}")
    
    @classmethod
    def send_email_notification(cls, notification):
        """Send email notification with translation keys"""
        from django.core.mail import send_mail
        from django.conf import settings
        
        # Check if user has email notifications enabled for this type
        pref_field = f"email_{cls._get_preference_category(notification.notification_type)}"
        try:
            prefs = NotificationPreference.objects.get(user=notification.recipient)
            if not getattr(prefs, pref_field, True):
                return
        except NotificationPreference.DoesNotExist:
            pass
        
        # Get email-specific translation keys
        translation_config = cls.NOTIFICATION_TRANSLATIONS.get(notification.notification_type, {})
        email_subject_key = translation_config.get('email_subject_key', notification.title_key)
        email_body_key = translation_config.get('email_body_key', notification.body_key)
        
        # Translate email content
        translated_content = translation_service.translate_notification(
            user=notification.recipient,
            title_key=email_subject_key,
            body_key=email_body_key,
            params=notification.translation_params
        )
        
        subject = translated_content['title']
        body = translated_content['body']
        
        # Fallback to content if available
        if notification.content:
            body += f"\n\n{notification.content}"
        
        try:
            send_mail(
                subject,
                body,
                settings.DEFAULT_FROM_EMAIL,
                [notification.recipient.email],
                fail_silently=True,
            )
            print(f"✅ Email notification sent to {notification.recipient.email}")
        except Exception as e:
            print(f"❌ Error sending email notification: {e}")
    
    @classmethod
    def _get_preference_category(cls, notification_type: str) -> str:
        """Map notification types to preference categories"""
        category_mapping = {
            'like': 'likes',
            'comment': 'comments', 
            'share': 'shares',
            'mention': 'mentions',
            'friend_request': 'friend_requests',
            'friend_accept': 'friend_requests',
            'program_fork': 'program_activities',
            'program_shared': 'program_activities',
            'program_liked': 'program_activities',
            'program_used': 'program_activities',
            'template_used': 'program_activities',
            'template_forked': 'program_activities',
            'workout_milestone': 'workout_milestones',
            'goal_achieved': 'goal_achieved',
            'streak_milestone': 'workout_milestones',
            'personal_record': 'workout_milestones',
            'workout_invitation': 'group_workouts',
            'workout_join': 'group_workouts',
            'workout_join_request': 'group_workouts',
            'workout_request_approved': 'group_workouts',
            'workout_request_rejected': 'group_workouts',
            'workout_cancelled': 'group_workouts',
            'workout_removed': 'group_workouts',
            'workout_completed': 'group_workouts',
            'workout_reminder': 'workout_reminders',
            'workout_proposal_submitted': 'group_workouts',
            'workout_proposal_voted': 'group_workouts',
            'workout_proposal_selected': 'group_workouts',
            'workout_partner_added': 'group_workouts',
            'workout_partner_request': 'group_workouts',
            'gym_announcement': 'gym_announcements',
            'system_update': 'gym_announcements',
            'challenge_invitation': 'group_workouts',
            'challenge_completed': 'goal_achieved',
            'test': 'gym_announcements',  # Add test category
        }
        
        return category_mapping.get(notification_type, 'gym_announcements')
    
    @classmethod
    def mark_as_read(cls, notification_id, user):
        """Mark a notification as read"""
        try:
            notification = Notification.objects.get(
                id=notification_id, 
                recipient=user
            )
            notification.is_read = True
            notification.is_seen = True
            notification.save()
            return True
        except Notification.DoesNotExist:
            return False
    
    @classmethod
    def mark_all_as_read(cls, user):
        """Mark all notifications as read for a user"""
        Notification.objects.filter(
            recipient=user,
            is_read=False
        ).update(is_read=True, is_seen=True)
        return True
    
    @classmethod
    def bulk_create_notifications(cls, recipients, notification_type, **kwargs):
        """Create notifications for multiple recipients efficiently"""
        notifications = []
        
        for recipient in recipients:
            notification = cls.create_notification(
                recipient=recipient,
                notification_type=notification_type,
                **kwargs
            )
            notifications.append(notification)
        
        return notifications