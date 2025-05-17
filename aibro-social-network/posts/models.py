# posts/models.py
from django.db import models

class Post(models.Model):
    POST_TYPES = [
        ('regular', 'Regular Post'),
        ('workout_log', 'Workout Log Share'),
        ('program', 'Program Share'),
        ('workout_invite', 'Workout Invitation'),
        ('group_workout', 'Group Workout Invitation'),
        ('shared', 'Shared Post')
    ]
    
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='posts')
    content = models.TextField(blank=True)
    image = models.ImageField(upload_to='post_images/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    post_type = models.CharField(max_length=20, choices=POST_TYPES, default='regular')
    workout_log = models.ForeignKey('workouts.WorkoutLog', on_delete=models.CASCADE, 
                                  null=True, blank=True, related_name='posts')
    program = models.ForeignKey('workouts.Program', on_delete=models.CASCADE,
                              null=True, blank=True, related_name='posts')
    group_workout = models.ForeignKey('workouts.GroupWorkout', on_delete=models.CASCADE,
                                null=True, blank=True, related_name='posts')
    workout_instance = models.ForeignKey('workouts.WorkoutInstance', on_delete=models.CASCADE,
                                       null=True, blank=True, related_name='invites')
    planned_date = models.DateTimeField(null=True, blank=True)
    invited_users = models.ManyToManyField('users.User', related_name='workout_invites')
    is_share = models.BooleanField(default=False)
    original_post = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE,
        null=True, 
        blank=True,
        related_name='shares'
    )
    share_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username}'s {self.post_type} post - {self.created_at.strftime('%Y-%m-%d %H:%M')}"

class PostReaction(models.Model):
    REACTION_TYPES = [
        ('like', '👍'),
        ('love', '❤️'),
        ('laugh', '😂'),
        ('wow', '😮'),
        ('sad', '😢'),
        ('angry', '😡')
    ]
    
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    reaction_type = models.CharField(max_length=10, choices=REACTION_TYPES, default='like')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['post', 'user']  # One reaction type per user per post

    def __str__(self):
        return f"{self.get_reaction_type_display()} by {self.user.username} on post {self.post.id}"

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # New fields for reply functionality
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    mentioned_users = models.ManyToManyField('users.User', related_name='comment_mentions', blank=True)
    
    class Meta:
        ordering = ['-created_at']  # Changed to show newest first

    def __str__(self):
        return f"Comment by {self.user.username} on {self.post}"

class CommentReaction(models.Model):
    REACTION_TYPES = [
        ('like', '👍'),
        ('love', '❤️'),
        ('laugh', '😂'),
        ('wow', '😮'),
        ('sad', '😢'),
        ('angry', '😡')
    ]
    
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    reaction_type = models.CharField(max_length=10, choices=REACTION_TYPES, default='like')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['comment', 'user']  # One reaction type per user per comment

    def __str__(self):
        return f"{self.get_reaction_type_display()} by {self.user.username} on comment {self.comment.id}"


class Like(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['post', 'user']

    def __str__(self):
        return f"Like by {self.user.username} on {self.post}"