# posts/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from .models import Post, Comment, Like
from .serializers import PostSerializer, CommentSerializer, PostCreateSerializer
from .permissions import IsAuthorOrReadOnly

class PostViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAuthorOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'create':
            return PostCreateSerializer
        return PostSerializer

    def get_queryset(self):
        # Update existing queryset to include shares info
        return Post.objects.filter(
            Q(user=self.request.user) |
            Q(user__in=self.request.user.friends.all()) |
            Q(user__preferred_gym=self.request.user.preferred_gym)
        ).distinct().select_related(
            'user', 'workout_log', 'program', 'original_post'  # Added program to select_related
        ).prefetch_related(
            'comments', 'likes', 'shares'
        ).order_by('-created_at')

    def create(self, request, *args, **kwargs):
        # Handle program_id from form data 
        program_id = request.data.get('program_id')
        if program_id:
            try:
                # Convert to int if it's a string
                program_id = int(program_id) if isinstance(program_id, str) else program_id
                print(f"Converted program_id: {program_id}, type: {type(program_id)}")
            except (ValueError, TypeError):
                print(f"Error converting program_id: {program_id}")
        
        response = super().create(request, *args, **kwargs)
        
        # Return detailed data after creation
        if response.status_code == 201:
            post_id = response.data.get('id')
            if post_id:
                post = Post.objects.get(id=post_id)
                response.data = PostSerializer(post, context={'request': request}).data
    
        return response

    def update(self, request, *args, **kwargs):
        """Update a post - only allowed for original author"""
        post = self.get_object()
        
        # Extra verification although IsAuthorOrReadOnly should handle this
        if post.user != request.user:
            return Response(
                {"detail": "You do not have permission to modify this post."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Don't allow modification of shared posts' original content
        if post.is_share:
            # Only allow updating the share comment
            if set(request.data.keys()) - {'content'}:
                return Response(
                    {"detail": "Can only modify share comment for shared posts"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Delete a post - only allowed for original author"""
        post = self.get_object()
        
        # Extra verification although IsAuthorOrReadOnly should handle this
        if post.user != request.user:
            return Response(
                {"detail": "You do not have permission to delete this post."},
                status=status.HTTP_403_FORBIDDEN
            )

        # If this is an original post being deleted, we should also delete all shares
        if not post.is_share:
            # Delete all shares of this post
            Post.objects.filter(original_post=post).delete()
            
        return super().destroy(request, *args, **kwargs)

    def get_permissions(self):
        if self.action in ['comment', 'like']:
            # Only require authentication for commenting and liking
            return [permissions.IsAuthenticated()]
        # Use default permissions for other actions
        return [permissions.IsAuthenticated(), IsAuthorOrReadOnly()]

    @action(detail=True, methods=['post'])
    def comment(self, request, pk=None):
        """Add a comment to the post"""
        post = self.get_object()
        serializer = CommentSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(post=post, user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        """Share a post"""
        original_post = self.get_object()
        
        # Prevent sharing of already shared posts
        if original_post.is_share:
            return Response(
                {"detail": "Cannot share a shared post"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create new shared post
        shared_post = Post.objects.create(
            user=request.user,
            content=request.data.get('content', ''),  # Optional share comment
            is_share=True,
            original_post=original_post,
            post_type='shared'
        )

        # Copy relevant fields based on original post type
        if original_post.post_type == 'workout_log':
            shared_post.workout_log = original_post.workout_log
        elif original_post.post_type == 'program':
            shared_post.program = original_post.program
        elif original_post.post_type == 'workout_invite':
            shared_post.workout_instance = original_post.workout_instance
            shared_post.planned_date = original_post.planned_date
            # Copy invited users
            for user in original_post.invited_users.all():
                shared_post.invited_users.add(user)

        # Increment share count on original post
        original_post.share_count += 1
        original_post.save()

        serializer = self.get_serializer(shared_post)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    @action(detail=True, methods=['post', 'delete'])
    def like(self, request, pk=None):
        """Like or unlike the post"""
        post = self.get_object()
        
        if request.method == 'POST':
            like, created = Like.objects.get_or_create(
                post=post,
                user=request.user
            )
            return Response(
                status=status.HTTP_201_CREATED if created 
                else status.HTTP_200_OK
            )
        
        elif request.method == 'DELETE':
            Like.objects.filter(post=post, user=request.user).delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False)
    def trending(self, request):
        """Get trending posts based on likes and comments in the last 7 days"""
        from django.utils import timezone
        from datetime import timedelta
        
        last_week = timezone.now() - timedelta(days=7)
        trending_posts = Post.objects.filter(
            created_at__gte=last_week
        ).annotate(
            engagement=Count('likes') + Count('comments')
        ).order_by('-engagement')[:10]
        
        serializer = self.get_serializer(trending_posts, many=True)
        return Response(serializer.data)
    
    @action(detail=False)
    def feed(self, request):
        """Get user's personalized feed"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        # This is called by create() method
        serializer.save(user=self.request.user)