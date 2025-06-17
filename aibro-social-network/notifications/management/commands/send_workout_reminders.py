# notifications/management/commands/send_workout_reminders.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from workouts.group_workouts import GroupWorkout
from notifications.services import NotificationService

class Command(BaseCommand):
    help = 'Send workout reminder notifications for upcoming group workouts'

    def add_arguments(self, parser):
        parser.add_argument(
            '--hours-ahead',
            type=int,
            default=1,
            help='How many hours ahead to send reminders (default: 1)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Print what would be done without actually sending notifications'
        )

    def handle(self, *args, **options):
        hours_ahead = options['hours_ahead']
        dry_run = options['dry_run']
        
        now = timezone.now()
        reminder_time = now + timedelta(hours=hours_ahead)
        
        # Find workouts that start within the reminder window
        upcoming_workouts = GroupWorkout.objects.filter(
            status='scheduled',
            scheduled_time__gte=now,
            scheduled_time__lte=reminder_time
        ).prefetch_related('participants', 'gym')
        
        total_notifications = 0
        
        for workout in upcoming_workouts:
            participants = workout.participants.filter(status='joined')
            workout_notifications = 0
            
            for participant in participants:
                # Check if we've already sent a reminder for this workout
                existing_reminder = participant.user.notifications.filter(
                    notification_type='workout_reminder',
                    object_id=workout.id,
                    created_at__gte=now - timedelta(hours=2)  # Don't send multiple reminders within 2 hours
                ).exists()
                
                if not existing_reminder:
                    if dry_run:
                        self.stdout.write(
                            f"Would send reminder to {participant.user.username} for '{workout.title}'"
                        )
                    else:
                        NotificationService.create_notification(
                            recipient=participant.user,
                            notification_type='workout_reminder',
                            related_object=workout,
                            translation_params={
                                'workout_title': workout.title,
                                'scheduled_time': workout.scheduled_time.isoformat(),
                                'gym_name': workout.gym.name if workout.gym else 'TBD',
                                'hours_until': hours_ahead,
                            },
                            priority='high'
                        )
                    
                    workout_notifications += 1
                    total_notifications += 1
            
            if workout_notifications > 0:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"{'Would send' if dry_run else 'Sent'} {workout_notifications} reminders for '{workout.title}'"
                    )
                )
        
        if total_notifications == 0:
            self.stdout.write(
                self.style.WARNING('No workout reminders to send at this time.')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"{'Would send' if dry_run else 'Sent'} {total_notifications} workout reminder notifications total."
                )
            )