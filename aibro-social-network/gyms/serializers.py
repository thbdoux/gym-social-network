from rest_framework import serializers
from .models import Gym

class GymSerializer(serializers.ModelSerializer):
    member_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Gym
        fields = [
            'id', 'name', 'location', 'description',
            'amenities', 'member_count', 'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']