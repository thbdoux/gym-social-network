# notifications/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print("====== WEBSOCKET CONNECTION ATTEMPT ======")
        print(f"User authenticated: {self.scope['user'].is_authenticated}")
        print(f"Path: {self.scope.get('path')}")
        print(f"Query string: {self.scope.get('query_string')}")
        
        self.user = self.scope["user"]
        
        if not self.user.is_authenticated:
            # Close the connection if user is not authenticated
            await self.close(code=4003)  # Custom code for unauthenticated
            return
        
        # Set the notification group name for this user
        self.notification_group_name = f"notifications_{self.user.id}"
        
        # Join notification group
        await self.channel_layer.group_add(
            self.notification_group_name,
            self.channel_name
        )
        
        # Accept connection ONLY ONCE
        await self.accept()
        
        # Send test message after accepting
        await self.send(text_data=json.dumps({
            "type": "connection_established",
            "message": "WebSocket connected successfully"
        }))
    
    async def disconnect(self, close_code):
        # Leave notification group
        if hasattr(self, 'notification_group_name'):
            await self.channel_layer.group_discard(
                self.notification_group_name,
                self.channel_name
            )
    
    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type')
        
        if message_type == 'mark_read':
            notification_id = text_data_json.get('notification_id')
            if notification_id:
                await self.mark_as_read(notification_id)
        elif message_type == 'mark_all_read':
            await self.mark_all_as_read()
    
    # Handle notification message from notification group
    async def notification_message(self, event):
        notification = event['notification']
        
        # Send notification to WebSocket
        await self.send(text_data=json.dumps(notification))
    
    @database_sync_to_async
    def mark_as_read(self, notification_id):
        from .models import Notification
        try:
            notification = Notification.objects.get(
                id=notification_id, 
                recipient=self.user
            )
            notification.is_read = True
            notification.is_seen = True
            notification.save()
            return True
        except Notification.DoesNotExist:
            return False
    
    @database_sync_to_async
    def mark_all_as_read(self):
        from .models import Notification
        Notification.objects.filter(
            recipient=self.user,
            is_read=False
        ).update(is_read=True, is_seen=True)
        return True