# notifications/serializers.py
from rest_framework import serializers
from .models import Notification, NotificationPreference, DeviceToken

class NotificationSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    sender_avatar = serializers.ImageField(source='sender.avatar', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'sender', 'sender_username', 'sender_avatar',
            'notification_type', 'content', 'content_type', 'object_id',
            'is_read', 'is_seen', 'created_at'
        ]
        read_only_fields = fields

class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        exclude = ['user']

class DeviceTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceToken
        fields = ['token', 'platform']
    
    def validate_token(self, value):
        """Validate Expo push token format"""
        if not value.startswith(('ExponentPushToken[', 'ExpoPushToken[')) or not value.endswith(']'):
            raise serializers.ValidationError(
                "Invalid Expo push token format. Token should start with 'ExponentPushToken[' or 'ExpoPushToken[' and end with ']'"
            )
        return value
    
    def create(self, validated_data):
        from .expo_push_notification_service import expo_push_service  # Changed import
        
        user = self.context['request'].user
        token = validated_data['token']
        platform = validated_data['platform']
        
        # Register the Expo push token
        success = expo_push_service.register_device_token(user, token, platform)
        
        if success:
            # Return the created/updated device token
            device_token = DeviceToken.objects.get(user=user, token=token)
            return device_token
        else:
            raise serializers.ValidationError("Failed to register Expo push token")