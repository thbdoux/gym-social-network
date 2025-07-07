# notifications/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, NotificationPreferenceView, DeviceTokenViewSet

app_name = 'notifications'

router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'device-tokens', DeviceTokenViewSet, basename='device-token')

urlpatterns = [
    # Standard router URLs
    path('', include(router.urls)),
    
    # Custom notification preferences endpoint (singleton pattern)
    path('preferences/', NotificationPreferenceView.as_view(), name='notification-preferences'),
]