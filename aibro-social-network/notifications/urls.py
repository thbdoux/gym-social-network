# notifications/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, NotificationPreferenceViewSet, DeviceTokenViewSet

router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'preferences', NotificationPreferenceViewSet, basename='preferences')
router.register(r'device-tokens', DeviceTokenViewSet, basename='device-tokens')

urlpatterns = [
    path('', include(router.urls)),
]