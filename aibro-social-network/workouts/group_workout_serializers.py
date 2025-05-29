# workouts/group_workout_serializers.py
from rest_framework import serializers
from django.db.models import Count

from .group_workouts import (
    GroupWorkout, 
    GroupWorkoutParticipant, 
    GroupWorkoutJoinRequest, 
    GroupWorkoutMessage,
    GroupWorkoutProposal,
    GroupWorkoutVote,
)
from users.serializers import UserSerializer
from gyms.serializers import GymSerializer
from .serializers import WorkoutTemplateSerializer

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
    workout_template_details = WorkoutTemplateSerializer(source='workout_template', read_only=True)
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
    most_voted_proposal = serializers.SerializerMethodField()
    
    class Meta(GroupWorkoutSerializer.Meta):
        fields = GroupWorkoutSerializer.Meta.fields + ['participants', 'join_requests', 'messages','most_voted_proposal']
    
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
    
    def get_most_voted_proposal(self, obj):
        most_voted = obj.proposals.annotate(
            votes_count=Count('votes')
        ).order_by('-votes_count').first()
        
        if most_voted:
            return GroupWorkoutProposalSerializer(most_voted, context=self.context).data
        return None

class GroupWorkoutProposalSerializer(serializers.ModelSerializer):
    workout_template_details = WorkoutTemplateSerializer(source='workout_template', read_only=True)
    proposed_by_details = UserSerializer(source='proposed_by', read_only=True, fields=['id', 'username', 'avatar'])
    vote_count = serializers.SerializerMethodField()
    has_voted = serializers.SerializerMethodField()
    
    class Meta:
        model = GroupWorkoutProposal
        fields = [
            'id', 'group_workout', 'workout_template', 'workout_template_details',
            'proposed_by', 'proposed_by_details', 'created_at', 'vote_count', 'has_voted'
        ]
        read_only_fields = ['id', 'created_at', 'vote_count']
        extra_kwargs = {
            'proposed_by': {'write_only': True},
            'group_workout': {'write_only': True},
        }
    
    def get_vote_count(self, obj):
        return obj.votes.count()
    
    def get_has_voted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.votes.filter(user=request.user).exists()
        return False

class GroupWorkoutVoteSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True, fields=['id', 'username', 'avatar'])
    
    class Meta:
        model = GroupWorkoutVote
        fields = ['id', 'proposal', 'user', 'user_details', 'created_at']
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {
            'user': {'write_only': True},
        }