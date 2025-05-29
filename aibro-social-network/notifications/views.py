# notifications/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Notification, NotificationPreference
from .serializers import NotificationSerializer, NotificationPreferenceSerializer
from .services import NotificationService

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint for user notifications"""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(
            recipient=self.request.user
        ).select_related('sender')
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Get unread notifications"""
        queryset = self.get_queryset().filter(is_read=False)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a notification as read"""
        success = NotificationService.mark_as_read(pk, request.user)
        return Response({'success': success})
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        NotificationService.mark_all_as_read(request.user)
        return Response({'success': True})
    
    @action(detail=False, methods=['get'])
    def count(self, request):
        """Get notification counts"""
        unread_count = self.get_queryset().filter(is_read=False).count()
        unseen_count = self.get_queryset().filter(is_seen=False).count()
        return Response({
            'unread': unread_count,
            'unseen': unseen_count,
            'total': self.get_queryset().count()
        })

class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    """API endpoint for notification preferences"""
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        """Get or create notification preferences"""
        obj, created = NotificationPreference.objects.get_or_create(
            user=self.request.user
        )
        return obj