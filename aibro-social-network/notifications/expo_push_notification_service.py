# notifications/expo_push_notification_service.py (FIXED VERSION)
from exponent_server_sdk import PushClient, PushMessage, PushServerError, PushTicketError, DeviceNotRegisteredError
from django.conf import settings
from django.utils import timezone
from django.db import IntegrityError
import logging
from typing import List, Dict, Optional
from .models import DeviceToken, NotificationPreference

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

    def register_device_token(self, user, token: str, platform: str) -> bool:
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
                    'is_active': True,
                    'updated_at': timezone.now()
                }
            )
            
            # If token exists but for different user, update it
            if not created:
                if device_token.user != user:
                    device_token.user = user
                device_token.platform = platform
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
        title: str, 
        body: str, 
        data: Optional[Dict] = None,
        notification_type: str = None
    ) -> bool:
        """Send push notification to user's devices using Expo"""
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

            # Prepare notification data
            notification_data = data or {}
            notification_data.update({
                'notification_type': notification_type or 'general',
                'timestamp': str(timezone.now().isoformat()),
            })

            # Create push messages
            messages = []
            for token in tokens:
                # Validate token before sending
                if not self._is_valid_expo_token(token):
                    logger.warning(f"Invalid Expo token format, skipping: {token}")
                    continue

                message = PushMessage(
                    to=token,
                    title=title,
                    body=body,
                    data=notification_data,
                    sound='default',
                    badge=1,
                    channel_id='default'  # For Android
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
        title: str, 
        body: str, 
        data: Optional[Dict] = None,
        notification_type: str = None
    ) -> Dict[str, int]:
        """Send push notification to multiple users"""
        success_count = 0
        failure_count = 0
        
        for user in users:
            if self.send_push_notification(user, title, body, data, notification_type):
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
        """Send a test notification"""
        return self.send_push_notification(
            user=user,
            title="Test Notification",
            body="This is a test push notification from your app!",
            data={'test': 'true'},
            notification_type='test'
        )

# Singleton instance
expo_push_service = ExpoPushNotificationService()