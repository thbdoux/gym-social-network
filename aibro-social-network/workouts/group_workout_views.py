# workouts/group_workout_views.py
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Count 
from django.utils import timezone
from django.db.models import Q

from .group_workouts import (
    GroupWorkout, 
    GroupWorkoutParticipant, 
    GroupWorkoutJoinRequest, 
    GroupWorkoutMessage,
    GroupWorkoutVote,
    GroupWorkoutProposal
)
from .group_workout_serializers import (
    GroupWorkoutSerializer,
    GroupWorkoutDetailSerializer,
    GroupWorkoutParticipantSerializer,
    GroupWorkoutJoinRequestSerializer,
    GroupWorkoutMessageSerializer,
    GroupWorkoutProposalSerializer,
    GroupWorkoutVoteSerializer
)
from .models import WorkoutLog
from notifications.services import NotificationService
import logging

logger = logging.getLogger(__name__)

class GroupWorkoutViewSet(viewsets.ModelViewSet):
    """API endpoint for group workouts"""
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['scheduled_time', 'created_at']
    ordering = ['-scheduled_time']
    
    def get_serializer_class(self):
        return GroupWorkoutDetailSerializer
       
    
    def get_queryset(self):
        user = self.request.user
        queryset = GroupWorkout.objects.select_related(
            'creator', 'gym', 'workout_template'
        ).prefetch_related(
            'participants', 'join_requests', 'messages'
        )
        
        # Check if a specific user_id is requested
        user_id = self.request.query_params.get('user_id')
        if user_id:
            try:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                target_user = User.objects.get(id=user_id)
            except (User.DoesNotExist, ValueError):
                # If user doesn't exist or invalid user_id, return empty queryset
                return queryset.none()
        else:
            target_user = user
        
        # Filter by status (active/past)
        status_filter = self.request.query_params.get('status')
        if status_filter == 'active':
            queryset = queryset.filter(
                Q(scheduled_time__gt=timezone.now()) & 
                Q(status='scheduled')
            )
        elif status_filter == 'past':
            queryset = queryset.filter(
                Q(scheduled_time__lt=timezone.now()) | 
                ~Q(status='scheduled')
            )
        
        # Filter by participation
        participation = self.request.query_params.get('participation')
        if participation == 'created':
            # Workouts created by the target user
            queryset = queryset.filter(creator=target_user)
        elif participation == 'joined':
            # Workouts the target user has joined
            queryset = queryset.filter(
                participants__user=target_user,
                participants__status='joined'
            )
        elif participation == 'invited':
            # Workouts the target user has been invited to
            queryset = queryset.filter(
                participants__user=target_user,
                participants__status='invited'
            )
        else:
            # Default behavior depends on whether user_id was specified
            if user_id and target_user != user:
                # If viewing another user's workouts, only show public ones they're part of
                queryset = queryset.filter(
                    Q(privacy='public') & 
                    (Q(creator=target_user) | Q(participants__user=target_user))
                ).distinct()
            else:
                # Default: Show public workouts and those the user is part of
                queryset = queryset.filter(
                    Q(privacy='public') | 
                    Q(creator=user) |
                    Q(participants__user=user)
                ).distinct()
        
        # Filter by gym
        gym_id = self.request.query_params.get('gym_id')
        if gym_id:
            queryset = queryset.filter(gym_id=gym_id)
        
        return queryset
    
    def perform_create(self, serializer):
        with transaction.atomic():
            # Create the group workout
            group_workout = serializer.save(creator=self.request.user)
            
            # Add creator as a participant with 'joined' status
            GroupWorkoutParticipant.objects.create(
                group_workout=group_workout,
                user=self.request.user,
                status='joined',
                joined_at=timezone.now()
            )
    
    @action(detail=True, methods=['post'])
    def invite(self, request, pk=None):
        """Invite users to a group workout"""
        group_workout = self.get_object()
        
        # Only the creator can send invites
        if group_workout.creator != request.user:
            return Response(
                {"detail": "Only the creator can send invites."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get list of user IDs to invite
        user_ids = request.data.get('user_ids', [])
        if not user_ids:
            return Response(
                {"detail": "No users specified for invitation."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create participant records
        from django.contrib.auth import get_user_model
        User = get_user_model()
        users = User.objects.filter(id__in=user_ids)
        
        invited_count = 0
        for user in users:
            # Don't invite users who are already participants
            if not GroupWorkoutParticipant.objects.filter(
                    group_workout=group_workout, user=user).exists():
                
                # Create participant record
                participant = GroupWorkoutParticipant.objects.create(
                    group_workout=group_workout,
                    user=user,
                    status='invited'
                )
                invited_count += 1
                
                # Send notification
                NotificationService.create_notification(
                    recipient=user,
                    notification_type='workout_invitation',
                    sender=request.user,
                    content=f"{request.user.username} invited you to a group workout: {group_workout.title}",
                    related_object=group_workout
                )
        
        return Response({
            "success": True,
            "invited_count": invited_count,
            "message": f"Invited {invited_count} users to the group workout."
        })
    
    # Add this to your GroupWorkoutViewSet in group_workout_views.py

    @action(detail=True, methods=['get'])
    def participants(self, request, pk=None):
        """Get all participants for a group workout with optional status filter"""
        group_workout = self.get_object()
        
        # Check permission (creator or participant)
        is_participant = GroupWorkoutParticipant.objects.filter(
            group_workout=group_workout,
            user=request.user,
            status='joined'
        ).exists()
        
        if not is_participant and request.user != group_workout.creator:
            return Response(
                {"detail": "You must be a participant to view participants."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Optional status filter
        status_filter = request.query_params.get('status')
        participants = group_workout.participants.all()
        
        if status_filter:
            participants = participants.filter(status=status_filter)
        
        serializer = GroupWorkoutParticipantSerializer(participants, many=True)
        return Response(serializer.data)

        
    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        """Join a group workout"""
        group_workout = self.get_object()
        user = request.user
        
        # Check if the workout is active
        if not group_workout.is_active:
            return Response(
                {"detail": "This group workout is no longer active."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if the workout is full
        if group_workout.max_participants > 0:
            current_participants = group_workout.participants.filter(status='joined').count()
            if current_participants >= group_workout.max_participants:
                return Response(
                    {"detail": "This group workout is full."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Check the privacy settings and user's status
        try:
            # If the user is already a participant
            participant = GroupWorkoutParticipant.objects.get(
                group_workout=group_workout, user=user
            )
            
            if participant.status == 'joined':
                return Response(
                    {"detail": "You have already joined this group workout."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if participant.status == 'invited':
                # Update status to joined
                participant.status = 'joined'
                participant.joined_at = timezone.now()
                participant.save()
                
                # Send notification to the creator
                NotificationService.create_notification(
                    recipient=group_workout.creator,
                    notification_type='workout_join',
                    sender=user,
                    content=f"{user.username} accepted your invitation to {group_workout.title}",
                    related_object=group_workout
                )
                
                return Response({"success": True, "message": "You have joined the group workout."})
            
            if participant.status == 'removed':
                return Response(
                    {"detail": "You have been removed from this group workout."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
        except GroupWorkoutParticipant.DoesNotExist:
            # User is not a participant yet
            if group_workout.privacy == 'public':
                # Create participant record
                participant = GroupWorkoutParticipant.objects.create(
                    group_workout=group_workout,
                    user=user,
                    status='joined',
                    joined_at=timezone.now()
                )
                
                # Send notification to the creator
                NotificationService.create_notification(
                    recipient=group_workout.creator,
                    notification_type='workout_join',
                    sender=user,
                    content=f"{user.username} joined your group workout: {group_workout.title}",
                    related_object=group_workout
                )
                
                return Response({"success": True, "message": "You have joined the group workout."})
            
            elif group_workout.privacy == 'upon-request':
                # Check if a request already exists
                existing_request = GroupWorkoutJoinRequest.objects.filter(
                    group_workout=group_workout, user=user
                ).first()
                
                if existing_request and existing_request.status == 'pending':
                    return Response(
                        {"detail": "You have already requested to join this group workout."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                if existing_request and existing_request.status == 'rejected':
                    return Response(
                        {"detail": "Your request to join this group workout was rejected."},
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                # Create a join request
                message = request.data.get('message', '')
                join_request = GroupWorkoutJoinRequest.objects.create(
                    group_workout=group_workout,
                    user=user,
                    message=message,
                    status='pending'
                )
                
                # Send notification to the creator
                NotificationService.create_notification(
                    recipient=group_workout.creator,
                    notification_type='workout_join_request',
                    sender=user,
                    content=f"{user.username} requested to join your group workout: {group_workout.title}",
                    related_object=group_workout
                )
                
                return Response({
                    "success": True, 
                    "message": "Your request to join the group workout has been sent."
                })
            
            elif group_workout.privacy == 'private':
                return Response(
                    {"detail": "This is a private group workout. You need an invitation to join."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
        return Response(
            {"detail": "Unable to process join request."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        """Leave a group workout"""
        group_workout = self.get_object()
        user = request.user
        
        # The creator cannot leave their own workout
        if group_workout.creator == user:
            return Response(
                {"detail": "As the creator, you cannot leave your own group workout. You can cancel it instead."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            participant = GroupWorkoutParticipant.objects.get(
                group_workout=group_workout, user=user
            )
            
            if participant.status != 'joined':
                return Response(
                    {"detail": "You haven't joined this group workout."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update status to declined
            participant.status = 'declined'
            participant.save()
            
            # Send notification to the creator
            NotificationService.create_notification(
                recipient=group_workout.creator,
                notification_type='workout_leave',
                sender=user,
                content=f"{user.username} left your group workout: {group_workout.title}",
                related_object=group_workout
            )
            
            return Response({"success": True, "message": "You have left the group workout."})
            
        except GroupWorkoutParticipant.DoesNotExist:
            return Response(
                {"detail": "You are not part of this group workout."},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a group workout (creator only)"""
        group_workout = self.get_object()
        
        # Only the creator can cancel the workout
        if group_workout.creator != request.user:
            return Response(
                {"detail": "Only the creator can cancel this group workout."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Update status to cancelled
        group_workout.status = 'cancelled'
        group_workout.save()
        
        # Notify all participants
        participants = GroupWorkoutParticipant.objects.filter(
            group_workout=group_workout,
            status__in=['invited', 'joined']
        ).select_related('user')
        
        for participant in participants:
            if participant.user != request.user:  # Don't notify the creator
                NotificationService.create_notification(
                    recipient=participant.user,
                    notification_type='workout_cancelled',
                    sender=request.user,
                    content=f"{request.user.username} cancelled the group workout: {group_workout.title}",
                    related_object=group_workout
                )
        
        return Response({
            "success": True, 
            "message": "The group workout has been cancelled."
        })
    
    @action(detail=True, methods=['post'])
    def respond_to_request(self, request, pk=None):
        """Respond to a join request (creator only)"""
        group_workout = self.get_object()
        
        # Only the creator can respond to requests
        if group_workout.creator != request.user:
            return Response(
                {"detail": "Only the creator can approve or reject join requests."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        request_id = request.data.get('request_id')
        response = request.data.get('response')  # 'approve' or 'reject'
        
        if not request_id or not response:
            return Response(
                {"detail": "Request ID and response are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            join_request = GroupWorkoutJoinRequest.objects.get(
                id=request_id,
                group_workout=group_workout,
                status='pending'
            )
            
            if response == 'approve':
                # Update join request status
                join_request.status = 'approved'
                join_request.save()
                
                # Create or update participant record
                participant, created = GroupWorkoutParticipant.objects.get_or_create(
                    group_workout=group_workout,
                    user=join_request.user,
                    defaults={
                        'status': 'joined',
                        'joined_at': timezone.now()
                    }
                )
                
                if not created:
                    participant.status = 'joined'
                    participant.joined_at = timezone.now()
                    participant.save()
                
                # Send notification
                NotificationService.create_notification(
                    recipient=join_request.user,
                    notification_type='workout_request_approved',
                    sender=request.user,
                    content=f"Your request to join {group_workout.title} has been approved",
                    related_object=group_workout
                )
                
                return Response({
                    "success": True,
                    "message": f"Request from {join_request.user.username} has been approved."
                })
                
            elif response == 'reject':
                # Update join request status
                join_request.status = 'rejected'
                join_request.save()
                
                # Send notification
                NotificationService.create_notification(
                    recipient=join_request.user,
                    notification_type='workout_request_rejected',
                    sender=request.user,
                    content=f"Your request to join {group_workout.title} has been declined",
                    related_object=group_workout
                )
                
                return Response({
                    "success": True,
                    "message": f"Request from {join_request.user.username} has been rejected."
                })
            
            return Response(
                {"detail": "Invalid response. Use 'approve' or 'reject'."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        except GroupWorkoutJoinRequest.DoesNotExist:
            return Response(
                {"detail": "Join request not found."},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def remove_participant(self, request, pk=None):
        """Remove a participant from the group workout (creator only)"""
        group_workout = self.get_object()
        
        # Only the creator can remove participants
        if group_workout.creator != request.user:
            return Response(
                {"detail": "Only the creator can remove participants."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {"detail": "User ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            participant = GroupWorkoutParticipant.objects.get(
                group_workout=group_workout,
                user_id=user_id
            )
            
            # Update status to removed
            participant.status = 'removed'
            participant.save()
            
            # Send notification
            NotificationService.create_notification(
                recipient=participant.user,
                notification_type='workout_removed',
                sender=request.user,
                content=f"You have been removed from the group workout: {group_workout.title}",
                related_object=group_workout
            )
            
            return Response({
                "success": True,
                "message": f"{participant.user.username} has been removed from the group workout."
            })
            
        except GroupWorkoutParticipant.DoesNotExist:
            return Response(
                {"detail": "Participant not found."},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """Send a message in the group workout chat"""
        group_workout = self.get_object()
        user = request.user
        content = request.data.get('content')
        
        if not content:
            return Response(
                {"detail": "Message content is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user is a participant
        is_participant = GroupWorkoutParticipant.objects.filter(
            group_workout=group_workout,
            user=user,
            status='joined'
        ).exists()
        
        if not is_participant and user != group_workout.creator:
            return Response(
                {"detail": "You must be a participant to send messages."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Create message
        message = GroupWorkoutMessage.objects.create(
            group_workout=group_workout,
            user=user,
            content=content
        )
        
        # Return the message
        serializer = GroupWorkoutMessageSerializer(message)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get all messages for a group workout"""
        group_workout = self.get_object()
        user = request.user
        
        # Check if user is a participant or creator
        is_participant = GroupWorkoutParticipant.objects.filter(
            group_workout=group_workout,
            user=user,
            status='joined'
        ).exists()
        
        if not is_participant and user != group_workout.creator:
            return Response(
                {"detail": "You must be a participant to view messages."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get messages with pagination
        messages = group_workout.messages.all()
        page = self.paginate_queryset(messages)
        
        if page is not None:
            serializer = GroupWorkoutMessageSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = GroupWorkoutMessageSerializer(messages, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def join_requests(self, request, pk=None):
        """Get all pending join requests for a group workout (creator only)"""
        group_workout = self.get_object()
        
        # Only the creator can view join requests
        if group_workout.creator != request.user:
            return Response(
                {"detail": "Only the creator can view join requests."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get pending requests
        requests = group_workout.join_requests.filter(status='pending')
        serializer = GroupWorkoutJoinRequestSerializer(requests, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark a group workout as completed and create workout logs for participants"""
        group_workout = self.get_object()
        
        # Only the creator can mark as completed
        if group_workout.creator != request.user:
            return Response(
                {"detail": "Only the creator can mark a group workout as completed."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if the workout is already completed or cancelled
        if group_workout.status in ['completed', 'cancelled']:
            return Response(
                {"detail": f"This group workout is already marked as {group_workout.status}."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Update status to completed
            group_workout.status = 'completed'
            group_workout.save()
            
            # Create workout logs for all participants
            participants = GroupWorkoutParticipant.objects.filter(
                group_workout=group_workout,
                status='joined'
            ).select_related('user')
            
            created_logs = []
            for participant in participants:
                # Create workout log for this participant
                if group_workout.workout_template:
                    workout_log = WorkoutLog.objects.create(
                        user=participant.user,
                        based_on_instance=group_workout.workout_template,
                        program=group_workout.workout_template.program if group_workout.workout_template.program else None,
                        name=group_workout.title,
                        date=group_workout.scheduled_time,
                        gym=group_workout.gym,
                        notes=f"Completed as part of group workout: {group_workout.title}",
                        completed=True
                    )
                    
                    # Update participant record with workout log reference
                    participant.workout_log = workout_log
                    participant.save()
                    
                    created_logs.append({
                        'user': participant.user.username,
                        'workout_log_id': workout_log.id
                    })
                    
                    # Send notification
                    NotificationService.create_notification(
                        recipient=participant.user,
                        notification_type='workout_completed',
                        sender=request.user,
                        content=f"Group workout {group_workout.title} has been marked as completed",
                        related_object=workout_log
                    )
            
            return Response({
                "success": True,
                "message": "Group workout marked as completed and workout logs created.",
                "created_logs": created_logs
            })

    @action(detail=True, methods=['post'])
    def propose(self, request, pk=None):
        """Propose a workout template for a group workout"""
        group_workout = self.get_object()
        user = request.user
        
        # Check if user is a participant or creator
        is_participant = GroupWorkoutParticipant.objects.filter(
            group_workout=group_workout,
            user=user,
            status='joined'
        ).exists()
        
        if not is_participant and user != group_workout.creator:
            return Response(
                {"detail": "You must be a participant to propose workouts."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get the workout template ID
        workout_template_id = request.data.get('workout_template_id')
        if not workout_template_id:
            return Response(
                {"detail": "Workout template ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if template exists
        try:
            from .models import WorkoutTemplate
            workout_template = WorkoutTemplate.objects.get(id=workout_template_id)
        except WorkoutTemplate.DoesNotExist:
            return Response(
                {"detail": "Workout template not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if already proposed
        if GroupWorkoutProposal.objects.filter(
            group_workout=group_workout,
            workout_template=workout_template
        ).exists():
            return Response(
                {"detail": "This workout template has already been proposed."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create proposal
        proposal = GroupWorkoutProposal.objects.create(
            group_workout=group_workout,
            workout_template=workout_template,
            proposed_by=user
        )
        
        # Auto-vote for your own proposal
        GroupWorkoutVote.objects.create(
            proposal=proposal,
            user=user
        )
        
        serializer = GroupWorkoutProposalSerializer(proposal, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def proposals(self, request, pk=None):
        """Get all proposals for a group workout"""
        group_workout = self.get_object()
        
        # Check if user can access
        is_participant = GroupWorkoutParticipant.objects.filter(
            group_workout=group_workout,
            user=request.user,
            status='joined'
        ).exists()
        
        if not is_participant and request.user != group_workout.creator:
            return Response(
                {"detail": "You must be a participant to view proposals."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get proposals with vote counts
        proposals = group_workout.proposals.annotate(
            votes_count=Count('votes')
        ).order_by('-votes_count', 'created_at')
        
        serializer = GroupWorkoutProposalSerializer(proposals, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def vote(self, request, pk=None):
        """Vote for a workout proposal"""
        group_workout = self.get_object()
        user = request.user
        
        # Check if user can vote
        is_participant = GroupWorkoutParticipant.objects.filter(
            group_workout=group_workout,
            user=user,
            status='joined'
        ).exists()
        
        if not is_participant and user != group_workout.creator:
            return Response(
                {"detail": "You must be a participant to vote."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get proposal ID
        proposal_id = request.data.get('proposal_id')
        if not proposal_id:
            return Response(
                {"detail": "Proposal ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if proposal exists
        try:
            proposal = GroupWorkoutProposal.objects.get(
                id=proposal_id,
                group_workout=group_workout
            )
        except GroupWorkoutProposal.DoesNotExist:
            return Response(
                {"detail": "Proposal not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create vote if not already voted
        vote, created = GroupWorkoutVote.objects.get_or_create(
            proposal=proposal,
            user=user
        )
        
        if not created:
            return Response(
                {"detail": "You have already voted for this proposal."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = GroupWorkoutProposalSerializer(proposal, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['delete'])
    def remove_vote(self, request, pk=None):
        """Remove vote from a proposal"""
        group_workout = self.get_object()
        user = request.user
        
        proposal_id = request.data.get('proposal_id')
        if not proposal_id:
            return Response(
                {"detail": "Proposal ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            proposal = GroupWorkoutProposal.objects.get(
                id=proposal_id,
                group_workout=group_workout
            )
        except GroupWorkoutProposal.DoesNotExist:
            return Response(
                {"detail": "Proposal not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Delete vote if exists
        deleted, _ = GroupWorkoutVote.objects.filter(
            proposal=proposal,
            user=user
        ).delete()
        
        if not deleted:
            return Response(
                {"detail": "You haven't voted for this proposal."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = GroupWorkoutProposalSerializer(proposal, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def most_voted_proposal(self, request, pk=None):
        """Get the most voted proposal"""
        group_workout = self.get_object()
        
        most_voted = group_workout.proposals.annotate(
            votes_count=Count('votes')
        ).order_by('-votes_count').first()
        
        if not most_voted:
            return Response(
                {"detail": "No proposals found for this group workout."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = GroupWorkoutProposalSerializer(most_voted, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='user/(?P<user_id>[^/.]+)')
    def user_group_workouts(self, request, user_id=None):
        """Get all group workouts for a specific user"""
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            target_user = User.objects.get(id=user_id)
        except (User.DoesNotExist, ValueError):
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Base queryset
        queryset = GroupWorkout.objects.select_related(
            'creator', 'gym', 'workout_template'
        ).prefetch_related(
            'participants', 'join_requests', 'messages'
        )
        
        # Get participation filter
        participation = request.query_params.get('participation', 'all')
        
        if participation == 'created':
            queryset = queryset.filter(creator=target_user)
        elif participation == 'joined':
            queryset = queryset.filter(
                participants__user=target_user,
                participants__status='joined'
            )
        elif participation == 'invited':
            queryset = queryset.filter(
                participants__user=target_user,
                participants__status='invited'
            )
        else:
            # All workouts user is involved in (created or participating)
            queryset = queryset.filter(
                Q(creator=target_user) | 
                Q(participants__user=target_user)
            ).distinct()
        
        # Apply status filter
        status_filter = request.query_params.get('status')
        if status_filter == 'active':
            queryset = queryset.filter(
                Q(scheduled_time__gt=timezone.now()) & 
                Q(status='scheduled')
            )
        elif status_filter == 'past':
            queryset = queryset.filter(
                Q(scheduled_time__lt=timezone.now()) | 
                ~Q(status='scheduled')
            )
        
        # Apply gym filter
        gym_id = request.query_params.get('gym_id')
        if gym_id:
            queryset = queryset.filter(gym_id=gym_id)
        
        # Order by scheduled time
        queryset = queryset.order_by('-scheduled_time')
        
        # Privacy check: if requesting another user's workouts, filter by visibility
        if target_user != request.user:
            queryset = queryset.filter(
                Q(privacy='public') |
                Q(creator=request.user) |
                Q(participants__user=request.user)
            ).distinct()
        
        # Paginate
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = GroupWorkoutSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = GroupWorkoutSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)