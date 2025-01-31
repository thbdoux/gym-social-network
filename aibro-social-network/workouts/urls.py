from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkoutTemplateViewSet, ProgramViewSet, WorkoutLogViewSet

router = DefaultRouter()
router.register(r'templates', WorkoutTemplateViewSet, basename='workouttemplate')
router.register(r'programs', ProgramViewSet, basename='program')
router.register(r'logs', WorkoutLogViewSet, basename='workoutlog')

urlpatterns = [
    path('', include(router.urls)),
]