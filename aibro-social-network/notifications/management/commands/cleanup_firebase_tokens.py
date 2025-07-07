# Create a management command to clean up old Firebase tokens
# notifications/management/commands/cleanup_firebase_tokens.py

from django.core.management.base import BaseCommand
from notifications.models import DeviceToken

class Command(BaseCommand):
    help = 'Clean up Firebase tokens that are not compatible with Expo'

    def handle(self, *args, **options):
        # Remove tokens that don't match Expo format
        firebase_tokens = DeviceToken.objects.exclude(
            token__startswith='ExponentPushToken['
        ).exclude(
            token__startswith='ExpoPushToken['
        )
        
        count = firebase_tokens.count()
        firebase_tokens.delete()
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully cleaned up {count} Firebase tokens')
        )