# notifications/management/commands/migrate_notifications.py
from django.core.management.base import BaseCommand
from django.db import transaction
from notifications.models import Notification, NotificationPreference
from notifications.translation_service import translation_service

class Command(BaseCommand):
    help = 'Migrate existing notifications to use the enhanced notification system'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview changes without applying them',
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=1000,
            help='Number of notifications to process in each batch',
        )
    
    def handle(self, *args, **options):
        dry_run = options['dry_run']
        batch_size = options['batch_size']
        
        self.stdout.write(
            self.style.SUCCESS(
                f"Starting notification migration {'(DRY RUN)' if dry_run else ''}"
            )
        )
        
        # Migrate notifications
        self.migrate_notifications(dry_run, batch_size)
        
        # Create default preferences for users without them
        self.create_default_preferences(dry_run)
        
        # Update notification types
        self.update_notification_types(dry_run)
        
        self.stdout.write(
            self.style.SUCCESS(
                f"Migration completed {'(DRY RUN)' if dry_run else ''}"
            )
        )
    
    def migrate_notifications(self, dry_run, batch_size):
        """Migrate existing notifications to use translation keys"""
        self.stdout.write("Migrating notification content to translation keys...")
        
        # Get notifications that don't have translation keys
        notifications = Notification.objects.filter(
            title_key__isnull=True
        ) | Notification.objects.filter(
            title_key=''
        )
        
        total_count = notifications.count()
        self.stdout.write(f"Found {total_count} notifications to migrate")
        
        migrated_count = 0
        
        for i in range(0, total_count, batch_size):
            batch = notifications[i:i + batch_size]
            
            with transaction.atomic():
                for notification in batch:
                    # Map old content to new translation keys
                    title_key, body_key, params = self._map_notification_to_keys(notification)
                    
                    if not dry_run:
                        notification.title_key = title_key
                        notification.body_key = body_key
                        notification.translation_params = params
                        notification.save(update_fields=['title_key', 'body_key', 'translation_params'])
                    
                    migrated_count += 1
                    
                    if migrated_count % 100 == 0:
                        self.stdout.write(f"Migrated {migrated_count}/{total_count} notifications")
        
        self.stdout.write(
            self.style.SUCCESS(f"Migrated {migrated_count} notifications")
        )
    
    def _map_notification_to_keys(self, notification):
        """Map old notification content to new translation keys"""
        notification_type = notification.notification_type
        
        # Default mapping
        title_key = f'notifications.{notification_type}.title'
        body_key = f'notifications.{notification_type}.body'
        params = {}
        
        # Extract parameters from existing content
        if notification.sender:
            params.update({
                'sender_username': notification.sender.username,
                'sender_display_name': notification.sender.get_full_name() or notification.sender.username,
            })
        
        # Type-specific parameter extraction
        if notification_type == 'like' and notification.related_object:
            if hasattr(notification.related_object, 'content'):
                content = notification.related_object.content
                params['post_content'] = content[:100] + '...' if len(content) > 100 else content
        
        elif notification_type == 'comment' and notification.related_object:
            if hasattr(notification.related_object, 'content'):
                content = notification.related_object.content
                params['comment_content'] = content[:100] + '...' if len(content) > 100 else content
        
        elif notification_type == 'program_fork' and notification.related_object:
            if hasattr(notification.related_object, 'name'):
                params['program_name'] = notification.related_object.name
                if hasattr(notification.related_object, 'forked_from') and notification.related_object.forked_from:
                    params['original_program_name'] = notification.related_object.forked_from.name
        
        elif notification_type == 'workout_milestone':
            # Try to extract milestone count from content
            import re
            if notification.content:
                match = re.search(r'(\d+)', notification.content)
                if match:
                    params['workout_count'] = int(match.group(1))
        
        return title_key, body_key, params
    
    def create_default_preferences(self, dry_run):
        """Create default notification preferences for users without them"""
        self.stdout.write("Creating default notification preferences...")
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        users_without_prefs = User.objects.filter(
            notification_preferences__isnull=True
        )
        
        count = users_without_prefs.count()
        self.stdout.write(f"Found {count} users without notification preferences")
        
        if not dry_run:
            for user in users_without_prefs:
                NotificationPreference.objects.create(user=user)
        
        self.stdout.write(
            self.style.SUCCESS(f"Created preferences for {count} users")
        )
    
    def update_notification_types(self, dry_run):
        """Update old notification types to new ones"""
        self.stdout.write("Updating notification types...")
        
        # Mapping of old types to new types
        type_mapping = {
            'workout_join': 'workout_join',  # Keep same
            'workout_invitation': 'workout_invitation',  # Keep same
            # Add other mappings as needed
        }
        
        updated_count = 0
        
        for old_type, new_type in type_mapping.items():
            if old_type != new_type:
                count = Notification.objects.filter(notification_type=old_type).count()
                if count > 0:
                    self.stdout.write(f"Updating {count} notifications from '{old_type}' to '{new_type}'")
                    
                    if not dry_run:
                        Notification.objects.filter(notification_type=old_type).update(
                            notification_type=new_type
                        )
                    
                    updated_count += count
        
        self.stdout.write(
            self.style.SUCCESS(f"Updated {updated_count} notification types")
        )

# notifications/management/commands/cleanup_notifications.py
class CleanupNotificationsCommand(BaseCommand):
    help = 'Clean up old notifications to improve performance'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=90,
            help='Delete read notifications older than this many days',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview what would be deleted without actually deleting',
        )
    
    def handle(self, *args, **options):
        from django.utils import timezone
        from datetime import timedelta
        
        days = options['days']
        dry_run = options['dry_run']
        
        cutoff_date = timezone.now() - timedelta(days=days)
        
        # Find old read notifications
        old_notifications = Notification.objects.filter(
            is_read=True,
            created_at__lt=cutoff_date
        )
        
        count = old_notifications.count()
        
        self.stdout.write(
            f"Found {count} read notifications older than {days} days"
        )
        
        if not dry_run:
            deleted_count, _ = old_notifications.delete()
            self.stdout.write(
                self.style.SUCCESS(f"Deleted {deleted_count} old notifications")
            )
        else:
            self.stdout.write(
                self.style.WARNING(f"DRY RUN: Would delete {count} notifications")
            )

# notifications/management/commands/test_notifications.py
class TestNotificationsCommand(BaseCommand):
    help = 'Test notification system by sending sample notifications'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--user-id',
            type=int,
            help='User ID to send test notifications to',
        )
        parser.add_argument(
            '--notification-type',
            type=str,
            help='Specific notification type to test',
        )
        parser.add_argument(
            '--all-types',
            action='store_true',
            help='Test all notification types',
        )
    
    def handle(self, *args, **options):
        from django.contrib.auth import get_user_model
        from notifications.services import NotificationService
        
        User = get_user_model()
        
        user_id = options.get('user_id')
        notification_type = options.get('notification_type')
        all_types = options.get('all_types')
        
        if not user_id:
            self.stdout.write(
                self.style.ERROR("User ID is required. Use --user-id=<id>")
            )
            return
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f"User with ID {user_id} not found")
            )
            return
        
        if all_types:
            self._test_all_notification_types(user)
        elif notification_type:
            self._test_specific_notification_type(user, notification_type)
        else:
            self._test_basic_notification(user)
    
    def _test_basic_notification(self, user):
        """Send a basic test notification"""
        from notifications.services import NotificationService
        
        notification = NotificationService.create_notification(
            recipient=user,
            notification_type='test',
            translation_params={
                'test_message': 'Test notification from management command'
            }
        )
        
        self.stdout.write(
            self.style.SUCCESS(f"Sent test notification {notification.id} to {user.username}")
        )
    
    def _test_specific_notification_type(self, user, notification_type):
        """Test a specific notification type"""
        from notifications.services import NotificationService
        
        # Sample parameters for different types
        sample_params = {
            'like': {'post_content': 'This is a sample post content'},
            'comment': {'comment_content': 'This is a sample comment'},
            'friend_request': {},
            'workout_milestone': {'workout_count': 50},
            'program_fork': {'program_name': 'Sample Program', 'original_program_name': 'Original Program'},
        }
        
        params = sample_params.get(notification_type, {})
        
        notification = NotificationService.create_notification(
            recipient=user,
            notification_type=notification_type,
            translation_params=params
        )
        
        self.stdout.write(
            self.style.SUCCESS(f"Sent {notification_type} notification {notification.id} to {user.username}")
        )
    
    def _test_all_notification_types(self, user):
        """Test all available notification types"""
        from notifications.models import Notification
        
        # Get all notification types
        notification_types = [choice[0] for choice in Notification.NOTIFICATION_TYPES]
        
        self.stdout.write(f"Testing {len(notification_types)} notification types...")
        
        for notification_type in notification_types:
            try:
                self._test_specific_notification_type(user, notification_type)
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"Failed to send {notification_type}: {e}")
                )
        
        self.stdout.write(
            self.style.SUCCESS(f"Completed testing all notification types for {user.username}")
        )

# notifications/utils.py
"""Utility functions for notifications"""

def create_sample_notifications_for_demo():
    """Create sample notifications for demo purposes"""
    from django.contrib.auth import get_user_model
    from notifications.services import NotificationService
    import random
    
    User = get_user_model()
    users = User.objects.all()[:10]  # Get first 10 users
    
    if len(users) < 2:
        print("Need at least 2 users to create sample notifications")
        return
    
    sample_notifications = [
        {
            'type': 'like',
            'params': {'post_content': 'Just finished an amazing workout session!'}
        },
        {
            'type': 'comment',
            'params': {'comment_content': 'Great job on your workout! Keep it up!'}
        },
        {
            'type': 'workout_milestone',
            'params': {'workout_count': random.choice([10, 25, 50, 100])}
        },
        {
            'type': 'friend_request',
            'params': {}
        },
        {
            'type': 'program_fork',
            'params': {
                'program_name': 'Full Body Strength',
                'original_program_name': 'Beginner Strength Program'
            }
        }
    ]
    
    created_count = 0
    
    for user in users:
        # Create 2-5 random notifications for each user
        num_notifications = random.randint(2, 5)
        
        for _ in range(num_notifications):
            sample = random.choice(sample_notifications)
            
            # Choose a random sender (different from recipient)
            potential_senders = [u for u in users if u != user]
            sender = random.choice(potential_senders) if potential_senders else None
            
            NotificationService.create_notification(
                recipient=user,
                notification_type=sample['type'],
                sender=sender,
                translation_params=sample['params']
            )
            
            created_count += 1
    
    print(f"Created {created_count} sample notifications")

def batch_update_notification_preferences(user_ids, preferences):
    """Batch update notification preferences for multiple users"""
    from notifications.models import NotificationPreference
    
    updated_count = 0
    
    for user_id in user_ids:
        prefs, created = NotificationPreference.objects.get_or_create(
            user_id=user_id
        )
        
        for key, value in preferences.items():
            if hasattr(prefs, key):
                setattr(prefs, key, value)
        
        prefs.save()
        updated_count += 1
    
    return updated_count

def export_notification_data_for_user(user_id, format='json'):
    """Export notification data for a user"""
    from notifications.models import Notification
    from django.contrib.auth import get_user_model
    import json
    
    User = get_user_model()
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return None
    
    notifications = Notification.objects.filter(recipient=user).order_by('-created_at')
    
    data = []
    for notification in notifications:
        data.append({
            'id': notification.id,
            'type': notification.notification_type,
            'title_key': notification.title_key,
            'body_key': notification.body_key,
            'translation_params': notification.translation_params,
            'is_read': notification.is_read,
            'is_seen': notification.is_seen,
            'created_at': notification.created_at.isoformat(),
            'priority': notification.priority,
            'sender': notification.sender.username if notification.sender else None,
        })
    
    if format == 'json':
        return json.dumps(data, indent=2)
    elif format == 'csv':
        import csv
        import io
        
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
        return output.getvalue()
    
    return data