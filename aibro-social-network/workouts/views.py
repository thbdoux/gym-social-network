# # workouts/views.py
# from rest_framework import viewsets, permissions, status
# from rest_framework.decorators import action
# from rest_framework.response import Response
# from django.db import transaction
# from django.db.models import Count
# from .models import Workout, Exercise, Set, WorkoutLog, LoggedSet, PlanWorkout, WorkoutPlan
# from .serializers import (
#     WorkoutSerializer, ExerciseSerializer, SetSerializer,
#     WorkoutLogSerializer, LoggedSetSerializer, WorkoutPlanSerializer, PlanWorkoutSerializer
# )

# class WorkoutViewSet(viewsets.ModelViewSet):
#     serializer_class = WorkoutSerializer
#     permission_classes = [permissions.IsAuthenticated]

#     def get_queryset(self):
#         queryset = Workout.objects.filter(user=self.request.user)
#         template_only = self.request.query_params.get('template', None)
#         if template_only is not None:
#             queryset = queryset.filter(is_template=template_only.lower() == 'true')
#         return queryset.prefetch_related('exercises', 'exercises__sets')

#     def perform_create(self, serializer):
#         serializer.save(user=self.request.user)

#     @action(detail=True, methods=['post'])
#     def add_exercise(self, request, pk=None):
#         """Add an exercise to the workout"""
#         workout = self.get_object()
#         serializer = ExerciseSerializer(data=request.data)
#         if serializer.is_valid():
#             serializer.save(workout=workout)
#             return Response(serializer.data, status=status.HTTP_201_CREATED)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#     @action(detail=True, methods=['post'])
#     def copy(self, request, pk=None):
#         """Copy a workout (useful for templates)"""
#         original = self.get_object()
        
#         with transaction.atomic():
#             # Copy workout
#             new_workout = Workout.objects.create(
#                 user=request.user,
#                 name=f"Copy of {original.name}",
#                 description=original.description,
#                 frequency=original.frequency,
#                 split_method=original.split_method,
#                 is_template=False
#             )

#             # Copy exercises and sets
#             for exercise in original.exercises.all():
#                 new_exercise = Exercise.objects.create(
#                     workout=new_workout,
#                     name=exercise.name,
#                     equipment=exercise.equipment,
#                     notes=exercise.notes,
#                     order=exercise.order
#                 )
                
#                 for set_obj in exercise.sets.all():
#                     Set.objects.create(
#                         exercise=new_exercise,
#                         reps=set_obj.reps,
#                         weight=set_obj.weight,
#                         rest_time=set_obj.rest_time,
#                         order=set_obj.order
#                     )

#         serializer = self.get_serializer(new_workout)
#         return Response(serializer.data, status=status.HTTP_201_CREATED)

# class ExerciseViewSet(viewsets.ModelViewSet):
#     serializer_class = ExerciseSerializer
#     permission_classes = [permissions.IsAuthenticated]

#     def get_queryset(self):
#         return Exercise.objects.filter(
#             workout__user=self.request.user
#         ).prefetch_related('sets')

#     @action(detail=True, methods=['post'])
#     def add_set(self, request, pk=None):
#         """Add a set to the exercise"""
#         exercise = self.get_object()
#         serializer = SetSerializer(data=request.data)
#         if serializer.is_valid():
#             serializer.save(exercise=exercise)
#             return Response(serializer.data, status=status.HTTP_201_CREATED)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# class WorkoutLogViewSet(viewsets.ModelViewSet):
#     serializer_class = WorkoutLogSerializer
#     permission_classes = [permissions.IsAuthenticated]

#     def get_queryset(self):
#         return WorkoutLog.objects.filter(
#             user=self.request.user
#         ).select_related('workout', 'gym').prefetch_related('logged_sets')

#     def perform_create(self, serializer):
#         serializer.save(user=self.request.user)

#     @action(detail=True, methods=['post'])
#     def log_set(self, request, pk=None):
#         """Log a set during the workout"""
#         workout_log = self.get_object()
#         serializer = LoggedSetSerializer(data=request.data)
#         if serializer.is_valid():
#             serializer.save(workout_log=workout_log)
#             return Response(serializer.data, status=status.HTTP_201_CREATED)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#     @action(detail=False, methods=['get'])
#     def stats(self, request):
#         """Get workout statistics"""
#         logs = self.get_queryset()
        
#         stats = {
#             'total_workouts': logs.count(),
#             'completed_workouts': logs.filter(completed=True).count(),
#             'workouts_by_type': logs.values('workout__split_method').annotate(
#                 count=Count('id')
#             ),
#             'workouts_by_gym': logs.values('gym__name').annotate(
#                 count=Count('id')
#             ).exclude(gym__isnull=True)
#         }
        
#         return Response(stats)

# class WorkoutPlanViewSet(viewsets.ModelViewSet):
#     serializer_class = WorkoutPlanSerializer
#     permission_classes = [permissions.IsAuthenticated]

#     def get_queryset(self):
#         queryset = WorkoutPlan.objects.filter(user=self.request.user)
#         active_only = self.request.query_params.get('active', None)
#         if active_only is not None:
#             queryset = queryset.filter(is_active=active_only.lower() == 'true')
#         return queryset.prefetch_related('plan_workouts', 'plan_workouts__workout')

#     def perform_create(self, serializer):
#         serializer.save(user=self.request.user)

#     @action(detail=True, methods=['post'])
#     def add_workout(self, request, pk=None):
#         """Add a workout to the plan"""
#         plan = self.get_object()
#         serializer = PlanWorkoutSerializer(data=request.data)
#         if serializer.is_valid():
#             serializer.save(plan=plan)
#             return Response(serializer.data, status=status.HTTP_201_CREATED)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#     @action(detail=True, methods=['post'])
#     def toggle_active(self, request, pk=None):
#         """Toggle the active status of the plan"""
#         plan = self.get_object()
#         plan.is_active = not plan.is_active
#         plan.save()
#         serializer = self.get_serializer(plan)
#         return Response(serializer.data)

# workouts/views.py

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from .models import (
    WorkoutTemplate, ExerciseTemplate, SetTemplate,
    Program, ScheduledWorkout, WorkoutLog, ExerciseLog, SetLog
)
from .serializers import (
    WorkoutTemplateSerializer, ExerciseTemplateSerializer, SetTemplateSerializer,
    ProgramSerializer, ScheduledWorkoutSerializer,
    WorkoutLogSerializer, ExerciseLogSerializer, SetLogSerializer
)

class WorkoutTemplateViewSet(viewsets.ModelViewSet):
    """
    Manage workout templates (the blueprints of workouts)
    """
    serializer_class = WorkoutTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkoutTemplate.objects.filter(
            user=self.request.user
        ).prefetch_related(
            'exercises',
            'exercises__sets'
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def add_exercise(self, request, pk=None):
        """Add an exercise to the workout template"""
        workout = self.get_object()
        serializer = ExerciseTemplateSerializer(data=request.data)
        
        with transaction.atomic():
            if serializer.is_valid():
                exercise = serializer.save(workout=workout)
                
                # Create sets if provided
                sets_data = request.data.get('sets', [])
                for set_data in sets_data:
                    set_serializer = SetTemplateSerializer(data=set_data)
                    if set_serializer.is_valid():
                        set_serializer.save(exercise=exercise)
                    else:
                        return Response(set_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProgramViewSet(viewsets.ModelViewSet):
    """
    Manage workout programs (collections of scheduled templates)
    """
    serializer_class = ProgramSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Program.objects.filter(
            user=self.request.user
        ).prefetch_related(
            'scheduled_workouts',
            'scheduled_workouts__workout_template'
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def schedule_workout(self, request, pk=None):
        """Add a workout template to the program's schedule"""
        program = self.get_object()
        serializer = ScheduledWorkoutSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(program=program)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['delete'])
    def remove_scheduled_workout(self, request, pk=None):
        """Remove a workout from the program's schedule"""
        program = self.get_object()
        scheduled_workout_id = request.data.get('scheduled_workout_id')
        
        try:
            scheduled_workout = program.scheduled_workouts.get(id=scheduled_workout_id)
            scheduled_workout.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ScheduledWorkout.DoesNotExist:
            return Response(
                {"detail": "Scheduled workout not found"},
                status=status.HTTP_404_NOT_FOUND
            )

class WorkoutLogViewSet(viewsets.ModelViewSet):
    """
    Manage workout logs (records of performed workouts)
    """
    serializer_class = WorkoutLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkoutLog.objects.filter(
            user=self.request.user
        ).select_related(
            'program',
            'workout_template',
            'gym'
        ).prefetch_related(
            'exercises',
            'exercises__sets'
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def log_exercise(self, request, pk=None):
        """Add an exercise log to the workout log"""
        workout_log = self.get_object()
        serializer = ExerciseLogSerializer(data=request.data)
        
        with transaction.atomic():
            if serializer.is_valid():
                exercise = serializer.save(workout_log=workout_log)
                
                # Create sets if provided
                sets_data = request.data.get('sets', [])
                for set_data in sets_data:
                    set_serializer = SetLogSerializer(data=set_data)
                    if set_serializer.is_valid():
                        set_serializer.save(exercise=exercise)
                    else:
                        return Response(set_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def log_from_template(self, request):
        """Create a new workout log based on a template"""
        template_id = request.data.get('template_id')
        program_id = request.data.get('program_id')
        
        try:
            template = WorkoutTemplate.objects.get(id=template_id)
            
            with transaction.atomic():
                # Create workout log
                workout_log = WorkoutLog.objects.create(
                    user=self.request.user,
                    workout_template=template,
                    program_id=program_id,
                    date=request.data.get('date'),
                    gym_id=request.data.get('gym_id'),
                    notes=request.data.get('notes', '')
                )
                
                # Copy exercises and sets from template
                for template_exercise in template.exercises.all():
                    exercise_log = ExerciseLog.objects.create(
                        workout_log=workout_log,
                        template=template_exercise,
                        name=template_exercise.name,
                        equipment=template_exercise.equipment,
                        notes=template_exercise.notes,
                        order=template_exercise.order
                    )
                    
                    for template_set in template_exercise.sets.all():
                        SetLog.objects.create(
                            exercise=exercise_log,
                            template=template_set,
                            reps=template_set.reps,
                            weight=template_set.weight,
                            rest_time=template_set.rest_time,
                            order=template_set.order
                        )
                
                serializer = self.get_serializer(workout_log)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
                
        except WorkoutTemplate.DoesNotExist:
            return Response(
                {"detail": "Workout template not found"},
                status=status.HTTP_404_NOT_FOUND
            )

