# posts/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from .models import Post, Comment, Like, CommentReaction, PostReaction
from .serializers import PostSerializer, CommentSerializer, PostCreateSerializer, CommentReactionSerializer, PostReactionSerializer
from .permissions import IsAuthorOrReadOnly

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

class CommentViewSet(viewsets.ModelViewSet):
    """ViewSet for Comments CRUD operations"""
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated, IsAuthorOrReadOnly]
    
    def get_permissions(self):
        if self.action in ['react', 'unreact', 'reply']:
            # Only require authentication for these actions
            return [permissions.IsAuthenticated()]
        # Use default permissions for other actions
        return [permissions.IsAuthenticated(), IsAuthorOrReadOnly()]

    def get_queryset(self):
        post_pk = self.kwargs.get('post_pk')
        
        # If this is a detail action (looking up by ID), include replies
        if self.action in ['retrieve', 'update', 'partial_update', 'destroy', 'react', 'unreact']:
            # Include both direct comments and replies
            from django.db.models import Q
            return Comment.objects.filter(
                Q(post_id=post_pk) | Q(parent__post_id=post_pk)
            ).select_related(
                'user', 'post', 'parent'
            ).prefetch_related(
                'reactions', 'replies', 'mentioned_users'
            )
        
        # For list actions, only get top-level comments
        return Comment.objects.filter(
            post_id=post_pk
        ).select_related(
            'user', 'post', 'parent'
        ).prefetch_related(
            'reactions', 'replies', 'mentioned_users'
        ).order_by('-created_at')
    
    def perform_create(self, serializer):
        post_id = self.kwargs.get('post_pk')
        post = Post.objects.get(id=post_id)
        parent_id = self.request.data.get('parent_id')
        
        # If this is a reply, get the parent comment
        parent = None
        if parent_id:
            try:
                parent = Comment.objects.get(id=parent_id)
            except Comment.DoesNotExist:
                pass
        
        serializer.save(user=self.request.user, post=post, parent=parent)
    
    @action(detail=True, methods=['POST'])
    def react(self, request, pk=None, post_pk=None):
        """Add or change a reaction to a comment"""
        comment = self.get_object()
        reaction_type = request.data.get('reaction_type', 'like')
        
        # Validate reaction type
        valid_types = dict(CommentReaction.REACTION_TYPES).keys()
        if reaction_type not in valid_types:
            return Response(
                {"detail": f"Invalid reaction type. Choose from: {', '.join(valid_types)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create or update reaction
        reaction, created = CommentReaction.objects.update_or_create(
            comment=comment,
            user=request.user,
            defaults={'reaction_type': reaction_type}
        )
        
        serializer = CommentReactionSerializer(reaction)
        return Response(serializer.data)
    
    @action(detail=True, methods=['DELETE'])
    def unreact(self, request, pk=None, post_pk=None):
        """Remove a reaction from a comment"""
        comment = self.get_object()
        
        # Delete reaction if exists
        deleted, _ = CommentReaction.objects.filter(
            comment=comment,
            user=request.user
        ).delete()
        
        if deleted:
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(
            {"detail": "Reaction not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    @action(detail=True, methods=['POST'])
    def reply(self, request, pk=None, post_pk=None):
        """Reply to a comment"""
        parent_comment = self.get_object()
        
        # Ensure we're not allowing nested replies (replies to replies)
        if parent_comment.parent is not None:
            return Response(
                {"detail": "Cannot reply to a reply."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            reply = serializer.save(
                user=request.user,
                post_id=post_pk,  # Use post_pk from URL
                parent=parent_comment
            )
            
            return Response(
                CommentSerializer(reply).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PostViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAuthorOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'create':
            return PostCreateSerializer
        return PostSerializer

    def get_queryset(self):
        # Update existing queryset to include shares info
        return Post.objects.filter(
            # Q(user=self.request.user) |
            # Q(user__in=self.request.user.friends.all()) |
            # Q(user__preferred_gym=self.request.user.preferred_gym)
        ).distinct().select_related(
            'user', 'workout_log', 'program', 'group_workout', 'original_post'
        ).prefetch_related(
            'comments', 'comments__replies', 'comments__reactions',
            'comments__user', 'likes', 'shares', 'reactions'
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
        if self.action in ['comment', 'like', 'react', 'unreact']:
            # Only require authentication for commenting, liking, and reacting
            return [permissions.IsAuthenticated()]
        # Use default permissions for other actions
        return [permissions.IsAuthenticated(), IsAuthorOrReadOnly()]

    @action(detail=True, methods=['GET'])
    def likers(self, request, pk=None):
        """Get users who liked the post"""
        post = self.get_object()
        likes = post.likes.all().select_related('user')
        users = [like.user for like in likes]
        
        from users.serializers import UserSerializer
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['GET'])
    def reactions(self, request, pk=None):
        """Get all reactions for a post"""
        post = self.get_object()
        reactions = post.reactions.all().select_related('user')
        
        serializer = PostReactionSerializer(reactions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['POST'])
    def react(self, request, pk=None):
        """Add or change a reaction to a post"""
        post = self.get_object()
        reaction_type = request.data.get('reaction_type', 'like')
        
        # Validate reaction type
        valid_types = dict(PostReaction.REACTION_TYPES).keys()
        if reaction_type not in valid_types:
            return Response(
                {"detail": f"Invalid reaction type. Choose from: {', '.join(valid_types)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create or update reaction
        reaction, created = PostReaction.objects.update_or_create(
            post=post,
            user=request.user,
            defaults={'reaction_type': reaction_type}
        )
        
        # If a like exists, remove it (since we're replacing with reactions)
        Like.objects.filter(post=post, user=request.user).delete()
        
        serializer = PostReactionSerializer(reaction)
        return Response(serializer.data)
    
    @action(detail=True, methods=['DELETE'])
    def unreact(self, request, pk=None):
        """Remove a reaction from a post"""
        post = self.get_object()
        
        # Delete reaction if exists
        deleted, _ = PostReaction.objects.filter(
            post=post,
            user=request.user
        ).delete()
        
        if deleted:
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(
            {"detail": "Reaction not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    @action(detail=True, methods=['post'])
    def comment(self, request, pk=None):
        """Add a comment to the post"""
        post = self.get_object()
        serializer = CommentSerializer(data=request.data)
        
        if serializer.is_valid():
            # Check if this is a reply to another comment
            parent_id = request.data.get('parent_id')
            parent = None
            if parent_id:
                try:
                    parent = Comment.objects.get(id=parent_id, post=post)
                    
                    # Ensure we're not allowing nested replies (replies to replies)
                    if parent.parent is not None:
                        return Response(
                            {"detail": "Cannot reply to a reply."},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                except Comment.DoesNotExist:
                    return Response(
                        {"detail": "Parent comment not found"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            comment = serializer.save(post=post, user=request.user, parent=parent)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['GET'])
    def comments(self, request, pk=None):
        """Get all comments for a post, ordered by newest first"""
        post = self.get_object()
        # Only get top-level comments
        comments = post.comments.filter(parent=None).order_by('-created_at')
        
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)


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
            
            # Make sure the program is public when shared
            if shared_post.program and not shared_post.program.is_public:
                shared_post.program.is_public = True
                shared_post.program.save()
                
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
            # If there's already a reaction, remove it (we're replacing with a like)
            PostReaction.objects.filter(post=post, user=request.user).delete()
            
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
            engagement=Count('likes') + Count('comments') + Count('reactions')
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_posts_count(request):
    """Get the count of posts for the current user"""
    # Use direct query to avoid related_name issues
    from posts.models import Post
    count = Post.objects.filter(
        user=request.user
    ).count()
    print(count)
    return Response({"count": count})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_posts_count(request, user_id):
    """Get the count of posts for a specific user"""
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        user = User.objects.get(id=user_id)
        count = Post.objects.filter(user=user).count()
        return Response({"count": count})
    except User.DoesNotExist:
        return Response(
            {"detail": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )