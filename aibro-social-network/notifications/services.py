# notifications/services.py
from django.contrib.contenttypes.models import ContentType
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json

from .models import Notification, NotificationPreference
from .expo_push_notification_service import expo_push_service  # Changed import

class NotificationService:
    @classmethod
    def create_notification(cls, recipient, notification_type, sender=None, content='', related_object=None):
        """
        Create a new notification
        
        Args:
            recipient: User to receive the notification
            notification_type: Type of notification
            sender: User who triggered the notification (optional)
            content: Notification content
            related_object: Related model instance
        """
        content_type = None
        object_id = None
        
        if related_object:
            content_type = ContentType.objects.get_for_model(related_object)
            object_id = related_object.id
        
        notification = Notification.objects.create(
            recipient=recipient,
            sender=sender,
            notification_type=notification_type,
            content=content,
            content_type=content_type,
            object_id=object_id
        )
        
        # Send real-time notification
        cls.send_realtime_notification(notification)
        
        # Send push notification using Expo
        cls.send_push_notification(notification)
        
        # Send email notification if configured
        cls.send_email_notification(notification)
        
        return notification
    
    @classmethod
    def send_realtime_notification(cls, notification):
        """Send real-time notification via WebSocket"""
        channel_layer = get_channel_layer()
        
        # Check if user has push notifications enabled for this type
        pref_field = f"push_{notification.notification_type}"
        try:
            prefs = NotificationPreference.objects.get(user=notification.recipient)
            if not getattr(prefs, pref_field, True):  # Default to True
                return
        except NotificationPreference.DoesNotExist:
            pass  # Use default (enabled)
        
        notification_data = {
            'id': notification.id,
            'type': notification.notification_type,
            'content': notification.content,
            'created_at': notification.created_at.isoformat(),
            'is_read': notification.is_read,
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
        """Send push notification to user's devices using Expo"""
        try:
            # Generate push notification title and body
            title, body = cls.get_push_notification_content(notification)
            
            # Prepare additional data for the notification
            push_data = {
                'notification_id': str(notification.id),
                'notification_type': notification.notification_type,
                'object_id': str(notification.object_id) if notification.object_id else None,
                'sender_id': str(notification.sender.id) if notification.sender else None,
            }
            
            # Send push notification using Expo service
            success = expo_push_service.send_push_notification(
                user=notification.recipient,
                title=title,
                body=body,
                data=push_data,
                notification_type=notification.notification_type
            )
            
            if success:
                print(f"Expo push notification sent successfully for notification {notification.id}")
            else:
                print(f"Failed to send Expo push notification for notification {notification.id}")
                
        except Exception as e:
            print(f"Error sending Expo push notification: {e}")
    
    @classmethod
    def get_push_notification_content(cls, notification):
        """Generate push notification title and body"""
        sender_name = notification.sender.username if notification.sender else "Someone"
        
        # Define title and body based on notification type
        push_content = {
            'like': {
                'title': 'New Like',
                'body': f'{sender_name} liked your post'
            },
            'comment': {
                'title': 'New Comment',
                'body': f'{sender_name} commented on your post'
            },
            'share': {
                'title': 'Post Shared',
                'body': f'{sender_name} shared your post'
            },
            'friend_request': {
                'title': 'Friend Request',
                'body': f'{sender_name} sent you a friend request'
            },
            'friend_accept': {
                'title': 'Friend Request Accepted',
                'body': f'{sender_name} accepted your friend request'
            },
            'program_fork': {
                'title': 'Program Forked',
                'body': f'{sender_name} forked your workout program'
            },
            'workout_milestone': {
                'title': 'Workout Milestone! 🏆',
                'body': notification.content or 'You\'ve reached a new milestone!'
            },
            'goal_achieved': {
                'title': 'Goal Achieved! 🎯',
                'body': notification.content or 'Congratulations on achieving your goal!'
            },
            'mention': {
                'title': 'You were mentioned',
                'body': f'{sender_name} mentioned you in a post'
            },
            'gym_announcement': {
                'title': 'Gym Announcement',
                'body': notification.content or 'New announcement from your gym'
            },
            'workout_invitation': {
                'title': 'Workout Invitation',
                'body': f'{sender_name} invited you to a group workout'
            },
            'workout_join': {
                'title': 'Workout Joined',
                'body': f'{sender_name} joined your group workout'
            },
            'workout_join_request': {
                'title': 'Join Request',
                'body': f'{sender_name} wants to join your workout'
            },
            'workout_request_approved': {
                'title': 'Request Approved',
                'body': f'Your request to join the workout was approved'
            },
            'workout_request_rejected': {
                'title': 'Request Declined',
                'body': f'Your request to join the workout was declined'
            },
            'workout_cancelled': {
                'title': 'Workout Cancelled',
                'body': f'{sender_name} cancelled the group workout'
            },
            'workout_removed': {
                'title': 'Removed from Workout',
                'body': f'You were removed from the group workout'
            },
            'workout_completed': {
                'title': 'Workout Completed! 💪',
                'body': f'{sender_name} completed the group workout'
            },
        }
        
        content = push_content.get(
            notification.notification_type, 
            {
                'title': 'New Notification',
                'body': notification.content or 'You have a new notification'
            }
        )
        
        return content['title'], content['body']
    
    @classmethod
    def send_email_notification(cls, notification):
        """Send email notification if user preferences allow it"""
        from django.core.mail import send_mail
        from django.conf import settings
        
        # Check if user has email notifications enabled for this type
        pref_field = f"email_{notification.notification_type}"
        try:
            prefs = NotificationPreference.objects.get(user=notification.recipient)
            if not getattr(prefs, pref_field, True):
                return
        except NotificationPreference.DoesNotExist:
            pass
        
        # Create email subject and body
        subject = cls.get_email_subject(notification)
        body = cls.get_email_body(notification)
        
        send_mail(
            subject,
            body,
            settings.DEFAULT_FROM_EMAIL,
            [notification.recipient.email],
            fail_silently=True,
        )
    
    @staticmethod
    def get_email_subject(notification):
        """Generate email subject based on notification type"""
        notification_type = notification.notification_type
        sender_name = notification.sender.username if notification.sender else "System"
        
        subjects = {
            'like': f"{sender_name} liked your post",
            'comment': f"{sender_name} commented on your post",
            'share': f"{sender_name} shared your post",
            'friend_request': f"{sender_name} sent you a friend request",
            'friend_accept': f"{sender_name} accepted your friend request",
            'program_fork': f"{sender_name} forked your workout program",
            'workout_milestone': "You've reached a workout milestone!",
            'goal_achieved': "Congratulations! You've achieved a fitness goal",
            'mention': f"{sender_name} mentioned you in a post",
            'gym_announcement': "New announcement from your gym",
            'workout_invitation': f"{sender_name} invited you to a workout",
            'workout_join': f"{sender_name} joined your workout",
            'workout_join_request': f"{sender_name} wants to join your workout",
            'workout_request_approved': "Your workout request was approved",
            'workout_request_rejected': "Your workout request was declined",
            'workout_cancelled': "A workout was cancelled",
            'workout_removed': "You were removed from a workout",
            'workout_completed': "A workout was completed",
        }
        
        return subjects.get(notification_type, "New notification from Dou")
    
    @staticmethod
    def get_email_body(notification):
        """Generate email body based on notification type"""
        return notification.content
        
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