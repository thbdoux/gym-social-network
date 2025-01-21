from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Post, Comment
from .serializers import PostSerializer, CommentSerializer

class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Get posts from the user and their friends
        return Post.objects.filter(
            author__in=[self.request.user] + list(self.request.user.friends.all())
        ).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        post = self.get_object()
        if request.user in post.likes.all():
            post.likes.remove(request.user)
        else:
            post.likes.add(request.user)
        return Response(status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def comment(self, request, pk=None):
        post = self.get_object()
        serializer = CommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(post=post, author=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
