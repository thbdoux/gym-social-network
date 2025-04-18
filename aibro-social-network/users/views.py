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
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.db import transaction
from workouts.models import Program
import logging

from django.utils import timezone
from datetime import timedelta
from .services import send_verification_email

from .throttling import RegistrationRateThrottle
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.conf import settings
import requests
import json
import logging

logger = logging.getLogger(__name__)
User = get_user_model()



# Custom registration view with throttling
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    throttle = RegistrationRateThrottle()
    if not throttle.allow_request(request, None):
        return Response(
            {"detail": "Too many registration attempts. Please try again later."},
            status=status.HTTP_429_TOO_MANY_REQUESTS
        )
    
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        user.is_active = True  # User is active but email not verified
        user.email_verified = True # for development
        user.save()
        
        # Send verification email
        send_verification_email(user)
        
        return Response(
            {"detail": "User registered successfully. Please check your email to verify your account."},
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Email verification view
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def verify_email(request):
    token = request.data.get('token') or request.query_params.get('token')
    email = request.data.get('email') or request.query_params.get('email')
    
    if not token or not email:
        return Response(
            {"detail": "Invalid verification data. Token and email are required."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email=email, verification_token=token)
        
        # Check if token is expired (24 hours)
        if user.verification_token_created < timezone.now() - timedelta(hours=24):
            return Response(
                {"detail": "Verification token has expired. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.email_verified = True
        user.verification_token = None
        user.save()
        
        return Response(
            {"detail": "Email successfully verified. You can now login."},
            status=status.HTTP_200_OK
        )
    except User.DoesNotExist:
        return Response(
            {"detail": "Invalid verification data."},
            status=status.HTTP_400_BAD_REQUEST
        )

# Resend verification email
@api_view(['POST'])
@permission_classes([AllowAny])
def resend_verification(request):
    email = request.data.get('email')
    if not email:
        return Response(
            {"detail": "Email is required."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email=email)
        if user.email_verified:
            return Response(
                {"detail": "Email is already verified."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Send verification email
        send_verification_email(user)
        
        return Response(
            {"detail": "Verification email has been sent."},
            status=status.HTTP_200_OK
        )
    except User.DoesNotExist:
        # For security, don't reveal if email exists
        return Response(
            {"detail": "If this email exists in our system, a verification email has been sent."},
            status=status.HTTP_200_OK
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def social_auth_callback(request):
    """
    Handle social authentication callbacks from mobile app
    Supports Google authentication with ID tokens
    """
    provider = request.data.get('provider')
    token = request.data.get('access_token')
    
    if not provider or not token:
        return Response(
            {"detail": "Provider and access_token are required."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    logger.info(f"Processing social auth for provider: {provider}")
    
    if provider == 'google':
        try:
            # Verify the Google ID token
            user_data = verify_google_token(token)
            
            if not user_data:
                return Response(
                    {"detail": "Invalid Google token."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if email is verified by Google
            if not user_data.get('email_verified', False):
                return Response(
                    {"detail": "Email not verified with Google."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            email = user_data.get('email')
            google_id = user_data.get('sub')  # 'sub' is Google's unique user ID
            
            if not email or not google_id:
                return Response(
                    {"detail": "Email and Google ID are required."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Try to find existing user by email or Google ID
            try:
                # First try to find user by Google ID
                user = User.objects.get(google_id=google_id)
                logger.info(f"Found existing user by Google ID: {user.username}")
            except User.DoesNotExist:
                try:
                    # Then try to find by email
                    user = User.objects.get(email=email)
                    # Update Google ID if not already set
                    if not user.google_id:
                        user.google_id = google_id
                        # Update profile picture if available
                        if user_data.get('picture'):
                            user.profile_picture_url = user_data.get('picture')
                        user.save()
                        logger.info(f"Updated existing user with Google ID: {user.username}")
                except User.DoesNotExist:
                    # Create new user if not found
                    logger.info(f"Creating new user for Google auth: {email}")
                    
                    # Generate a username from the email
                    username = email.split('@')[0]
                    base_username = username
                    counter = 1
                    
                    # Ensure username is unique
                    while User.objects.filter(username=username).exists():
                        username = f"{base_username}{counter}"
                        counter += 1
                    
                    # Create the new user
                    user = User.objects.create_user(
                        username=username,
                        email=email,
                        # Use a secure random password since they'll use Google to sign in
                        password=User.objects.make_random_password(length=32),
                        google_id=google_id,
                        email_verified=True,  # Google already verified the email
                        # Set profile information
                        profile_picture_url=user_data.get('picture'),
                        # Default values for required fields
                        training_level='beginner',
                        personality_type='casual',
                    )
                    
                    # You might want to set a default name for the user
                    first_name = user_data.get('given_name', '')
                    last_name = user_data.get('family_name', '')
                    if first_name:
                        user.first_name = first_name
                        if last_name:
                            user.last_name = last_name
                        user.save()
            
            # Generate JWT tokens for the user
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(user)
            
            # Return tokens and user data
            from .serializers import UserSerializer
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })
            
        except Exception as e:
            logger.exception(f"Error in Google authentication: {e}")
            return Response(
                {"detail": f"Authentication error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # Handle other providers like Instagram in the future
    
    return Response(
        {"detail": f"Provider {provider} not supported."},
        status=status.HTTP_400_BAD_REQUEST
    )

def verify_google_token(token):
    """
    Verify a Google ID token
    There are two ways to verify: using google-auth library (preferred)
    or using Google's tokeninfo endpoint (fallback)
    """
    try:
        # Method 1: Using google-auth library (recommended)
        try:
            # CLIENT_ID should be the web client ID from Google Cloud Console
            client_id = settings.SOCIALACCOUNT_PROVIDERS['google']['APP']['client_id']
            
            # Create a Request object for token verification
            request = google_requests.Request()
            
            # Verify the token
            id_info = id_token.verify_oauth2_token(token, request, client_id)
            
            # Check issuer
            if id_info['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                logger.warning(f"Invalid issuer: {id_info['iss']}")
                return None
            
            logger.info(f"Successfully verified Google token for: {id_info.get('email')}")
            return id_info
            
        except Exception as e:
            logger.warning(f"Failed to verify token using google-auth: {e}")
            # Fall back to Method 2
            
        # Method 2: Using Google's tokeninfo endpoint (fallback)
        response = requests.get(f'https://oauth2.googleapis.com/tokeninfo?id_token={token}')
        
        if response.status_code == 200:
            user_data = response.json()
            logger.info(f"Successfully verified Google token using tokeninfo endpoint")
            return user_data
            
        logger.error(f"Failed to verify Google token: {response.status_code} - {response.text}")
        return None
        
    except Exception as e:
        logger.exception(f"Error verifying Google token: {e}")
        return None

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

    # In users/views.py, add this to the UserViewSet class:

    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Search for users by username or email
        Returns a list of users matching the search query
        """
        query = request.query_params.get('q', '')
        if len(query) < 2:
            return Response(
                {"detail": "Search query must be at least 2 characters"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Exclude the current user from results
        users = User.objects.filter(
            Q(username__icontains=query) | 
            Q(email__icontains=query)
        ).exclude(id=request.user.id)[:10]  # Limit to 10 results
        
        serializer = UserSerializer(users, many=True, fields=['id', 'username', 'avatar'])
        return Response(serializer.data)
    
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


# Add these imports if not present
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_friends_count(request):
    """Get the count of friends for the current user"""
    count = request.user.friends.count()
    return Response({"count": count})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_counts(request):
    """Get all counts in a single request (more efficient)"""
    user = request.user
    
    # Get counts
    friends_count = user.friends.count()
    posts_count = user.posts.count()
    workouts_count = user.workout_logs.count()
    
    return Response({
        "friends_count": friends_count,
        "posts_count": posts_count,
        "workouts_count": workouts_count
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_friends_count(request, user_id):
    """Get the count of friends for a specific user"""
    try:
        user = User.objects.get(id=user_id)
        count = user.friends.count()
        return Response({"count": count})
    except User.DoesNotExist:
        return Response(
            {"detail": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_all_counts(request, user_id):
    """Get all counts for a specific user in a single request"""
    try:
        from posts.models import Post
        from workouts.models import WorkoutLog
        
        user = User.objects.get(id=user_id)
        friends_count = user.friends.count()
        posts_count = Post.objects.filter(user=user).count()
        workouts_count = WorkoutLog.objects.filter(user=user).count()
        
        return Response({
            "friends_count": friends_count,
            "posts_count": posts_count,
            "workouts_count": workouts_count
        })
    except User.DoesNotExist:
        return Response(
            {"detail": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )

# Add this to your views.py file
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_friendship_status(request, user_id):
    """
    Check friendship status between current user and the specified user.
    Returns one of: 'self', 'friends', 'request_sent', 'request_received', 'not_friends'
    """
    try:
        target_user_id = int(user_id)
        current_user = request.user
        
        # Check if it's the same user
        if current_user.id == target_user_id:
            return Response({"status": "self"})
        
        # Get target user
        try:
            target_user = User.objects.get(id=target_user_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if they are friends
        friend_relation = Friendship.objects.filter(
            (Q(from_user=current_user) & Q(to_user=target_user)) |
            (Q(from_user=target_user) & Q(to_user=current_user))
        ).exists()
        
        if friend_relation:
            return Response({"status": "friends"})
            
        # Check for pending friend requests
        sent_request = FriendRequest.objects.filter(
            from_user=current_user,
            to_user=target_user,
            status='pending'
        ).exists()
        
        if sent_request:
            return Response({"status": "request_sent"})
            
        received_request = FriendRequest.objects.filter(
            from_user=target_user,
            to_user=current_user,
            status='pending'
        ).exists()
        
        if received_request:
            return Response({"status": "request_received"})
        
        # No relationship
        return Response({"status": "not_friends"})
        
    except Exception as e:
        logger.exception(f"Error checking friendship status: {str(e)}")
        return Response(
            {"detail": f"Error checking friendship status: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )