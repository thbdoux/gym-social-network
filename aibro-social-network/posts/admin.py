# posts/admin.py
from django.contrib import admin
from .models import Post, Comment, Like

class CommentInline(admin.TabularInline):
   model = Comment
   extra = 0

class LikeInline(admin.TabularInline):
   model = Like
   extra = 0

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
   list_display = ('user', 'content_preview', 'post_type', 'created_at', 'likes_count', 'comments_count')
   list_filter = ('post_type', 'created_at', 'user')
   search_fields = ('content', 'user__username')
   inlines = [CommentInline, LikeInline]
   
   def content_preview(self, obj):
       return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
   
   def likes_count(self, obj):
       return obj.likes.count()
   
   def comments_count(self, obj):
       return obj.comments.count()
   
   def get_queryset(self, request):
       return super().get_queryset(request).select_related('user', 'workout_log', 'program', 'workout_instance')

