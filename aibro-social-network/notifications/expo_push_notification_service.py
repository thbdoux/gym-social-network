# notifications/expo_push_notification_service.py (FIXED VERSION)
from exponent_server_sdk import PushClient, PushMessage, PushServerError, PushTicketError, DeviceNotRegisteredError
from django.conf import settings
from django.utils import timezone
from django.db import IntegrityError
import logging
from typing import List, Dict, Optional
from .models import DeviceToken, NotificationPreference
from .translation_service import translation_service  # Import our translation service

logger = logging.getLogger(__name__)

class ExpoPushNotificationService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        # Initialize Expo push client
        self.push_client = PushClient()

    def register_device_token(self, user, token: str, platform: str, locale: str = 'en') -> bool:
        """Register or update an Expo push token - handles duplicates gracefully"""
        try:
            # Validate Expo push token format
            if not self._is_valid_expo_token(token):
                logger.error(f"Invalid Expo push token format: {token}")
                return False

            # Use get_or_create to handle duplicates gracefully
            device_token, created = DeviceToken.objects.get_or_create(
                token=token,
                defaults={
                    'user': user,
                    'platform': platform,
                    'locale': locale,
                    'is_active': True,
                    'updated_at': timezone.now()
                }
            )
            
            # If token exists but for different user, update it
            if not created:
                if device_token.user != user:
                    device_token.user = user
                device_token.platform = platform
                device_token.locale = locale
                device_token.is_active = True
                device_token.updated_at = timezone.now()
                device_token.save()
                logger.info(f"Expo push token updated for user {user.id}")
            else:
                logger.info(f"Expo push token created for user {user.id}")
            
            return True
            
        except IntegrityError as e:
            # Handle race condition where token was created between get_or_create
            logger.warning(f"Token already exists due to race condition: {e}")
            try:
                device_token = DeviceToken.objects.get(token=token)
                device_token.user = user
                device_token.platform = platform
                device_token.locale = locale
                device_token.is_active = True
                device_token.updated_at = timezone.now()
                device_token.save()
                return True
            except Exception as update_error:
                logger.error(f"Failed to update existing token: {update_error}")
                return False
        except Exception as e:
            logger.error(f"Failed to register Expo push token: {e}")
            return False

    def unregister_device_token(self, user, token: str) -> bool:
        """Unregister an Expo push token"""
        try:
            DeviceToken.objects.filter(user=user, token=token).update(is_active=False)
            logger.info(f"Expo push token unregistered for user {user.id}")
            return True
        except Exception as e:
            logger.error(f"Failed to unregister Expo push token: {e}")
            return False

    def get_user_tokens(self, user) -> List[str]:
        """Get all active Expo push tokens for a user"""
        return list(
            DeviceToken.objects.filter(
                user=user, 
                is_active=True
            ).values_list('token', flat=True)
        )

    def send_push_notification(
        self, 
        user, 
        title: str = None,
        body: str = None,
        title_key: str = None,
        body_key: str = None,
        translation_params: Dict = None,
        data: Optional[Dict] = None,
        notification_type: str = None,
        priority: str = 'normal'
    ) -> bool:
        """Send push notification to user's devices using Expo - FIXED TO TRANSLATE TEXT"""
        try:
            # Check if user has push notifications enabled
            if not self._should_send_push_notification(user, notification_type):
                logger.info(f"Push notifications disabled for user {user.id} or type {notification_type}")
                return False

            # Get user's device tokens
            tokens = self.get_user_tokens(user)
            if not tokens:
                logger.info(f"No Expo push tokens found for user {user.id}")
                return False

            logger.info(f"Sending Expo push notification to {len(tokens)} devices for user {user.id}")

            # FIXED: Translate the notification content based on user's language preference
            if title_key or body_key:
                translated_content = translation_service.translate_notification(
                    user=user,
                    title_key=title_key or f'notifications.{notification_type}.push_title',
                    body_key=body_key or f'notifications.{notification_type}.push_body',
                    params=translation_params or {}
                )
                notification_title = translated_content['title']
                notification_body = translated_content['body']
            else:
                # Use provided title/body or fallback
                notification_title = title or "New Notification"
                notification_body = body or "You have a new notification"

            # Prepare notification data
            notification_data = data or {}
            notification_data.update({
                'notification_type': notification_type or 'general',
                'timestamp': str(timezone.now().isoformat()),
            })

            # Add translation support for frontend
            if title_key:
                notification_data['title_key'] = title_key
            if body_key:
                notification_data['body_key'] = body_key
            if translation_params:
                notification_data['translation_params'] = translation_params

            # Debug log the final notification content
            logger.info(f"📱 Sending notification - Title: '{notification_title}', Body: '{notification_body}'")

            # Create push messages
            messages = []
            for token in tokens:
                # Validate token before sending
                if not self._is_valid_expo_token(token):
                    logger.warning(f"Invalid Expo token format, skipping: {token}")
                    continue

                message = PushMessage(
                    to=token,
                    title=notification_title,  # Now contains actual translated text!
                    body=notification_body,    # Now contains actual translated text!
                    data=notification_data,
                    sound='default',
                    badge=1,
                    channel_id='default',  # For Android
                    priority='high' if priority in ['high', 'urgent'] else 'normal'
                )
                messages.append(message)

            if not messages:
                logger.warning(f"No valid Expo tokens for user {user.id}")
                return False

            # Send notifications
            success_count = 0
            try:
                # Send messages in chunks to avoid rate limits
                chunk_size = 100  # Expo recommends max 100 messages per request
                for i in range(0, len(messages), chunk_size):
                    chunk = messages[i:i + chunk_size]
                    tickets = self.push_client.publish_multiple(chunk)
                    
                    # Process tickets and handle errors
                    for j, ticket in enumerate(tickets):
                        token = chunk[j].to
                        if ticket.status == 'ok':
                            success_count += 1
                            logger.debug(f"Successfully sent to token: {token}")
                        else:
                            logger.error(f"Failed to send to token {token}: {ticket.message}")
                            # Handle specific errors
                            if ticket.details and ticket.details.get('error') == 'DeviceNotRegistered':
                                self._handle_invalid_token(user, token)

            except PushServerError as e:
                logger.error(f"Expo push server error: {e}")
                return False
            except Exception as e:
                logger.error(f"Unexpected error sending Expo notifications: {e}")
                return False

            logger.info(f"Successfully sent Expo notification to {success_count}/{len(messages)} devices")
            return success_count > 0

        except Exception as e:
            logger.error(f"Failed to send Expo push notification: {e}")
            return False

    def send_bulk_notification(
        self, 
        users: List, 
        title: str = None, 
        body: str = None,
        title_key: str = None,
        body_key: str = None,
        translation_params: Dict = None,
        data: Optional[Dict] = None,
        notification_type: str = None
    ) -> Dict[str, int]:
        """Send push notification to multiple users"""
        success_count = 0
        failure_count = 0
        
        for user in users:
            if self.send_push_notification(
                user=user, 
                title=title, 
                body=body,
                title_key=title_key,
                body_key=body_key,
                translation_params=translation_params,
                data=data, 
                notification_type=notification_type
            ):
                success_count += 1
            else:
                failure_count += 1
        
        return {
            'success_count': success_count,
            'failure_count': failure_count,
            'total': len(users)
        }

    def _is_valid_expo_token(self, token: str) -> bool:
        """Validate Expo push token format"""
        if not token:
            return False
        
        # Expo push tokens start with ExponentPushToken[...] or ExpoPushToken[...]
        return token.startswith(('ExponentPushToken[', 'ExpoPushToken[')) and token.endswith(']')

    def _handle_invalid_token(self, user, token: str):
        """Handle invalid/unregistered tokens"""
        logger.warning(f"Marking token as inactive due to DeviceNotRegistered: {token}")
        DeviceToken.objects.filter(user=user, token=token).update(is_active=False)

    def _should_send_push_notification(self, user, notification_type: str) -> bool:
        """Check if push notification should be sent based on user preferences"""
        try:
            prefs = NotificationPreference.objects.get(user=user)
            
            # Check global push notification setting
            if not getattr(prefs, 'push_notifications_enabled', True):
                return False
            
            # Check specific notification type preference
            if notification_type:
                pref_field = f"push_{notification_type}"
                return getattr(prefs, pref_field, True)
            
            return True
        except NotificationPreference.DoesNotExist:
            # Default to enabled if no preferences set
            return True

    def send_test_notification(self, user) -> bool:
        """Send a test notification - FIXED to use translation"""
        return self.send_push_notification(
            user=user,
            title_key="notifications.test.push_title",
            body_key="notifications.test.push_body",
            translation_params={},
            data={'test': 'true'},
            notification_type='test'
        )

# Singleton instance
expo_push_service = ExpoPushNotificationService()