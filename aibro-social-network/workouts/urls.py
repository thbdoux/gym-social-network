# workouts/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkoutViewSet, ExerciseViewSet, WorkoutLogViewSet, WorkoutPlanViewSet

router = DefaultRouter()
router.register(r'workouts', WorkoutViewSet, basename='workout')
router.register(r'exercises', ExerciseViewSet, basename='exercise')
router.register(r'logs', WorkoutLogViewSet, basename='workoutlog')

router.register(r'plans', WorkoutPlanViewSet, basename='workoutplan')

urlpatterns = [
    path('', include(router.urls)),
]