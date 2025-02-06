from rest_framework import serializers
from .models import Gym, GymAnnouncement

class GymAnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = GymAnnouncement
        fields = ['id', 'title', 'content', 'start_date', 'end_date', 'created_at']
        read_only_fields = ['id', 'created_at']

class GymSerializer(serializers.ModelSerializer):
    member_count = serializers.IntegerField(read_only=True)
    active_users_today = serializers.IntegerField(read_only=True)
    announcements = GymAnnouncementSerializer(many=True, read_only=True)
    
    class Meta:
        model = Gym
        fields = [
            'id', 'name', 'location', 'description',
            'amenities', 'equipment', 'opening_hours', 
            'photos', 'member_count', 'active_users_today',
            'announcements', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']