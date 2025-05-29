# posts/admin.py
from django.contrib import admin
from .models import Post, Comment, Like

class CommentInline(admin.TabularInline):
   model = Comment
   extra = 0

class LikeInline(admin.TabularInline):
   model = Like
   extra = 0

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
    list_display = (
        'user', 'content_preview', 'post_type', 'linked_content',
        'created_at', 'likes_count', 'comments_count'
    )
    list_filter = ('post_type', 'created_at', 'user')
    search_fields = ('content', 'user__username')
    inlines = [CommentInline, LikeInline]
    raw_id_fields = ('workout_log', 'program', 'workout_instance')
   
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'
   
    def likes_count(self, obj):
        return obj.likes.count()
    likes_count.short_description = 'Likes'
   
    def comments_count(self, obj):
        return obj.comments.count()
    comments_count.short_description = 'Comments'

    def linked_content(self, obj):
        """Show the linked content based on post type"""
        if obj.post_type == 'workout_log' and obj.workout_log:
            return f'Log: {obj.workout_log.name}'
        elif obj.post_type == 'program' and obj.program:
            return f'Program: {obj.program.name}'
        elif obj.post_type == 'workout_invite' and obj.workout_instance:
            return f'Workout: {obj.workout_instance.name}'
        return '-'
    linked_content.short_description = 'Linked Content'
   
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'user', 'workout_log', 'program', 'workout_instance'
        )