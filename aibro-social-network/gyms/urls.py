# gyms/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GymViewSet

router = DefaultRouter()
router.register(r'', GymViewSet)

urlpatterns = [
    path('', include(router.urls)),
]