# workouts/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from .views import WorkoutTemplateViewSet, ProgramViewSet, WorkoutInstanceViewSet, WorkoutLogViewSet

router = DefaultRouter()
router.register(r'templates', WorkoutTemplateViewSet, basename='template')
router.register(r'programs', ProgramViewSet, basename='program')
router.register(r'logs', WorkoutLogViewSet, basename='log')

# Create a nested router for program workouts
program_router = routers.NestedSimpleRouter(router, r'programs', lookup='program')
program_router.register(r'workouts', WorkoutInstanceViewSet, basename='program-workouts')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(program_router.urls)),
]