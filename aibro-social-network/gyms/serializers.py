from rest_framework import serializers
from .models import Gym, GymAnnouncement

class GymAnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = GymAnnouncement
        fields = ['id', 'title', 'content', 'start_date', 'end_date', 'created_at']
        read_only_fields = ['id', 'created_at']

# In gyms/serializers.py
class GymSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()
    active_users_today = serializers.SerializerMethodField()
    description = serializers.CharField(required=False, allow_blank=True)
    amenities = serializers.JSONField(required=False, default=dict)
    equipment = serializers.JSONField(required=False, default=dict)
    opening_hours = serializers.JSONField(required=False, default=dict)
    photos = serializers.JSONField(required=False, default=list)
    
    class Meta:
        model = Gym
        fields = [
            'id', 'name', 'location', 'description',
            'amenities', 'equipment', 'opening_hours', 
            'photos', 'member_count', 'active_users_today',
            # 'announcements', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    def get_member_count(self, obj):
        return getattr(obj, 'member_count', 0)

    def get_active_users_today(self, obj):
        return getattr(obj, 'active_users_today', 0)
    def to_internal_value(self, data):
        # Ensure default values for JSON fields if not provided
        if 'amenities' not in data:
            data['amenities'] = {}
        if 'equipment' not in data:
            data['equipment'] = {}
        if 'opening_hours' not in data:
            data['opening_hours'] = {}
        if 'photos' not in data:
            data['photos'] = []
        return super().to_internal_value(data)