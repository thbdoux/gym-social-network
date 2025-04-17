# users/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

from .views import (
    UserViewSet, 
    UserProfileView, 
    reset_user_current_program, 
    update_language_preference,
    get_all_counts,
    get_friends_count,
    get_user_all_counts,
    get_user_friends_count,
    check_friendship_status,
)   
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
    
    path('update-language/', update_language_preference, name='update-language-preference'),
    path('<int:user_id>/friendship-status/', check_friendship_status, name='friendship-status'),
    path('<int:user_id>/profile-preview/', get_user_profile_preview, name='user-profile-preview'),
    path('<int:user_id>/friends/', get_user_friends, name='user-friends'),
    path('<int:user_id>/posts/', get_user_posts, name='user-posts'),
    path('<int:user_id>/reset-current-program/', reset_user_current_program, name='reset-user-current-program'),
    path('', include(router.urls)),
    path('friends/count/', get_friends_count, name='friends-count'),
    path('me/counts/', get_all_counts, name='all-counts'),
    # Add to urlpatterns
    path('<int:user_id>/friends/count/', get_user_friends_count, name='user-friends-count'),
    path('<int:user_id>/counts/', get_user_all_counts, name='user-all-counts'),
    # New auth endpoints
    path('register/', views.register_user, name='register'),
    path('verify-email/', views.verify_email, name='verify-email'),
    path('resend-verification/', views.resend_verification, name='resend-verification'),
    path('social-auth/', views.social_auth_callback, name='social-auth'),
    
    # Include dj-rest-auth URLs
    path('auth/', include('dj_rest_auth.urls')),
]