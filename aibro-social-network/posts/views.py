# posts/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from .models import Post, Comment, Like
from .serializers import PostSerializer, CommentSerializer
from .permissions import IsAuthorOrReadOnly

class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated, IsAuthorOrReadOnly]

    def get_queryset(self):
        # Instead of using union, we'll use Q objects to combine the conditions
        return Post.objects.filter(
            Q(user=self.request.user) |  # User's own posts
            Q(user__in=self.request.user.friends.all()) |  # Friends' posts
            Q(user__gym=self.request.user.gym)  # Posts from gym members
        ).distinct().select_related(
            'user', 'workout_log'
        ).prefetch_related(
            'comments', 'likes'
        ).order_by('-created_at')

    # def get_queryset(self):
    #     # Get posts from current user and their friends
    #     return Post.objects.filter(
    #         Q(user=self.request.user) | Q(user__in=self.request.user.friends.all())
    #     ).select_related('user', 'workout_log').prefetch_related('comments', 'likes')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def comment(self, request, pk=None):
        """Add a comment to the post"""
        post = self.get_object()
        serializer = CommentSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(post=post, user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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

    # @action(detail=False)
    # def feed(self, request):
    #     """Get user's personalized feed"""
    #     # Get posts from friends
    #     friend_posts = Post.objects.filter(
    #         user__in=request.user.friends.all()
    #     )
    #     # Get posts from users in the same gym
    #     gym_posts = Post.objects.filter(
    #         user__gym=request.user.gym
    #     ).exclude(user=request.user)
        
    #     # Combine and order by date
    #     feed_posts = friend_posts.union(gym_posts).order_by('-created_at')
    #     serializer = self.get_serializer(feed_posts, many=True)
    #     return Response(serializer.data)

    
    @action(detail=False)
    def feed(self, request):
        """Get user's personalized feed"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)