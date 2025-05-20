# workouts/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from .group_workouts import GroupWorkout, GroupWorkoutParticipant
from .models import WorkoutLog
from notifications.services import NotificationService

@receiver(post_save, sender=GroupWorkout)
def handle_group_workout_status(sender, instance, created, **kwargs):
    """Auto-update status based on scheduled time"""
    if not created and instance.status == 'scheduled':
        # If the workout is past its scheduled time by more than 24 hours, mark as completed
        if timezone.now() > (instance.scheduled_time + timezone.timedelta(hours=24)):
            instance.status = 'completed'
            instance.save(update_fields=['status'])
            
            # Create workout logs for participants
            participants = instance.participants.filter(status='joined')
            for participant in participants:
                if instance.workout_template:
                    workout_log = WorkoutLog.objects.create(
                        user=participant.user,
                        based_on_instance=instance.workout_template,
                        program=instance.workout_template.program if instance.workout_template.program else None,
                        name=instance.title,
                        date=instance.scheduled_time,
                        gym=instance.gym,
                        notes=f"Auto-completed from group workout: {instance.title}",
                        completed=True
                    )
                    
                    # Update participant record
                    participant.workout_log = workout_log
                    participant.save()
                    
                    # Send notification
                    NotificationService.create_notification(
                        recipient=participant.user,
                        notification_type='workout_completed',
                        content=f"Group workout {instance.title} has been automatically marked as completed",
                        related_object=workout_log
                    )