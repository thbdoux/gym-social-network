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
    get_recent_exercises,         
    get_recent_exercise_names,
)
from .group_workout_views import GroupWorkoutViewSet

from users.profile_preview_api import get_program_details, get_workout_log_details
router = DefaultRouter()
router.register(r'templates', WorkoutTemplateViewSet, basename='template')
router.register(r'programs', ProgramViewSet, basename='program')
router.register(r'logs', WorkoutLogViewSet, basename='log')
router.register(r'group-workouts', GroupWorkoutViewSet, basename='group-workout')


# Create a nested router for program workouts
program_router = routers.NestedSimpleRouter(router, r'programs', lookup='program')
program_router.register(r'workouts', WorkoutInstanceViewSet, basename='program-workouts')

urlpatterns = [
    path('logs/count/', get_workouts_count, name='workouts-count'),
    # Add to urlpatterns
    path('logs/user/<int:user_id>/count/', get_user_workouts_count, name='user-workouts-count'),
    # Add to workouts/urls.py
    path('logs/user/<str:username>/', get_user_logs_by_username, name='user-logs-by-username'),
    path('logs/recent-exercises/', get_recent_exercises, name='recent-exercises'),               
    path('logs/recent-exercise-names/', get_recent_exercise_names, name='recent-exercise-names'),
    path('', include(router.urls)),
    path('', include(program_router.urls)),
    path('programs/<int:program_id>/details/', get_program_details, name='program-details'),
    path('logs/<int:log_id>/details/', get_workout_log_details, name='workout-log-details'),
    path('group-workouts/<int:pk>/messages/', GroupWorkoutViewSet.as_view({'get': 'messages'}), name='group-workout-messages'),
    path('group-workouts/<int:pk>/join-requests/', GroupWorkoutViewSet.as_view({'get': 'join_requests'}), name='group-workout-join-requests'),
    path('group-workouts/<int:pk>/participants/', GroupWorkoutViewSet.as_view({'get': 'participants'}), name='group-workout-participants'),
    path('group-workouts/<int:pk>/proposals/', 
         GroupWorkoutViewSet.as_view({'get': 'proposals'}), 
         name='group-workout-proposals'),
    path('group-workouts/<int:pk>/propose/', 
         GroupWorkoutViewSet.as_view({'post': 'propose'}), 
         name='group-workout-propose'),
    path('group-workouts/<int:pk>/vote/', 
         GroupWorkoutViewSet.as_view({'post': 'vote'}), 
         name='group-workout-vote'),
    path('group-workouts/<int:pk>/remove-vote/', 
         GroupWorkoutViewSet.as_view({'delete': 'remove_vote'}), 
         name='group-workout-remove-vote'),
    path('group-workouts/<int:pk>/most-voted-proposal/', 
         GroupWorkoutViewSet.as_view({'get': 'most_voted_proposal'}), 
         name='group-workout-most-voted-proposal'),
]