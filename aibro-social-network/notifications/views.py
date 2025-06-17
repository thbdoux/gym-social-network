from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification, NotificationPreference, DeviceToken
from .serializers import NotificationSerializer, NotificationPreferenceSerializer, DeviceTokenSerializer
from .services import NotificationService
from .expo_push_notification_service import expo_push_service

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

class NotificationPreferenceView(APIView):
    """API endpoint for notification preferences - singleton per user"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        """Get or create notification preferences for the current user"""
        obj, created = NotificationPreference.objects.get_or_create(
            user=self.request.user
        )
        return obj
    
    def get(self, request):
        """GET /preferences/ - Retrieve user's notification preferences"""
        instance = self.get_object()
        serializer = NotificationPreferenceSerializer(instance)
        return Response(serializer.data)
    
    def put(self, request):
        """PUT /preferences/ - Update user's notification preferences"""
        instance = self.get_object()
        serializer = NotificationPreferenceSerializer(instance, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request):
        """PATCH /preferences/ - Partially update user's notification preferences"""
        instance = self.get_object()
        serializer = NotificationPreferenceSerializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DeviceTokenViewSet(viewsets.GenericViewSet):
    """API endpoint for managing Expo push tokens"""
    serializer_class = DeviceTokenSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def register(self, request):
        """Register an Expo push token - handles duplicates gracefully"""
        token = request.data.get('token')
        platform = request.data.get('platform')
        locale = request.data.get('locale', 'en')  # Add locale support
        
        # Validate required fields
        if not token:
            return Response(
                {'error': 'Token is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not platform:
            return Response(
                {'error': 'Platform is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate token format
        if not token.startswith(('ExponentPushToken[', 'ExpoPushToken[')) or not token.endswith(']'):
            return Response(
                {'error': 'Invalid Expo push token format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Register token using the service (handles duplicates)
        try:
            success = expo_push_service.register_device_token(
                user=request.user,
                token=token,
                platform=platform,
                locale=locale
            )
            
            if success:
                return Response(
                    {'message': 'Expo push token registered successfully'}, 
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(
                    {'error': 'Failed to register Expo push token'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            # Handle the case where token already exists
            if 'already exists' in str(e).lower():
                return Response(
                    {'message': 'Expo push token already registered'}, 
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {'error': f'Failed to register Expo push token: {str(e)}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
    
    @action(detail=False, methods=['post'])
    def unregister(self, request):
        """Unregister an Expo push token"""
        token = request.data.get('token')
        if not token:
            return Response(
                {'error': 'Token is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        success = expo_push_service.unregister_device_token(request.user, token)
        if success:
            return Response({'message': 'Expo push token unregistered successfully'})
        else:
            return Response(
                {'error': 'Failed to unregister Expo push token'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def list_tokens(self, request):
        """List user's registered Expo push tokens"""
        tokens = DeviceToken.objects.filter(
            user=request.user, 
            is_active=True
        ).values('token', 'platform', 'locale', 'created_at')
        return Response(list(tokens))
    
    @action(detail=False, methods=['post'])
    def test_notification(self, request):
        """Send a test push notification using Expo"""
        success = expo_push_service.send_test_notification(request.user)
        
        if success:
            return Response({'message': 'Test Expo notification sent successfully'})
        else:
            return Response(
                {'error': 'Failed to send test Expo notification'}, 
                status=status.HTTP_400_BAD_REQUEST
            )