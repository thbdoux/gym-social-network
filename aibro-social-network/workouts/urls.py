# workouts/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from .views import (
    WorkoutTemplateViewSet, 
    ProgramViewSet, 
    WorkoutInstanceViewSet, 
    WorkoutLogViewSet,
    get_workouts_count,
    get_user_workouts_count,
    get_user_logs_by_username,
)

from users.profile_preview_api import get_program_details, get_workout_log_details
router = DefaultRouter()
router.register(r'templates', WorkoutTemplateViewSet, basename='template')
router.register(r'programs', ProgramViewSet, basename='program')
router.register(r'logs', WorkoutLogViewSet, basename='log')

# Create a nested router for program workouts
program_router = routers.NestedSimpleRouter(router, r'programs', lookup='program')
program_router.register(r'workouts', WorkoutInstanceViewSet, basename='program-workouts')

urlpatterns = [
    path('logs/count/', get_workouts_count, name='workouts-count'),
    # Add to urlpatterns
    path('logs/user/<int:user_id>/count/', get_user_workouts_count, name='user-workouts-count'),
    # Add to workouts/urls.py
    path('logs/user/<str:username>/', get_user_logs_by_username, name='user-logs-by-username'),
    path('', include(router.urls)),
    path('', include(program_router.urls)),
    path('programs/<int:program_id>/details/', get_program_details, name='program-details'),
    path('logs/<int:log_id>/details/', get_workout_log_details, name='workout-log-details'),
]