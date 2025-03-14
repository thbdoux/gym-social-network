from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from workouts.models import Program, WorkoutLog
from workouts.serializers import ProgramSerializer, WorkoutLogSerializer
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Q
from users.serializers import UserSerializer, FriendshipSerializer
from posts.models import Post
from posts.serializers import PostSerializer

User = get_user_model()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile_preview(request, user_id):
    """
    Endpoint to get a user's profile data for preview purposes.
    This includes basic user info, their programs, and recent workout logs.
    """
    try:
        target_user = User.objects.get(id=user_id)
        
        # Serialize user data
        user_data = UserSerializer(target_user).data
        
        # Get programs - all public programs or those created by the user
        programs = Program.objects.filter(
            Q(creator=target_user) & (Q(is_public=True) | Q(creator=request.user))
        ).prefetch_related(
            'workout_instances',
            'workout_instances__exercises',
            'workout_instances__exercises__sets',
            'likes'
        ).order_by('-created_at')[:5]  # Limit to 5 recent programs
        
        # Get workout logs - only include those the user has shared (via posts)
        shared_logs = WorkoutLog.objects.filter(
            user=target_user,
            posts__isnull=False  # Only logs that have associated posts (shared)
        ).distinct().order_by('-date')[:5]  # Limit to 5 recent shared logs
        
        # Serialize the data
        programs_data = ProgramSerializer(programs, many=True, context={'request': request}).data
        logs_data = WorkoutLogSerializer(shared_logs, many=True).data
        
        # Put it all together
        response_data = {
            'user': user_data,
            'programs': programs_data,
            'workout_logs': logs_data
        }
        
        return Response(response_data)
        
    except ObjectDoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_friends(request, user_id):
    """
    Get a list of a user's friends for display in the profile preview.
    """
    try:
        target_user = User.objects.get(id=user_id)
        
        # Get user's friendships
        friendships = target_user.friendships_initiated.all()[:10]  # Limit to 10 friends
        
        # Create serialized data
        friends_data = FriendshipSerializer(friendships, many=True).data
        
        return Response(friends_data)
        
    except ObjectDoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_posts(request, user_id):
    """
    Get a user's public posts for display in their profile preview.
    """
    try:
        target_user = User.objects.get(id=user_id)
        
        # Get posts - public posts or visible to the current user
        posts = Post.objects.filter(
            user=target_user
        ).select_related(
            'user', 'workout_log', 'program'
        ).prefetch_related(
            'comments', 'likes'
        ).order_by('-created_at')[:10]  # Limit to 10 most recent posts
        
        # Serialize the data
        posts_data = PostSerializer(posts, many=True, context={'request': request}).data
        
        return Response(posts_data)
        
    except ObjectDoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_program_details(request, program_id):
    """
    Get detailed program data for preview purposes, with appropriate permissions.
    """
    try:
        program = Program.objects.prefetch_related(
            'workout_instances',
            'workout_instances__exercises',
            'workout_instances__exercises__sets'
        ).get(id=program_id)
        
        # Check permissions
        # Allow access if:
        # 1. Program is public OR
        # 2. Current user is the creator OR
        # 3. Program has been shared with the current user
        has_posts = program.posts.exists()
        if (program.is_public or 
            program.creator == request.user or 
            program.shares.filter(shared_with=request.user).exists() or
            has_posts or
            program.creator.current_program_id == program.id):
            
            serializer = ProgramSerializer(program, context={'request': request})
            return Response(serializer.data)
        else:
            return Response({'error': 'You do not have permission to view this program'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
    except ObjectDoesNotExist:
        return Response({'error': 'Program not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_workout_log_details(request, log_id):
    """
    Get detailed workout log data for preview purposes, with appropriate permissions.
    """
    try:
        log = WorkoutLog.objects.prefetch_related(
            'exercises', 'exercises__sets'
        ).get(id=log_id)
        
        # Check permissions
        # Allow access if:
        # 1. Current user is the owner OR
        # 2. Log has been shared in a post
        if log.user == request.user or log.posts.exists():
            serializer = WorkoutLogSerializer(log)
            return Response(serializer.data)
        else:
            return Response({'error': 'You do not have permission to view this workout log'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
    except ObjectDoesNotExist:
        return Response({'error': 'Workout log not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)