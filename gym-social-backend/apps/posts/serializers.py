from rest_framework import serializers
from .models import Post, Comment

class CommentSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField()
    
    class Meta:
        model = Comment
        fields = ['id', 'author', 'content', 'created_at']
        read_only_fields = ['id', 'author', 'created_at']

class PostSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField()
    likes_count = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Post
        fields = ['id', 'author', 'content', 'media', 'created_at', 'likes_count', 'comments']
        read_only_fields = ['id', 'author', 'created_at']
    
    def get_likes_count(self, obj):
        return obj.likes.count()