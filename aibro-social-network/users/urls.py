# users/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import UserViewSet, UserProfileView, reset_user_current_program
from .profile_preview_api import (
    get_user_profile_preview, 
    get_user_friends, 
    get_user_posts,
)

router = DefaultRouter()
router.register(r'', UserViewSet, basename = 'user')

urlpatterns = [
    path('me/', UserProfileView.as_view(), name='me'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Add these new profile preview endpoints
    path('<int:user_id>/profile-preview/', get_user_profile_preview, name='user-profile-preview'),
    path('<int:user_id>/friends/', get_user_friends, name='user-friends'),
    path('<int:user_id>/posts/', get_user_posts, name='user-posts'),
    path('<int:user_id>/reset-current-program/', reset_user_current_program, name='reset-user-current-program'),
    path('', include(router.urls)),
]