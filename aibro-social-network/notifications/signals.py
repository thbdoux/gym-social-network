# notifications/signals.py
from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver

from posts.models import Like, Comment, Post
from users.models import FriendRequest, Friendship
from workouts.models import Program, WorkoutLog
from .services import NotificationService

# Post likes
@receiver(post_save, sender=Like)
def handle_post_like(sender, instance, created, **kwargs):
    if created and instance.post.user != instance.user:  # Don't notify self-likes
        NotificationService.create_notification(
            recipient=instance.post.user,
            notification_type='like',
            sender=instance.user,
            content=f"{instance.user.username} liked your post",
            related_object=instance.post
        )

# Post comments
@receiver(post_save, sender=Comment)
def handle_post_comment(sender, instance, created, **kwargs):
    if created and instance.post.user != instance.user:
        NotificationService.create_notification(
            recipient=instance.post.user,
            notification_type='comment',
            sender=instance.user,
            content=f"{instance.user.username} commented on your post: '{instance.content[:50]}...'",
            related_object=instance.post
        )

# Post shares
@receiver(post_save, sender=Post)
def handle_post_share(sender, instance, created, **kwargs):
    if created and instance.is_share and instance.original_post:
        original_post = instance.original_post
        if original_post.user != instance.user:
            NotificationService.create_notification(
                recipient=original_post.user,
                notification_type='share',
                sender=instance.user,
                content=f"{instance.user.username} shared your post",
                related_object=original_post
            )

# Friend requests
@receiver(post_save, sender=FriendRequest)
def handle_friend_request(sender, instance, created, **kwargs):
    if created:
        NotificationService.create_notification(
            recipient=instance.to_user,
            notification_type='friend_request',
            sender=instance.from_user,
            content=f"{instance.from_user.username} sent you a friend request",
            related_object=instance
        )
    elif instance.status == 'accepted':
        NotificationService.create_notification(
            recipient=instance.from_user,
            notification_type='friend_accept',
            sender=instance.to_user,
            content=f"{instance.to_user.username} accepted your friend request",
            related_object=instance
        )

# Program forks
@receiver(post_save, sender=Program)
def handle_program_fork(sender, instance, created, **kwargs):
    if created and instance.forked_from:
        NotificationService.create_notification(
            recipient=instance.forked_from.creator,
            notification_type='program_fork',
            sender=instance.creator,
            content=f"{instance.creator.username} forked your program '{instance.forked_from.name}'",
            related_object=instance
        )

# Workout milestones
@receiver(post_save, sender=WorkoutLog)
def handle_workout_milestone(sender, instance, created, **kwargs):
    if created:
        user = instance.user
        workout_count = WorkoutLog.objects.filter(user=user).count()
        
        # Milestone notifications (10th, 50th, 100th workout)
        milestones = [10, 50, 100, 200, 500, 1000]
        
        if workout_count in milestones:
            NotificationService.create_notification(
                recipient=user,
                notification_type='workout_milestone',
                content=f"Congratulations! You've completed your {workout_count}th workout",
                related_object=instance
            )