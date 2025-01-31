from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from .models import (
    WorkoutTemplate, ExerciseTemplate, SetTemplate,
    Program, WorkoutLog, ExerciseLog, SetLog
)
from .serializers import (
    WorkoutTemplateSerializer, ExerciseTemplateSerializer, SetTemplateSerializer,
    ProgramSerializer,
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

    @action(detail=True, methods=['patch'])
    def update_details(self, request, pk=None):
        """Update basic details of the workout template"""
        workout = self.get_object()
        serializer = WorkoutTemplateSerializer(
            workout,
            data=request.data,
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
    
    @action(detail=True, methods=['delete'])
    def remove_exercise(self, request, pk=None):
        """Remove an exercise from the workout template"""
        workout = self.get_object()
        exercise_id = request.data.get('exercise_id')
        
        try:
            exercise = workout.exercises.get(id=exercise_id)
            exercise.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ExerciseTemplate.DoesNotExist:
            return Response(
                {"detail": "Exercise not found"},
                status=status.HTTP_404_NOT_FOUND
            )



class ProgramViewSet(viewsets.ModelViewSet):
    serializer_class = ProgramSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Program.objects.filter(
            user=self.request.user
        ).prefetch_related('workouts', 'workouts__exercises')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def add_workout(self, request, pk=None):
        """Add a workout template to the program"""
        program = self.get_object()
        
        # Get or create the workout template
        template_id = request.data.get('template_id')
        if template_id:
            try:
                template = WorkoutTemplate.objects.get(id=template_id, user=request.user)
            except WorkoutTemplate.DoesNotExist:
                return Response(
                    {"detail": "Workout template not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Create new template if not existing
            template_serializer = WorkoutTemplateSerializer(data=request.data)
            if template_serializer.is_valid():
                template = template_serializer.save(user=request.user)
            else:
                return Response(template_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Update template with program association
        template.program = program
        template.preferred_weekday = request.data.get('preferred_weekday')
        template.order = request.data.get('order')
        template.save()
        
        serializer = WorkoutTemplateSerializer(template)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def remove_workout(self, request, pk=None):
        """Remove a workout from the program"""
        program = self.get_object()
        template_id = request.data.get('template_id')
        
        try:
            template = program.workouts.get(id=template_id)
            template.program = None
            template.preferred_weekday = None
            template.order = None
            template.save()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except WorkoutTemplate.DoesNotExist:
            return Response(
                {"detail": "Workout template not found in program"},
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

