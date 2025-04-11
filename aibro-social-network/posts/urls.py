# posts/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, get_posts_count

router = DefaultRouter()
router.register(r'', PostViewSet, basename='post')

urlpatterns = [
    path('count/', get_posts_count, name='posts-count'),
    path('', include(router.urls)),
]