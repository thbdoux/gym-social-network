# notifications/serializers.py
from rest_framework import serializers
from .models import Notification, NotificationPreference

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