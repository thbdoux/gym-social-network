# posts/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from .views import PostViewSet, get_posts_count, get_user_posts_count, CommentViewSet

router = DefaultRouter()
router.register(r'', PostViewSet, basename='post')

# Create a nested router for comments
post_router = routers.NestedSimpleRouter(router, r'', lookup='post')
post_router.register(r'comments', CommentViewSet, basename='post-comments')

urlpatterns = [
    path('count/', get_posts_count, name='posts-count'),
    path('user/<int:user_id>/count/', get_user_posts_count, name='user-posts-count'),
    path('', include(router.urls)),
    path('', include(post_router.urls)),
]