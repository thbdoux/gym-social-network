# workouts/group_workout_serializers.py
from rest_framework import serializers
from .group_workouts import (
    GroupWorkout, 
    GroupWorkoutParticipant, 
    GroupWorkoutJoinRequest, 
    GroupWorkoutMessage
)
from users.serializers import UserSerializer
from gyms.serializers import GymSerializer
from .serializers import WorkoutInstanceSerializer

class GroupWorkoutMessageSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True, fields=['id', 'username', 'avatar'])
    
    class Meta:
        model = GroupWorkoutMessage
        fields = ['id', 'group_workout', 'user', 'user_details', 'content', 'created_at']
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {
            'user': {'write_only': True},
            'group_workout': {'write_only': True}
        }

class GroupWorkoutJoinRequestSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True, fields=['id', 'username', 'avatar'])
    
    class Meta:
        model = GroupWorkoutJoinRequest
        fields = ['id', 'group_workout', 'user', 'user_details', 'status', 'message', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'user': {'write_only': True},
            'group_workout': {'write_only': True}
        }

class GroupWorkoutParticipantSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True, fields=['id', 'username', 'avatar'])
    
    class Meta:
        model = GroupWorkoutParticipant
        fields = ['id', 'group_workout', 'user', 'user_details', 'status', 'joined_at', 'workout_log']
        read_only_fields = ['id', 'joined_at', 'workout_log']
        extra_kwargs = {
            'user': {'write_only': True},
            'group_workout': {'write_only': True}
        }

class GroupWorkoutSerializer(serializers.ModelSerializer):
    participants_count = serializers.SerializerMethodField()
    creator_details = UserSerializer(source='creator', read_only=True, fields=['id', 'username', 'avatar'])
    gym_details = GymSerializer(source='gym', read_only=True)
    workout_template_details = WorkoutInstanceSerializer(source='workout_template', read_only=True)
    is_creator = serializers.SerializerMethodField()
    current_user_status = serializers.SerializerMethodField()
    is_full = serializers.SerializerMethodField()
    
    class Meta:
        model = GroupWorkout
        fields = [
            'id', 'title', 'description', 'creator', 'creator_details', 
            'workout_template', 'workout_template_details',
            'gym', 'gym_details', 'scheduled_time', 'privacy', 
            'status', 'created_at', 'updated_at', 'max_participants',
            'participants_count', 'is_creator', 'current_user_status',
            'is_full', 'is_active'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_active']
    
    def get_participants_count(self, obj):
        return obj.participants.filter(status='joined').count()
    
    def get_is_creator(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.creator_id == request.user.id
        return False
    
    def get_current_user_status(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                participation = obj.participants.get(user=request.user)
                return participation.status
            except GroupWorkoutParticipant.DoesNotExist:
                try:
                    join_request = obj.join_requests.get(user=request.user)
                    return f"request_{join_request.status}"
                except GroupWorkoutJoinRequest.DoesNotExist:
                    return "not_participating"
        return None
    
    def get_is_full(self, obj):
        if obj.max_participants == 0:  # Unlimited
            return False
        return obj.participants.filter(status='joined').count() >= obj.max_participants

class GroupWorkoutDetailSerializer(GroupWorkoutSerializer):
    participants = serializers.SerializerMethodField()
    join_requests = serializers.SerializerMethodField()
    messages = GroupWorkoutMessageSerializer(many=True, read_only=True)
    
    class Meta(GroupWorkoutSerializer.Meta):
        fields = GroupWorkoutSerializer.Meta.fields + ['participants', 'join_requests', 'messages']
    
    def get_participants(self, obj):
        participants = obj.participants.all()
        return GroupWorkoutParticipantSerializer(participants, many=True).data
    
    def get_join_requests(self, obj):
        # Only return join requests if user is the creator
        request = self.context.get('request')
        if request and request.user.is_authenticated and obj.creator_id == request.user.id:
            join_requests = obj.join_requests.filter(status='pending')
            return GroupWorkoutJoinRequestSerializer(join_requests, many=True).data
        return []