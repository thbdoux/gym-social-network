# notifications/signals.py (ENHANCED)
from django.db.models.signals import post_save, m2m_changed, pre_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta

from posts.models import Like, Comment, Post, PostReaction, CommentReaction
from users.models import FriendRequest, Friendship
from workouts.models import Program, WorkoutLog, ProgramShare
from workouts.group_workouts import (
    GroupWorkout, GroupWorkoutParticipant, GroupWorkoutJoinRequest,
    GroupWorkoutProposal, GroupWorkoutVote, GroupWorkoutMessage
)
from .services import NotificationService

# =============================================================================
# POST INTERACTIONS
# =============================================================================

@receiver(post_save, sender=Like)
def handle_post_like(sender, instance, created, **kwargs):
    """Handle post likes"""
    if created and instance.post.user != instance.user:
        NotificationService.create_notification(
            recipient=instance.post.user,
            notification_type='like',
            sender=instance.user,
            related_object=instance.post,
            translation_params={
                'post_id': instance.post.id,
            }
        )

@receiver(post_save, sender=PostReaction)
def handle_post_reaction(sender, instance, created, **kwargs):
    """Handle post reactions (beyond just likes)"""
    if created and instance.post.user != instance.user:
        NotificationService.create_post_reaction_notification(
            post=instance.post,
            user=instance.user,
            reaction_type=instance.reaction_type
        )

@receiver(post_save, sender=CommentReaction)
def handle_comment_reaction(sender, instance, created, **kwargs):
    """Handle comment reactions"""
    if created and instance.comment.user != instance.user:
        NotificationService.create_comment_reaction_notification(
            comment=instance.comment,
            user=instance.user,
            reaction_type=instance.reaction_type
        )

@receiver(post_save, sender=Comment)
def handle_post_comment(sender, instance, created, **kwargs):
    """Handle post comments and replies"""
    if created:
        # Check if this is a reply to another comment
        if instance.parent:
            # This is a reply - notify the parent comment author
            if instance.parent.user != instance.user:
                NotificationService.create_notification(
                    recipient=instance.parent.user,
                    notification_type='comment_reply',
                    sender=instance.user,
                    related_object=instance,
                    translation_params={
                        'comment_id': instance.parent.id,
                        'reply_content': instance.content[:100] + '...' if len(instance.content) > 100 else instance.content,
                    }
                )
        else:
            # This is a top-level comment - notify the post author
            if instance.post.user != instance.user:
                NotificationService.create_notification(
                    recipient=instance.post.user,
                    notification_type='comment',
                    sender=instance.user,
                    related_object=instance,
                    translation_params={
                        'post_id': instance.post.id,
                        'comment_content': instance.content[:100] + '...' if len(instance.content) > 100 else instance.content,
                    }
                )
        
        # Handle mentions in comments
        content = instance.content
        mentioned_usernames = [word[1:] for word in content.split() if word.startswith('@')]
        
        if mentioned_usernames:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            for username in mentioned_usernames:
                try:
                    mentioned_user = User.objects.get(username=username)
                    if mentioned_user != instance.user:  # Don't notify yourself
                        NotificationService.create_notification(
                            recipient=mentioned_user,
                            notification_type='mention',
                            sender=instance.user,
                            related_object=instance,
                            translation_params={
                                'comment_content': content[:100] + '...' if len(content) > 100 else content,
                            }
                        )
                except User.DoesNotExist:
                    continue

@receiver(post_save, sender=Post)
def handle_post_share(sender, instance, created, **kwargs):
    """Handle post shares"""
    if created and instance.is_share and instance.original_post:
        original_post = instance.original_post
        if original_post.user != instance.user:
            NotificationService.create_notification(
                recipient=original_post.user,
                notification_type='share',
                sender=instance.user,
                related_object=original_post,
                translation_params={
                    'post_id': original_post.id,
                }
            )

# =============================================================================
# FRIEND INTERACTIONS
# =============================================================================

@receiver(post_save, sender=FriendRequest)
def handle_friend_request(sender, instance, created, **kwargs):
    """Handle friend requests"""
    if created:
        NotificationService.create_notification(
            recipient=instance.to_user,
            notification_type='friend_request',
            sender=instance.from_user,
            related_object=instance
        )
    elif instance.status == 'accepted':
        NotificationService.create_notification(
            recipient=instance.from_user,
            notification_type='friend_accept',
            sender=instance.to_user,
            related_object=instance
        )

# =============================================================================
# PROGRAM INTERACTIONS
# =============================================================================

@receiver(post_save, sender=Program)
def handle_program_fork(sender, instance, created, **kwargs):
    """Handle program forks"""
    if created and instance.forked_from:
        NotificationService.create_notification(
            recipient=instance.forked_from.creator,
            notification_type='program_fork',
            sender=instance.creator,
            related_object=instance,
            translation_params={
                'forked_program_name': instance.name,
                'original_program_name': instance.forked_from.name,
            }
        )

@receiver(post_save, sender=ProgramShare)
def handle_program_share(sender, instance, created, **kwargs):
    """Handle program shares"""
    if created:
        NotificationService.create_notification(
            recipient=instance.shared_with,
            notification_type='program_shared',
            sender=instance.program.creator,
            related_object=instance.program,
            translation_params={
                'program_name': instance.program.name,
            }
        )

@receiver(m2m_changed, sender=Program.likes.through)
def handle_program_like(sender, instance, action, pk_set, **kwargs):
    """Handle program likes"""
    if action == 'post_add' and pk_set:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        for user_id in pk_set:
            try:
                liker = User.objects.get(id=user_id)
                if liker != instance.creator:
                    NotificationService.create_notification(
                        recipient=instance.creator,
                        notification_type='program_liked',
                        sender=liker,
                        related_object=instance,
                        translation_params={
                            'program_name': instance.name,
                        }
                    )
            except User.DoesNotExist:
                continue

@receiver(post_save, sender=WorkoutLog)
def handle_workout_log_creation(sender, instance, created, **kwargs):
    """Handle various workout log related notifications"""
    if not created:
        return
    
    user = instance.user
    
    # 1. Workout milestone notifications
    workout_count = WorkoutLog.objects.filter(user=user).count()
    milestones = [10, 25, 50, 100, 200, 500, 1000]
    
    if workout_count in milestones:
        NotificationService.create_notification(
            recipient=user,
            notification_type='workout_milestone',
            related_object=instance,
            translation_params={
                'workout_count': workout_count,
                'milestone': workout_count,
            }
        )
    
    # 2. Program usage notification (notify program creator when someone uses their program)
    if instance.program and instance.program.creator != user:
        NotificationService.create_notification(
            recipient=instance.program.creator,
            notification_type='program_used',
            sender=user,
            related_object=instance.program,
            translation_params={
                'program_name': instance.program.name,
                'workout_name': instance.name,
            }
        )
    
    # 3. Template usage notification (notify template creator when someone uses their template)
    if instance.based_on_instance and hasattr(instance.based_on_instance, 'based_on_template'):
        template = instance.based_on_instance.based_on_template
        if template and template.creator != user:
            NotificationService.create_notification(
                recipient=template.creator,
                notification_type='template_used',
                sender=user,
                related_object=template,
                translation_params={
                    'template_name': template.name,
                    'workout_name': instance.name,
                }
            )
    
    # 4. Workout partner notifications
    for partner in instance.workout_partners.all():
        if partner != user:
            NotificationService.create_notification(
                recipient=partner,
                notification_type='workout_partner_added',
                sender=user,
                related_object=instance,
                translation_params={
                    'workout_name': instance.name,
                    'workout_date': instance.date.isoformat(),
                }
            )
    
    # 5. Streak milestone detection
    _check_workout_streak(user, instance)
    
    # 6. Personal record detection
    _check_personal_records(user, instance)

def _check_workout_streak(user, workout_log):
    """Check for workout streak milestones"""
    # Get workout logs from the last 30 days
    thirty_days_ago = timezone.now() - timedelta(days=30)
    recent_logs = WorkoutLog.objects.filter(
        user=user,
        date__gte=thirty_days_ago,
        completed=True
    ).order_by('-date')
    
    # Calculate current streak
    current_streak = 0
    current_date = timezone.now().date()
    
    for log in recent_logs:
        log_date = log.date.date()
        
        # Check if this log is from today or yesterday (allowing for consecutive days)
        if (current_date - log_date).days <= current_streak + 1:
            current_streak += 1
            current_date = log_date
        else:
            break
    
    # Check for streak milestones
    streak_milestones = [3, 7, 14, 30, 60, 100]
    if current_streak in streak_milestones:
        NotificationService.create_notification(
            recipient=user,
            notification_type='streak_milestone',
            related_object=workout_log,
            translation_params={
                'streak_days': current_streak,
            }
        )

def _check_personal_records(user, workout_log):
    """Check for personal records in the workout"""
    from django.db import models
    
    # This is a simplified version - you'd want more sophisticated PR detection
    for exercise_log in workout_log.exercises.all():
        for set_log in exercise_log.sets.all():
            if set_log.weight:
                # Check if this is a PR for this exercise
                previous_best = WorkoutLog.objects.filter(
                    user=user,
                    exercises__name=exercise_log.name,
                    exercises__sets__weight__isnull=False,
                    date__lt=workout_log.date
                ).aggregate(
                    max_weight=models.Max('exercises__sets__weight')
                )['max_weight']
                
                if previous_best and set_log.weight > previous_best:
                    NotificationService.create_notification(
                        recipient=user,
                        notification_type='personal_record',
                        related_object=exercise_log,
                        translation_params={
                            'exercise_name': exercise_log.name,
                            'new_weight': str(set_log.weight),
                            'previous_weight': str(previous_best),
                            'weight_unit': set_log.weight_unit,
                        }
                    )
                    break  # Only notify once per exercise

# =============================================================================
# GROUP WORKOUT INTERACTIONS
# =============================================================================

@receiver(post_save, sender=GroupWorkoutParticipant)
def handle_group_workout_participation(sender, instance, created, **kwargs):
    """Handle group workout participation changes"""
    if created and instance.status == 'joined' and instance.user != instance.group_workout.creator:
        NotificationService.create_notification(
            recipient=instance.group_workout.creator,
            notification_type='workout_join',
            sender=instance.user,
            related_object=instance.group_workout,
            translation_params={
                'workout_title': instance.group_workout.title,
                'scheduled_time': instance.group_workout.scheduled_time.strftime('%Y-%m-%d %H:%M'),
            }
        )

@receiver(post_save, sender=GroupWorkoutJoinRequest)
def handle_group_workout_join_request(sender, instance, created, **kwargs):
    """Handle group workout join requests"""
    if created:
        NotificationService.create_notification(
            recipient=instance.group_workout.creator,
            notification_type='workout_join_request',
            sender=instance.user,
            related_object=instance.group_workout,
            translation_params={
                'workout_title': instance.group_workout.title,
                'request_message': instance.message,
            }
        )
    elif hasattr(instance, '_previous_status'):
        # Handle status changes
        if instance.status == 'approved' and instance._previous_status == 'pending':
            NotificationService.create_notification(
                recipient=instance.user,
                notification_type='workout_request_approved',
                sender=instance.group_workout.creator,
                related_object=instance.group_workout,
                translation_params={
                    'workout_title': instance.group_workout.title,
                }
            )
        elif instance.status == 'rejected' and instance._previous_status == 'pending':
            NotificationService.create_notification(
                recipient=instance.user,
                notification_type='workout_request_rejected',
                sender=instance.group_workout.creator,
                related_object=instance.group_workout,
                translation_params={
                    'workout_title': instance.group_workout.title,
                }
            )

@receiver(pre_save, sender=GroupWorkoutJoinRequest)
def track_join_request_status_change(sender, instance, **kwargs):
    """Track status changes for join requests"""
    if instance.pk:
        try:
            old_instance = GroupWorkoutJoinRequest.objects.get(pk=instance.pk)
            instance._previous_status = old_instance.status
        except GroupWorkoutJoinRequest.DoesNotExist:
            instance._previous_status = None

@receiver(post_save, sender=GroupWorkoutProposal)
def handle_workout_proposal(sender, instance, created, **kwargs):
    """Handle workout proposals"""
    if created and instance.proposed_by != instance.group_workout.creator:
        NotificationService.create_notification(
            recipient=instance.group_workout.creator,
            notification_type='workout_proposal_submitted',
            sender=instance.proposed_by,
            related_object=instance.group_workout,
            translation_params={
                'workout_title': instance.group_workout.title,
                'template_name': instance.workout_template.name,
            }
        )

@receiver(post_save, sender=GroupWorkoutVote)
def handle_workout_vote(sender, instance, created, **kwargs):
    """Handle workout proposal votes"""
    if created and instance.user != instance.proposal.proposed_by:
        NotificationService.create_notification(
            recipient=instance.proposal.proposed_by,
            notification_type='workout_proposal_voted',
            sender=instance.user,
            related_object=instance.proposal.group_workout,
            translation_params={
                'workout_title': instance.proposal.group_workout.title,
                'template_name': instance.proposal.workout_template.name,
            }
        )

@receiver(post_save, sender=GroupWorkoutMessage)
def handle_group_workout_message(sender, instance, created, **kwargs):
    """Handle new messages in group workout chats"""
    if created:
        # Get all participants except the sender
        participants = instance.group_workout.participants.filter(
            status='joined'
        ).exclude(user=instance.user)
        
        # Create notifications for all other participants
        NotificationService.create_group_workout_message_notification(
            message=instance,
            participants=participants
        )

@receiver(post_save, sender=GroupWorkout)
def handle_group_workout_updates(sender, instance, created, **kwargs):
    """Handle group workout status changes and reminders"""
    if not created:
        # Check if status changed to cancelled
        if hasattr(instance, '_previous_status') and instance._previous_status != 'cancelled' and instance.status == 'cancelled':
            # Notify all participants
            participants = instance.participants.filter(status__in=['invited', 'joined']).exclude(user=instance.creator)
            for participant in participants:
                NotificationService.create_notification(
                    recipient=participant.user,
                    notification_type='workout_cancelled',
                    sender=instance.creator,
                    related_object=instance,
                    translation_params={
                        'workout_title': instance.title,
                    }
                )
        
        # Check if status changed to completed
        elif hasattr(instance, '_previous_status') and instance._previous_status != 'completed' and instance.status == 'completed':
            # Notify all participants
            participants = instance.participants.filter(status='joined').exclude(user=instance.creator)
            for participant in participants:
                NotificationService.create_notification(
                    recipient=participant.user,
                    notification_type='workout_completed',
                    sender=instance.creator,
                    related_object=instance,
                    translation_params={
                        'workout_title': instance.title,
                    }
                )

@receiver(pre_save, sender=GroupWorkout)
def track_group_workout_status_change(sender, instance, **kwargs):
    """Track status changes for group workouts"""
    if instance.pk:
        try:
            old_instance = GroupWorkout.objects.get(pk=instance.pk)
            instance._previous_status = old_instance.status
        except GroupWorkout.DoesNotExist:
            instance._previous_status = None

# =============================================================================
# WORKOUT REMINDER SYSTEM
# =============================================================================

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

def send_workout_reminders():
    """
    Function to send workout reminders - should be called by a scheduled task
    """
    # Send reminders 1 hour before group workouts
    upcoming_workouts = GroupWorkout.objects.filter(
        status='scheduled',
        scheduled_time__gte=timezone.now(),
        scheduled_time__lte=timezone.now() + timedelta(hours=1)
    ).prefetch_related('participants')
    
    for workout in upcoming_workouts:
        participants = workout.participants.filter(status='joined')
        for participant in participants:
            NotificationService.create_notification(
                recipient=participant.user,
                notification_type='workout_reminder',
                related_object=workout,
                translation_params={
                    'workout_title': workout.title,
                    'scheduled_time': workout.scheduled_time.strftime('%Y-%m-%d %H:%M'),
                    'gym_name': workout.gym.name if workout.gym else 'TBD',
                },
                priority='high'
            )

# =============================================================================
# ADDITIONAL NOTIFICATION HELPERS
# =============================================================================

def create_gym_announcement_notification(gym, title, content, recipients=None):
    """Helper function to create gym announcement notifications"""
    if recipients is None:
        # Get all users who have this gym as preferred
        from django.contrib.auth import get_user_model
        User = get_user_model()
        recipients = User.objects.filter(preferred_gym=gym)
    
    for user in recipients:
        NotificationService.create_notification(
            recipient=user,
            notification_type='gym_announcement',
            related_object=gym,
            translation_params={
                'gym_name': gym.name,
                'announcement_title': title,
                'announcement_content': content,
            }
        )

def create_system_update_notification(title, description, recipients=None):
    """Helper function to create system update notifications"""
    if recipients is None:
        # Send to all active users
        from django.contrib.auth import get_user_model
        User = get_user_model()
        recipients = User.objects.filter(is_active=True)
    
    for user in recipients:
        NotificationService.create_notification(
            recipient=user,
            notification_type='system_update',
            translation_params={
                'update_title': title,
                'update_description': description,
            }
        )