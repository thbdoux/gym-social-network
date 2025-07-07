# notifications/management/commands/fix_device_tokens.py
from django.core.management.base import BaseCommand
from django.db import connection
from notifications.models import DeviceToken

class Command(BaseCommand):
    help = 'Fix device token duplicates and constraints'

    def handle(self, *args, **options):
        # Remove the unique_together constraint if it exists
        with connection.cursor() as cursor:
            try:
                cursor.execute("""
                    ALTER TABLE notifications_devicetoken 
                    DROP CONSTRAINT IF EXISTS notifications_devicetoken_user_id_token_key;
                """)
                self.stdout.write('Removed unique_together constraint')
            except:
                self.stdout.write('Constraint already removed or does not exist')
        
        self.stdout.write(self.style.SUCCESS('Device token model updated successfully'))