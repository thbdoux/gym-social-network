# users/views.py
from rest_framework import viewsets, status, permissions, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView

from .models import User, Friendship, FriendRequest
from .serializers import (UserSerializer, FriendshipSerializer,
                        FriendRequestSerializer)
                        
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.db import transaction
from workouts.models import Program
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

# Add this at the appropriate location in views.py

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_language_preference(request):
    """
    Update the user's language preference
    """
    try:
        language = request.data.get('language')
        if not language or language not in dict(User.LANGUAGE_CHOICES):
            return Response(
                {"detail": "Invalid language code. Choose from: " + 
                          ", ".join([code for code, _ in User.LANGUAGE_CHOICES])},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = request.user
        user.language_preference = language
        user.save()
        
        return Response({
            "success": True,
            "message": "Language preference updated",
            "language": language
        })
        
    except Exception as e:
        logger.exception(f"Error updating language preference: {str(e)}")
        return Response(
            {"detail": f"Error updating language preference: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reset_user_current_program(request, user_id):
    """
    Reset a user's current_program to null when the program is no longer valid.
    This handles the case where the frontend detects a program referenced by a user
    that no longer exists or is not accessible.
    """
    try:
        # Check if the requesting user has permission to modify this user
        # Only allow a user to modify their own record or admins can modify any
        target_user = User.objects.get(id=user_id)
        if int(user_id) != request.user.id and not request.user.is_staff:
            return Response(
                {"detail": "You don't have permission to modify this user's program"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Log the current state for debugging
        logger.info(f"Resetting current program for user {user_id}. Current program ID: {target_user.current_program_id}")
        
        with transaction.atomic():
            # Check if the user has a current program set
            if target_user.current_program_id:
                program_id = target_user.current_program_id
                
                # Try to find the program
                try:
                    program = Program.objects.get(id=program_id)
                    # If program exists, just deactivate it
                    program.is_active = False
                    program.save()
                    logger.info(f"Found program {program_id}, deactivated it")
                except Program.DoesNotExist:
                    logger.warning(f"Program {program_id} not found - it may have been deleted")
                
                # Reset the user's current program
                target_user.current_program = None
                target_user.save()
                
                return Response({
                    "success": True,
                    "message": f"Reset current program for user {target_user.username}",
                    "previous_program_id": program_id
                })
            else:
                return Response({
                    "success": True, 
                    "message": f"User {target_user.username} did not have a current program set"
                })
    
    except User.DoesNotExist:
        return Response(
            {"detail": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.exception(f"Error resetting current program: {str(e)}")
        return Response(
            {"detail": f"Error resetting current program: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    
    def get_permissions(self):
        """Allow registration without authentication"""
        if self.action == 'create':  # registration
            return []
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        return User.objects.all()
    
    def create(self, request, *args, **kwargs):
        """Handle user registration"""
        print("Received data:", request.data)  # Debug print
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("Validation errors:", serializer.errors)  # Debug print
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user = serializer.save()
        return Response({
            'id': user.id,
            'username': user.username,
            'message': 'User created successfully'
        }, status=status.HTTP_201_CREATED)
        
    def get_queryset(self):
        return User.objects.all()
    
    @action(detail=True, methods=['post'])
    def send_friend_request(self, request, pk=None):
        to_user = self.get_object()
        from_user = request.user
        
        if to_user == from_user:
            return Response(
                {"detail": "Cannot send friend request to yourself"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        request, created = FriendRequest.objects.get_or_create(
            from_user=from_user,
            to_user=to_user,
            defaults={'status': 'pending'}
        )
        
        serializer = FriendRequestSerializer(request)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def respond_to_request(self, request, pk=None):
        friend_request = get_object_or_404(
            FriendRequest,
            to_user=request.user,
            from_user=self.get_object(),
            status='pending'
        )
        
        response = request.data.get('response')
        if response == 'accept':
            friend_request.status = 'accepted'
            friend_request.save()
            
            # Create friendship
            Friendship.objects.create(
                from_user=friend_request.from_user,
                to_user=friend_request.to_user
            )
            Friendship.objects.create(
                from_user=friend_request.to_user,
                to_user=friend_request.from_user
            )
        elif response == 'reject':
            friend_request.status = 'rejected'
            friend_request.save()
        
        return Response({'status': friend_request.status})
    
    @action(detail=False, methods=['get'])
    def friends(self, request):
        friendships = Friendship.objects.filter(
            from_user=request.user
        ).select_related('to_user')
        serializer = FriendshipSerializer(friendships, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def friend_requests(self, request):
        requests = FriendRequest.objects.filter(
            Q(to_user=request.user) | Q(from_user=request.user)
        ).select_related('from_user', 'to_user')
        serializer = FriendRequestSerializer(requests, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def remove_friend(self, request, pk=None):
        friend = self.get_object()
        Friendship.objects.filter(
            Q(from_user=request.user, to_user=friend) |
            Q(from_user=friend, to_user=request.user)
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser)
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)