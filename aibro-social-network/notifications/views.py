# notifications/views.py (ENHANCED)
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta

from .models import Notification, NotificationPreference, DeviceToken, NotificationGroup
from .serializers import NotificationSerializer, NotificationPreferenceSerializer, DeviceTokenSerializer
from .services import NotificationService
from .expo_push_notification_service import expo_push_service

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """Enhanced API endpoint for user notifications with filtering and grouping"""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'priority']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Notification.objects.filter(
            recipient=self.request.user
        ).select_related('sender').prefetch_related('related_object')
    
    def list(self, request, *args, **kwargs):
        """Enhanced list with filtering and pagination"""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Apply filters
        notification_type = request.query_params.get('type')
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        
        is_read = request.query_params.get('is_read')
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == 'true')
        
        priority = request.query_params.get('priority')
        if priority:
            queryset = queryset.filter(priority=priority)
        
        # Date filtering
        since = request.query_params.get('since')
        if since:
            try:
                since_date = timezone.datetime.fromisoformat(since.replace('Z', '+00:00'))
                queryset = queryset.filter(created_at__gte=since_date)
            except ValueError:
                pass
        
        # Limit results for performance
        limit = request.query_params.get('limit')
        if limit:
            try:
                queryset = queryset[:int(limit)]
            except ValueError:
                pass
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Get unread notifications"""
        queryset = self.get_queryset().filter(is_read=False)
        
        # Apply same filtering as list
        notification_type = request.query_params.get('type')
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Get notifications grouped by type"""
        notifications_by_type = {}
        queryset = self.get_queryset()
        
        # Group notifications by type
        notification_types = queryset.values_list('notification_type', flat=True).distinct()
        
        for notification_type in notification_types:
            type_notifications = queryset.filter(notification_type=notification_type)[:10]
            notifications_by_type[notification_type] = self.get_serializer(
                type_notifications, many=True
            ).data
        
        return Response(notifications_by_type)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a notification as read"""
        success = NotificationService.mark_as_read(pk, request.user)
        return Response({'success': success})
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        notification_type = request.data.get('type')
        
        if notification_type:
            # Mark only specific type as read
            Notification.objects.filter(
                recipient=request.user,
                notification_type=notification_type,
                is_read=False
            ).update(is_read=True, is_seen=True)
        else:
            # Mark all as read
            NotificationService.mark_all_as_read(request.user)
        
        return Response({'success': True})
    
    @action(detail=False, methods=['post'])
    def mark_seen(self, request):
        """Mark notifications as seen (but not necessarily read)"""
        notification_ids = request.data.get('notification_ids', [])
        
        if notification_ids:
            Notification.objects.filter(
                id__in=notification_ids,
                recipient=request.user
            ).update(is_seen=True)
        else:
            # Mark all unseen as seen
            Notification.objects.filter(
                recipient=request.user,
                is_seen=False
            ).update(is_seen=True)
        
        return Response({'success': True})
    
    @action(detail=False, methods=['get'])
    def count(self, request):
        """Get notification counts with detailed breakdown"""
        queryset = self.get_queryset()
        
        # Overall counts
        unread_count = queryset.filter(is_read=False).count()
        unseen_count = queryset.filter(is_seen=False).count()
        total_count = queryset.count()
        
        # Count by type
        type_counts = {}
        notification_types = queryset.values('notification_type').annotate(
            total=Count('id'),
            unread=Count('id', filter=Q(is_read=False))
        )
        
        for item in notification_types:
            type_counts[item['notification_type']] = {
                'total': item['total'],
                'unread': item['unread']
            }
        
        # Count by priority
        priority_counts = {}
        priority_data = queryset.values('priority').annotate(
            total=Count('id'),
            unread=Count('id', filter=Q(is_read=False))
        )
        
        for item in priority_data:
            priority_counts[item['priority']] = {
                'total': item['total'],
                'unread': item['unread']
            }
        
        # Recent activity (last 24 hours)
        recent_cutoff = timezone.now() - timedelta(hours=24)
        recent_count = queryset.filter(created_at__gte=recent_cutoff).count()
        
        return Response({
            'unread': unread_count,
            'unseen': unseen_count,
            'total': total_count,
            'recent_24h': recent_count,
            'by_type': type_counts,
            'by_priority': priority_counts
        })
    
    @action(detail=False, methods=['delete'])
    def clear_old(self, request):
        """Clear old read notifications"""
        days = int(request.query_params.get('older_than_days', 30))
        cutoff_date = timezone.now() - timedelta(days=days)
        
        deleted_count, _ = Notification.objects.filter(
            recipient=request.user,
            is_read=True,
            created_at__lt=cutoff_date
        ).delete()
        
        return Response({
            'success': True,
            'deleted_count': deleted_count
        })
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get a summary of recent notification activity"""
        queryset = self.get_queryset()
        
        # Last 7 days activity
        week_ago = timezone.now() - timedelta(days=7)
        recent_notifications = queryset.filter(created_at__gte=week_ago)
        
        # Group by day
        daily_counts = {}
        for i in range(7):
            date = timezone.now().date() - timedelta(days=i)
            day_notifications = recent_notifications.filter(
                created_at__date=date
            )
            daily_counts[date.isoformat()] = {
                'total': day_notifications.count(),
                'unread': day_notifications.filter(is_read=False).count()
            }
        
        # Most active senders
        sender_counts = recent_notifications.filter(
            sender__isnull=False
        ).values(
            'sender__username', 'sender__id'
        ).annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        return Response({
            'daily_activity': daily_counts,
            'top_senders': list(sender_counts),
            'total_this_week': recent_notifications.count(),
            'unread_this_week': recent_notifications.filter(is_read=False).count()
        })

class NotificationPreferenceView(APIView):
    """Enhanced API endpoint for notification preferences"""
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
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Bulk update multiple preference categories"""
        instance = self.get_object()
        
        # Categories that can be bulk updated
        categories = request.data.get('categories', {})
        
        for category, enabled in categories.items():
            if category == 'all_push':
                # Update all push notification preferences
                push_fields = [f for f in NotificationPreference._meta.get_fields() 
                              if f.name.startswith('push_') and hasattr(f, 'get_internal_type')]
                for field in push_fields:
                    setattr(instance, field.name, enabled)
            
            elif category == 'all_email':
                # Update all email notification preferences
                email_fields = [f for f in NotificationPreference._meta.get_fields() 
                               if f.name.startswith('email_') and hasattr(f, 'get_internal_type')]
                for field in email_fields:
                    setattr(instance, field.name, enabled)
            
            elif category == 'social':
                # Update social-related notifications
                social_fields = ['email_likes', 'email_comments', 'email_shares', 'email_mentions',
                               'push_likes', 'push_comments', 'push_shares', 'push_mentions']
                for field in social_fields:
                    if hasattr(instance, field):
                        setattr(instance, field, enabled)
        
        instance.save()
        serializer = NotificationPreferenceSerializer(instance)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get preference categories for easy management"""
        return Response({
            'social': {
                'name': 'Social Interactions',
                'description': 'Likes, comments, shares, mentions',
                'fields': ['likes', 'comments', 'shares', 'mentions']
            },
            'workouts': {
                'name': 'Workout Activities',
                'description': 'Workout milestones, group workouts, reminders',
                'fields': ['workout_milestones', 'group_workouts', 'workout_reminders']
            },
            'programs': {
                'name': 'Program Activities',
                'description': 'Program forks, shares, usage',
                'fields': ['program_activities']
            },
            'friends': {
                'name': 'Friend Activities',
                'description': 'Friend requests and acceptances',
                'fields': ['friend_requests']
            },
            'system': {
                'name': 'System Notifications',
                'description': 'Gym announcements, app updates',
                'fields': ['gym_announcements']
            }
        })

class DeviceTokenViewSet(viewsets.GenericViewSet):
    """Enhanced API endpoint for managing Expo push tokens with device management"""
    serializer_class = DeviceTokenSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return DeviceToken.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def register(self, request):
        """Enhanced device token registration with device info"""
        token = request.data.get('token')
        platform = request.data.get('platform')
        locale = request.data.get('locale', 'en')
        device_info = request.data.get('device_info', {})
        
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
        
        try:
            # Register or update token
            device_token, created = DeviceToken.objects.update_or_create(
                user=request.user,
                token=token,
                defaults={
                    'platform': platform,
                    'locale': locale,
                    'device_info': device_info,
                    'is_active': True
                }
            )
            
            # Register with Expo service
            success = expo_push_service.register_device_token(
                user=request.user,
                token=token,
                platform=platform,
                locale=locale
            )
            
            if success:
                return Response(
                    {
                        'message': 'Device token registered successfully',
                        'created': created,
                        'device_id': device_token.id
                    }, 
                    status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
                )
            else:
                return Response(
                    {'error': 'Failed to register with push service'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {'error': f'Failed to register device token: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def unregister(self, request):
        """Unregister a device token"""
        token = request.data.get('token')
        if not token:
            return Response(
                {'error': 'Token is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mark as inactive instead of deleting for audit purposes
        updated_count = DeviceToken.objects.filter(
            user=request.user,
            token=token
        ).update(is_active=False)
        
        # Unregister from Expo service
        expo_success = expo_push_service.unregister_device_token(request.user, token)
        
        if updated_count > 0:
            return Response({
                'message': 'Device token unregistered successfully',
                'expo_unregistered': expo_success
            })
        else:
            return Response(
                {'error': 'Device token not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def list_devices(self, request):
        """List user's registered devices with details"""
        devices = self.get_queryset().filter(is_active=True)
        
        device_list = []
        for device in devices:
            device_data = {
                'id': device.id,
                'platform': device.platform,
                'locale': device.locale,
                'created_at': device.created_at,
                'updated_at': device.updated_at,
                'device_info': device.device_info,
                'token_preview': device.token[:20] + '...' if len(device.token) > 20 else device.token
            }
            device_list.append(device_data)
        
        return Response({
            'devices': device_list,
            'total_count': len(device_list)
        })
    
    @action(detail=False, methods=['post'])
    def test_notification(self, request):
        """Send a test push notification to specific device or all devices"""
        device_id = request.data.get('device_id')
        custom_message = request.data.get('message', 'Test notification from your fitness app!')
        
        if device_id:
            # Test specific device
            try:
                device = self.get_queryset().get(id=device_id, is_active=True)
                success = expo_push_service.send_test_notification_to_token(
                    device.token, 
                    custom_message
                )
                return Response({
                    'message': 'Test notification sent to specific device',
                    'device_platform': device.platform,
                    'success': success
                })
            except DeviceToken.DoesNotExist:
                return Response(
                    {'error': 'Device not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Test all user's devices
            success = expo_push_service.send_test_notification(request.user, custom_message)
            device_count = self.get_queryset().filter(is_active=True).count()
            
            return Response({
                'message': f'Test notification sent to {device_count} devices',
                'success': success
            })
    
    @action(detail=False, methods=['post'])
    def update_locale(self, request):
        """Update locale for a specific device"""
        token = request.data.get('token')
        locale = request.data.get('locale')
        
        if not token or not locale:
            return Response(
                {'error': 'Token and locale are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        updated_count = DeviceToken.objects.filter(
            user=request.user,
            token=token,
            is_active=True
        ).update(locale=locale)
        
        if updated_count > 0:
            return Response({'message': 'Device locale updated successfully'})
        else:
            return Response(
                {'error': 'Device token not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

class NotificationAnalyticsView(APIView):
    """Analytics endpoint for notification insights"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get notification analytics for the user"""
        user = request.user
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        queryset = Notification.objects.filter(
            recipient=user,
            created_at__gte=start_date
        )
        
        # Basic stats
        total_notifications = queryset.count()
        read_notifications = queryset.filter(is_read=True).count()
        read_rate = (read_notifications / total_notifications * 100) if total_notifications > 0 else 0
        
        # Notifications by type
        by_type = list(queryset.values('notification_type').annotate(
            count=Count('id')
        ).order_by('-count'))
        
        # Daily activity
        daily_activity = []
        for i in range(days):
            date = (timezone.now() - timedelta(days=i)).date()
            day_count = queryset.filter(created_at__date=date).count()
            daily_activity.append({
                'date': date.isoformat(),
                'count': day_count
            })
        
        # Response time analysis (time to read)
        response_times = []
        read_notifications_with_time = queryset.filter(is_read=True)
        for notification in read_notifications_with_time[:100]:  # Sample for performance
            # This would need to be implemented with actual read timestamps
            # For now, we'll use a placeholder
            response_times.append({
                'type': notification.notification_type,
                'hours_to_read': 2.5  # Placeholder
            })
        
        return Response({
            'period_days': days,
            'total_notifications': total_notifications,
            'read_notifications': read_notifications,
            'read_rate_percent': round(read_rate, 1),
            'by_type': by_type,
            'daily_activity': daily_activity,
            'avg_response_time_hours': 2.5,  # Placeholder
            'most_active_day': max(daily_activity, key=lambda x: x['count'])['date'] if daily_activity else None
        })