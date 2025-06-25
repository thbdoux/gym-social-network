# notifications/services.py (ENHANCED)
from django.contrib.contenttypes.models import ContentType
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json
from typing import Dict, Any, Optional

from .models import Notification, NotificationPreference, NotificationTemplate
from .expo_push_notification_service import expo_push_service
from .translation_service import translation_service

class NotificationService:
    """Enhanced notification service with comprehensive translation key support"""
    
    # Enhanced translation key mappings for each notification type
    NOTIFICATION_TRANSLATIONS = {
        # === POST INTERACTIONS ===
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
        'comment_reply': {
            'title_key': 'notifications.comment_reply.title',
            'body_key': 'notifications.comment_reply.body',
            'push_title_key': 'notifications.comment_reply.push_title',
            'push_body_key': 'notifications.comment_reply.push_body',
            'email_subject_key': 'notifications.comment_reply.email_subject',
            'email_body_key': 'notifications.comment_reply.email_body',
        },
        'mention': {
            'title_key': 'notifications.mention.title',
            'body_key': 'notifications.mention.body',
            'push_title_key': 'notifications.mention.push_title',
            'push_body_key': 'notifications.mention.push_body',
            'email_subject_key': 'notifications.mention.email_subject',
            'email_body_key': 'notifications.mention.email_body',
        },
        'post_reaction': {
            'title_key': 'notifications.post_reaction.title',
            'body_key': 'notifications.post_reaction.body',
            'push_title_key': 'notifications.post_reaction.push_title',
            'push_body_key': 'notifications.post_reaction.push_body',
            'email_subject_key': 'notifications.post_reaction.email_subject',
            'email_body_key': 'notifications.post_reaction.email_body',
        },
        'comment_reaction': {
            'title_key': 'notifications.comment_reaction.title',
            'body_key': 'notifications.comment_reaction.body',
            'push_title_key': 'notifications.comment_reaction.push_title',
            'push_body_key': 'notifications.comment_reaction.push_body',
            'email_subject_key': 'notifications.comment_reaction.email_subject',
            'email_body_key': 'notifications.comment_reaction.email_body',
        },
        'share': {
            'title_key': 'notifications.share.title',
            'body_key': 'notifications.share.body',
            'push_title_key': 'notifications.share.push_title',
            'push_body_key': 'notifications.share.push_body',
            'email_subject_key': 'notifications.share.email_subject',
            'email_body_key': 'notifications.share.email_body',
        },
        
        # === SOCIAL INTERACTIONS ===
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
        
        # === PROGRAM INTERACTIONS ===
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
        
        # === TEMPLATE INTERACTIONS ===
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
        
        # === WORKOUT MILESTONES AND ACHIEVEMENTS ===
        'workout_milestone': {
            'title_key': 'notifications.workout_milestone.title',
            'body_key': 'notifications.workout_milestone.body',
            'push_title_key': 'notifications.workout_milestone.push_title',
            'push_body_key': 'notifications.workout_milestone.push_body',
            'email_subject_key': 'notifications.workout_milestone.email_subject',
            'email_body_key': 'notifications.workout_milestone.email_body',
        },
        'streak_milestone': {
            'title_key': 'notifications.streak_milestone.title',
            'body_key': 'notifications.streak_milestone.body',
            'push_title_key': 'notifications.streak_milestone.push_title',
            'push_body_key': 'notifications.streak_milestone.push_body',
            'email_subject_key': 'notifications.streak_milestone.email_subject',
            'email_body_key': 'notifications.streak_milestone.email_body',
        },
        'personal_record': {
            'title_key': 'notifications.personal_record.title',
            'body_key': 'notifications.personal_record.body',
            'push_title_key': 'notifications.personal_record.push_title',
            'push_body_key': 'notifications.personal_record.push_body',
            'email_subject_key': 'notifications.personal_record.email_subject',
            'email_body_key': 'notifications.personal_record.email_body',
        },
        'goal_achieved': {
            'title_key': 'notifications.goal_achieved.title',
            'body_key': 'notifications.goal_achieved.body',
            'push_title_key': 'notifications.goal_achieved.push_title',
            'push_body_key': 'notifications.goal_achieved.push_body',
            'email_subject_key': 'notifications.goal_achieved.email_subject',
            'email_body_key': 'notifications.goal_achieved.email_body',
        },
        
        # === GROUP WORKOUT INTERACTIONS ===
        'workout_invitation': {
            'title_key': 'notifications.workout_invitation.title',
            'body_key': 'notifications.workout_invitation.body',
            'push_title_key': 'notifications.workout_invitation.push_title',
            'push_body_key': 'notifications.workout_invitation.push_body',
            'email_subject_key': 'notifications.workout_invitation.email_subject',
            'email_body_key': 'notifications.workout_invitation.email_body',
        },
        'workout_join': {
            'title_key': 'notifications.workout_join.title',
            'body_key': 'notifications.workout_join.body',
            'push_title_key': 'notifications.workout_join.push_title',
            'push_body_key': 'notifications.workout_join.push_body',
            'email_subject_key': 'notifications.workout_join.email_subject',
            'email_body_key': 'notifications.workout_join.email_body',
        },
        'workout_join_request': {
            'title_key': 'notifications.workout_join_request.title',
            'body_key': 'notifications.workout_join_request.body',
            'push_title_key': 'notifications.workout_join_request.push_title',
            'push_body_key': 'notifications.workout_join_request.push_body',
            'email_subject_key': 'notifications.workout_join_request.email_subject',
            'email_body_key': 'notifications.workout_join_request.email_body',
        },
        'workout_request_approved': {
            'title_key': 'notifications.workout_request_approved.title',
            'body_key': 'notifications.workout_request_approved.body',
            'push_title_key': 'notifications.workout_request_approved.push_title',
            'push_body_key': 'notifications.workout_request_approved.push_body',
            'email_subject_key': 'notifications.workout_request_approved.email_subject',
            'email_body_key': 'notifications.workout_request_approved.email_body',
        },
        'workout_request_rejected': {
            'title_key': 'notifications.workout_request_rejected.title',
            'body_key': 'notifications.workout_request_rejected.body',
            'push_title_key': 'notifications.workout_request_rejected.push_title',
            'push_body_key': 'notifications.workout_request_rejected.push_body',
            'email_subject_key': 'notifications.workout_request_rejected.email_subject',
            'email_body_key': 'notifications.workout_request_rejected.email_body',
        },
        'workout_cancelled': {
            'title_key': 'notifications.workout_cancelled.title',
            'body_key': 'notifications.workout_cancelled.body',
            'push_title_key': 'notifications.workout_cancelled.push_title',
            'push_body_key': 'notifications.workout_cancelled.push_body',
            'email_subject_key': 'notifications.workout_cancelled.email_subject',
            'email_body_key': 'notifications.workout_cancelled.email_body',
        },
        'workout_removed': {
            'title_key': 'notifications.workout_removed.title',
            'body_key': 'notifications.workout_removed.body',
            'push_title_key': 'notifications.workout_removed.push_title',
            'push_body_key': 'notifications.workout_removed.push_body',
            'email_subject_key': 'notifications.workout_removed.email_subject',
            'email_body_key': 'notifications.workout_removed.email_body',
        },
        'workout_completed': {
            'title_key': 'notifications.workout_completed.title',
            'body_key': 'notifications.workout_completed.body',
            'push_title_key': 'notifications.workout_completed.push_title',
            'push_body_key': 'notifications.workout_completed.push_body',
            'email_subject_key': 'notifications.workout_completed.email_subject',
            'email_body_key': 'notifications.workout_completed.email_body',
        },
        'workout_reminder': {
            'title_key': 'notifications.workout_reminder.title',
            'body_key': 'notifications.workout_reminder.body',
            'push_title_key': 'notifications.workout_reminder.push_title',
            'push_body_key': 'notifications.workout_reminder.push_body',
            'email_subject_key': 'notifications.workout_reminder.email_subject',
            'email_body_key': 'notifications.workout_reminder.email_body',
        },
        
        # === GROUP WORKOUT MESSAGES ===
        'group_workout_message': {
            'title_key': 'notifications.group_workout_message.title',
            'body_key': 'notifications.group_workout_message.body',
            'push_title_key': 'notifications.group_workout_message.push_title',
            'push_body_key': 'notifications.group_workout_message.push_body',
            'email_subject_key': 'notifications.group_workout_message.email_subject',
            'email_body_key': 'notifications.group_workout_message.email_body',
        },
        
        # === WORKOUT PROPOSALS & VOTING ===
        'workout_proposal_submitted': {
            'title_key': 'notifications.workout_proposal_submitted.title',
            'body_key': 'notifications.workout_proposal_submitted.body',
            'push_title_key': 'notifications.workout_proposal_submitted.push_title',
            'push_body_key': 'notifications.workout_proposal_submitted.push_body',
            'email_subject_key': 'notifications.workout_proposal_submitted.email_subject',
            'email_body_key': 'notifications.workout_proposal_submitted.email_body',
        },
        'workout_proposal_voted': {
            'title_key': 'notifications.workout_proposal_voted.title',
            'body_key': 'notifications.workout_proposal_voted.body',
            'push_title_key': 'notifications.workout_proposal_voted.push_title',
            'push_body_key': 'notifications.workout_proposal_voted.push_body',
            'email_subject_key': 'notifications.workout_proposal_voted.email_subject',
            'email_body_key': 'notifications.workout_proposal_voted.email_body',
        },
        'workout_proposal_selected': {
            'title_key': 'notifications.workout_proposal_selected.title',
            'body_key': 'notifications.workout_proposal_selected.body',
            'push_title_key': 'notifications.workout_proposal_selected.push_title',
            'push_body_key': 'notifications.workout_proposal_selected.push_body',
            'email_subject_key': 'notifications.workout_proposal_selected.email_subject',
            'email_body_key': 'notifications.workout_proposal_selected.email_body',
        },
        
        # === WORKOUT PARTNERS ===
        'workout_partner_added': {
            'title_key': 'notifications.workout_partner_added.title',
            'body_key': 'notifications.workout_partner_added.body',
            'push_title_key': 'notifications.workout_partner_added.push_title',
            'push_body_key': 'notifications.workout_partner_added.push_body',
            'email_subject_key': 'notifications.workout_partner_added.email_subject',
            'email_body_key': 'notifications.workout_partner_added.email_body',
        },
        'workout_partner_request': {
            'title_key': 'notifications.workout_partner_request.title',
            'body_key': 'notifications.workout_partner_request.body',
            'push_title_key': 'notifications.workout_partner_request.push_title',
            'push_body_key': 'notifications.workout_partner_request.push_body',
            'email_subject_key': 'notifications.workout_partner_request.email_subject',
            'email_body_key': 'notifications.workout_partner_request.email_body',
        },
        
        # === SYSTEM NOTIFICATIONS ===
        'gym_announcement': {
            'title_key': 'notifications.gym_announcement.title',
            'body_key': 'notifications.gym_announcement.body',
            'push_title_key': 'notifications.gym_announcement.push_title',
            'push_body_key': 'notifications.gym_announcement.push_body',
            'email_subject_key': 'notifications.gym_announcement.email_subject',
            'email_body_key': 'notifications.gym_announcement.email_body',
        },
        'system_update': {
            'title_key': 'notifications.system_update.title',
            'body_key': 'notifications.system_update.body',
            'push_title_key': 'notifications.system_update.push_title',
            'push_body_key': 'notifications.system_update.push_body',
            'email_subject_key': 'notifications.system_update.email_subject',
            'email_body_key': 'notifications.system_update.email_body',
        },
        
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
    
    # Reaction emoji mapping
    REACTION_EMOJIS = {
        'like': '👍',
        'love': '❤️',
        'laugh': '😂',
        'wow': '😮',
        'sad': '😢',
        'angry': '😡'
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
        Create a new notification with enhanced translation key support
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
        
        # Send push notification
        cls.send_push_notification(notification)
        
        # Send email notification if configured
        cls.send_email_notification(notification)
        
        return notification
    
    @classmethod
    def _extract_object_params(cls, obj) -> Dict[str, Any]:
        """Extract relevant parameters from related objects for translation"""
        params = {}
        
        # Post-related parameters
        if hasattr(obj, 'content') and hasattr(obj, 'user'):
            content = obj.content or ""
            params.update({
                'post_content': content[:100] + '...' if len(content) > 100 else content,
                'post_id': obj.id,
            })
        
        # Comment-related parameters
        if hasattr(obj, 'content') and hasattr(obj, 'post'):
            content = obj.content or ""
            params.update({
                'comment_content': content[:100] + '...' if len(content) > 100 else content,
                'reply_content': content[:100] + '...' if len(content) > 100 else content,
                'comment_id': obj.id,
            })
        
        # Program-related parameters
        if hasattr(obj, 'name') and hasattr(obj, 'creator'):
            params.update({
                'program_name': obj.name,
                'original_program_name': obj.name,
                'forked_program_name': obj.name,
                'object_name': obj.name,
            })
        
        # Workout-related parameters
        if hasattr(obj, 'title') and hasattr(obj, 'scheduled_time'):
            params.update({
                'workout_title': obj.title,
                'object_name': obj.title,
                'scheduled_time': obj.scheduled_time.strftime('%Y-%m-%d %H:%M'),
            })
            
            # Add gym information if available
            if hasattr(obj, 'gym') and obj.gym:
                params['gym_name'] = obj.gym.name
            else:
                params['gym_name'] = 'TBD'
        
        # Workout log-related parameters
        if hasattr(obj, 'name') and hasattr(obj, 'date') and hasattr(obj, 'user'):
            params.update({
                'workout_name': obj.name,
                'workout_date': obj.date.strftime('%Y-%m-%d'),
            })
        
        # Template-related parameters
        if hasattr(obj, 'name') and hasattr(obj, 'creator') and hasattr(obj, 'exercises'):
            params.update({
                'template_name': obj.name,
                'object_name': obj.name,
            })
        
        # Message-related parameters
        if hasattr(obj, 'content') and hasattr(obj, 'group_workout'):
            content = obj.content or ""
            params.update({
                'message_content': content,
                'message_preview': content[:50] + '...' if len(content) > 50 else content,
            })
            if obj.group_workout is not None:
                params['workout_title'] = obj.group_workout.title
        
        # Reaction-related parameters
        if hasattr(obj, 'reaction_type'):
            params.update({
                'reaction_type': obj.reaction_type,
                'reaction_emoji': cls.REACTION_EMOJIS.get(obj.reaction_type, '👍'),
            })
        
        # Exercise-related parameters (for personal records)
        if hasattr(obj, 'name') and hasattr(obj, 'sets'):
            params.update({
                'exercise_name': obj.name,
            })
        
        # Generic object name fallback
        if 'object_name' not in params:
            if hasattr(obj, 'name'):
                params['object_name'] = obj.name
            elif hasattr(obj, 'title'):
                params['object_name'] = obj.title
        
        return params
    
    @classmethod
    def send_realtime_notification(cls, notification):
        """Send real-time notification via WebSocket"""
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
            'title': translated_content['title'],
            'body': translated_content['body'],
            'content': notification.content,
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
        """Send push notification using Expo with translation keys"""
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
            
            # Send push notification using translation keys
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
            # Post interactions
            'like': 'likes',
            'comment': 'comments', 
            'comment_reply': 'comments',
            'mention': 'mentions',
            'post_reaction': 'likes',
            'comment_reaction': 'comments',
            'share': 'shares',
            
            # Social interactions
            'friend_request': 'friend_requests',
            'friend_accept': 'friend_requests',
            
            # Program interactions
            'program_fork': 'program_activities',
            'program_shared': 'program_activities',
            'program_liked': 'program_activities',
            'program_used': 'program_activities',
            'template_used': 'program_activities',
            'template_forked': 'program_activities',
            
            # Workout achievements
            'workout_milestone': 'workout_milestones',
            'goal_achieved': 'goal_achieved',
            'streak_milestone': 'workout_milestones',
            'personal_record': 'workout_milestones',
            
            # Group workouts
            'workout_invitation': 'group_workouts',
            'workout_join': 'group_workouts',
            'workout_join_request': 'group_workouts',
            'workout_request_approved': 'group_workouts',
            'workout_request_rejected': 'group_workouts',
            'workout_cancelled': 'group_workouts',
            'workout_removed': 'group_workouts',
            'workout_completed': 'group_workouts',
            'workout_reminder': 'workout_reminders',
            'group_workout_message': 'group_workouts',
            'workout_proposal_submitted': 'group_workouts',
            'workout_proposal_voted': 'group_workouts',
            'workout_proposal_selected': 'group_workouts',
            'workout_partner_added': 'group_workouts',
            'workout_partner_request': 'group_workouts',
            
            # System
            'gym_announcement': 'gym_announcements',
            'system_update': 'gym_announcements',
            'test': 'gym_announcements',
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
    
    @classmethod
    def create_post_reaction_notification(cls, post, user, reaction_type):
        """Specific method for post reaction notifications"""
        if post.user != user:  # Don't notify yourself
            cls.create_notification(
                recipient=post.user,
                notification_type='post_reaction',
                sender=user,
                related_object=post,
                translation_params={
                    'post_id': post.id,
                    'reaction_type': reaction_type,
                    'reaction_emoji': cls.REACTION_EMOJIS.get(reaction_type, '👍'),
                }
            )
    
    @classmethod
    def create_comment_reaction_notification(cls, comment, user, reaction_type):
        """Specific method for comment reaction notifications"""
        if comment.user != user:  # Don't notify yourself
            cls.create_notification(
                recipient=comment.user,
                notification_type='comment_reaction',
                sender=user,
                related_object=comment,
                translation_params={
                    'comment_id': comment.id,
                    'reaction_type': reaction_type,
                    'reaction_emoji': cls.REACTION_EMOJIS.get(reaction_type, '👍'),
                }
            )
    
    @classmethod
    def create_group_workout_message_notification(cls, message, participants):
        """Specific method for group workout message notifications"""
        # Notify all participants except the sender
        for participant in participants:
            if participant.user != message.user:
                cls.create_notification(
                    recipient=participant.user,
                    notification_type='group_workout_message',
                    sender=message.user,
                    related_object=message,
                    priority='normal'
                )