# posts/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, get_posts_count, get_user_posts_count


router = DefaultRouter()
router.register(r'', PostViewSet, basename='post')

urlpatterns = [
    path('count/', get_posts_count, name='posts-count'),
    # Add to urlpatterns before the router includes
    path('user/<int:user_id>/count/', get_user_posts_count, name='user-posts-count'),
    path('', include(router.urls)),
]