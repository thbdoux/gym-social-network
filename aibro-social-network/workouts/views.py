# workouts/views.py
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction, models
from django.db.models import Q, Count

from .models import (
    WorkoutTemplate, ExerciseTemplate, SetTemplate,
    Program, WorkoutInstance, ExerciseInstance, SetInstance, ProgramShare,
    WorkoutLog, ExerciseLog, SetLog
)
from .serializers import (
    WorkoutTemplateSerializer, ExerciseTemplateSerializer, SetTemplateSerializer,
    ProgramSerializer, WorkoutInstanceSerializer, ExerciseInstanceSerializer,
    SetInstanceSerializer, ProgramShareSerializer,
    WorkoutLogSerializer, WorkoutLogCreateSerializer, WorkoutLogUpdateSerializer,
    ExerciseLogSerializer, SetLogSerializer
)

# Template Views
class WorkoutTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'name']

    def get_queryset(self):
        return WorkoutTemplate.objects.filter(
            Q(creator=self.request.user)
        ).prefetch_related(
            'exercises',
            'exercises__sets'
        )

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    @action(detail=True, methods=['post'])
    def add_exercise(self, request, pk=None):
        """Add an exercise with sets to the template"""
        workout = self.get_object()
        serializer = ExerciseTemplateSerializer(data=request.data)
        
        with transaction.atomic():
            if serializer.is_valid():
                exercise = serializer.save(workout=workout)
                
                sets_data = request.data.get('sets', [])
                for set_data in sets_data:
                    set_serializer = SetTemplateSerializer(data=set_data)
                    if set_serializer.is_valid():
                        set_serializer.save(exercise=exercise)
                    else:
                        return Response(
                            set_serializer.errors,
                            status=status.HTTP_400_BAD_REQUEST
                        )
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Program Views
class ProgramViewSet(viewsets.ModelViewSet):
    serializer_class = ProgramSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Program.objects.filter(
            Q(creator=self.request.user)
        ).prefetch_related(
            'workout_instances',
            'workout_instances__exercises',
            'workout_instances__exercises__sets',
            'likes'
        ).annotate(
            likes_count=Count('likes', distinct=True),
            forks_count=Count('forks', distinct=True)
        )

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    @action(detail=True, methods=['post'], url_path='update_workout/(?P<workout_id>[^/.]+)')
    def update_workout(self, request, pk=None, workout_id=None):
        """Update a specific workout instance within this program"""
        program = self.get_object()
        
        try:
            workout = program.workout_instances.get(id=workout_id)
            
            with transaction.atomic():
                # Update basic workout info
                if 'name' in request.data:
                    workout.name = request.data['name']
                if 'description' in request.data:
                    workout.description = request.data['description']
                if 'preferred_weekday' in request.data:
                    workout.preferred_weekday = request.data['preferred_weekday']
                if 'split_method' in request.data:
                    workout.split_method = request.data['split_method']
                if 'order' in request.data:
                    workout.order = request.data['order']
                workout.save()
                
                # Handle exercises
                if 'exercises' in request.data:
                    current_exercise_ids = set(workout.exercises.values_list('id', flat=True))
                    updated_exercise_ids = set()
                    
                    for ex_data in request.data['exercises']:
                        exercise_id = ex_data.get('id')
                        
                        if exercise_id:
                            # Update existing exercise
                            exercise = workout.exercises.get(id=exercise_id)
                            for field in ['name', 'equipment', 'notes', 'order']:
                                if field in ex_data:
                                    setattr(exercise, field, ex_data[field])
                            exercise.save()
                            updated_exercise_ids.add(exercise_id)
                        else:
                            # Create new exercise
                            exercise = ExerciseInstance.objects.create(
                                workout=workout,
                                name=ex_data['name'],
                                equipment=ex_data.get('equipment', ''),
                                notes=ex_data.get('notes', ''),
                                order=ex_data['order']
                            )
                            updated_exercise_ids.add(exercise.id)
                        
                        # Handle sets for this exercise
                        if 'sets' in ex_data:
                            # Remove existing sets
                            if exercise_id:
                                exercise.sets.all().delete()
                            
                            # Create new sets
                            for set_data in ex_data['sets']:
                                SetInstance.objects.create(
                                    exercise=exercise,
                                    reps=set_data['reps'],
                                    weight=set_data['weight'],
                                    rest_time=set_data['rest_time'],
                                    order=set_data['order']
                                )
                    
                    # Delete exercises that weren't updated or created
                    exercises_to_delete = current_exercise_ids - updated_exercise_ids
                    workout.exercises.filter(id__in=exercises_to_delete).delete()
                
                # Return updated workout
                serializer = WorkoutInstanceSerializer(workout)
                return Response(serializer.data)
                
        except WorkoutInstance.DoesNotExist:
            return Response(
                {"detail": "Workout not found in this program"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'], url_path='delete_exercise/(?P<workout_id>[^/.]+)')
    def delete_workout_exercise(self, request, pk=None, workout_id=None):
        """Delete an exercise from a specific workout instance within this program"""
        program = self.get_object()
        exercise_id = request.data.get('exercise_id')
        
        try:
            workout = program.workout_instances.get(id=workout_id)
            exercise = workout.exercises.get(id=exercise_id)
            exercise.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except WorkoutInstance.DoesNotExist:
            return Response(
                {"detail": "Workout not found in this program"},
                status=status.HTTP_404_NOT_FOUND
            )
        except ExerciseInstance.DoesNotExist:
            return Response(
                {"detail": "Exercise not found in this workout"},
                status=status.HTTP_404_NOT_FOUND
            )
            
    @action(detail=True, methods=['post'])
    def add_workout(self, request, pk=None):
        """Add a workout to the program, optionally based on a template"""
        program = self.get_object()
        template_id = request.data.get('template_id')
        
        try:
            with transaction.atomic():
                if template_id:
                    # Copy from template
                    template = WorkoutTemplate.objects.prefetch_related(
                        'exercises', 'exercises__sets'
                    ).get(
                        Q(id=template_id),
                        Q(creator=request.user) | Q(is_public=True)
                    )
                    
                    # Create workout instance
                    instance = WorkoutInstance.objects.create(
                        program=program,
                        based_on_template=template,
                        name=template.name,
                        description=template.description,
                        split_method=template.split_method,
                        preferred_weekday=request.data.get('preferred_weekday', 0),
                        order=program.workout_instances.count()
                    )
                    
                    # Copy exercises and sets
                    for ex_template in template.exercises.all():
                        ex_instance = ExerciseInstance.objects.create(
                            workout=instance,
                            based_on_template=ex_template,
                            name=ex_template.name,
                            equipment=ex_template.equipment,
                            notes=ex_template.notes,
                            order=ex_template.order
                        )
                        
                        for set_template in ex_template.sets.all():
                            SetInstance.objects.create(
                                exercise=ex_instance,
                                based_on_template=set_template,
                                reps=set_template.reps,
                                weight=set_template.weight,
                                rest_time=set_template.rest_time,
                                order=set_template.order
                            )
                else:
                    # Create empty workout instance
                    instance = WorkoutInstance.objects.create(
                        program=program,
                        name=request.data.get('name', 'New Workout'),
                        description=request.data.get('description', ''),
                        split_method=request.data.get('split_method', 'custom'),
                        preferred_weekday=request.data.get('preferred_weekday', 0),
                        order=program.workout_instances.count()
                    )
                
                serializer = WorkoutInstanceSerializer(instance)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
                
        except WorkoutTemplate.DoesNotExist:
            return Response(
                {"detail": "Template not found or not accessible"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    

    @action(detail=True, methods=['post'])
    def fork(self, request, pk=None):
        """Create a copy of this program with all workouts"""
        original_program = self.get_object()
        
        with transaction.atomic():
            # Create new program
            new_program = Program.objects.create(
                creator=request.user,
                forked_from=original_program,
                name=f"Fork of {original_program.name}",
                description=original_program.description,
                focus=original_program.focus,
                sessions_per_week=original_program.sessions_per_week,
                is_active=False,
                is_public=False,
                difficulty_level=original_program.difficulty_level,
                recommended_level=original_program.recommended_level,
                required_equipment=original_program.required_equipment,
                estimated_completion_weeks=original_program.estimated_completion_weeks,
                tags=original_program.tags
            )
            
            # Clone workout instances with their exercises and sets
            for orig_workout in original_program.workout_instances.all():
                new_workout = WorkoutInstance.objects.create(
                    program=new_program,
                    based_on_template=orig_workout.based_on_template,
                    name=orig_workout.name,
                    description=orig_workout.description,
                    split_method=orig_workout.split_method,
                    preferred_weekday=orig_workout.preferred_weekday,
                    order=orig_workout.order
                )
                
                for orig_exercise in orig_workout.exercises.all():
                    new_exercise = ExerciseInstance.objects.create(
                        workout=new_workout,
                        based_on_template=orig_exercise.based_on_template,
                        name=orig_exercise.name,
                        equipment=orig_exercise.equipment,
                        notes=orig_exercise.notes,
                        order=orig_exercise.order
                    )
                    
                    for orig_set in orig_exercise.sets.all():
                        SetInstance.objects.create(
                            exercise=new_exercise,
                            based_on_template=orig_set.based_on_template,
                            reps=orig_set.reps,
                            weight=orig_set.weight,
                            rest_time=orig_set.rest_time,
                            order=orig_set.order
                        )
            
            serializer = self.get_serializer(new_program)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        """Like/unlike this program"""
        program = self.get_object()
        user = request.user
        
        if user in program.likes.all():
            program.likes.remove(user)
            return Response({'liked': False})
        else:
            program.likes.add(user)
            return Response({'liked': True})

    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        """Share program with another user"""
        program = self.get_object()
        username = request.data.get('username')
        
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.get(username=username)
            
            share, created = ProgramShare.objects.get_or_create(
                program=program,
                shared_with=user
            )
            
            serializer = ProgramShareSerializer(share)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )

class WorkoutLogViewSet(viewsets.ModelViewSet):
    """Handle workout logs with their exercises and sets"""
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['date', 'created_at']
    ordering = ['-date', '-created_at']

    def get_serializer_class(self):
        if self.action in ['create']:
            return WorkoutLogCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return WorkoutLogUpdateSerializer
        return WorkoutLogSerializer

    def get_queryset(self):
        return WorkoutLog.objects.filter(
            user=self.request.user
        ).select_related(
            'program',
            'based_on_instance',
            'gym'
        ).prefetch_related(
            'exercises',
            'exercises__sets'
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def log_from_instance(self, request):
        """Create a new workout log based on a program workout instance"""
        instance_id = request.data.get('instance_id')
        try:
            instance = WorkoutInstance.objects.select_related(
                'program'
            ).prefetch_related(
                'exercises',
                'exercises__sets'
            ).get(id=instance_id)
            
            with transaction.atomic():
                # Create workout log
                workout_log = WorkoutLog.objects.create(
                    user=request.user,
                    based_on_instance=instance,
                    program=instance.program,
                    name=instance.name,
                    date=request.data.get('date'),
                    gym_id=request.data.get('gym_id'),
                    notes=request.data.get('notes', ''),
                    mood_rating=request.data.get('mood_rating'),
                    perceived_difficulty=request.data.get('perceived_difficulty'),
                    performance_notes=request.data.get('performance_notes', ''),
                    completed=request.data.get('completed', False)
                )
                
                # Copy exercises and sets from instance
                for instance_exercise in instance.exercises.all():
                    exercise_log = ExerciseLog.objects.create(
                        workout=workout_log,
                        based_on_instance=instance_exercise,
                        name=instance_exercise.name,
                        equipment=instance_exercise.equipment,
                        notes=instance_exercise.notes,
                        order=instance_exercise.order
                    )
                    
                    for instance_set in instance_exercise.sets.all():
                        SetLog.objects.create(
                            exercise=exercise_log,
                            based_on_instance=instance_set,
                            reps=instance_set.reps,
                            weight=instance_set.weight,
                            rest_time=instance_set.rest_time,
                            order=instance_set.order
                        )
                
                serializer = WorkoutLogSerializer(workout_log)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
                
        except WorkoutInstance.DoesNotExist:
            return Response(
                {"detail": "Workout instance not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def update_exercise(self, request, pk=None):
        """Update or add an exercise in the workout log"""
        workout_log = self.get_object()
        exercise_id = request.data.get('exercise_id')
        
        try:
            with transaction.atomic():
                if exercise_id:
                    # Update existing exercise
                    exercise = workout_log.exercises.get(id=exercise_id)
                    serializer = ExerciseLogSerializer(
                        exercise,
                        data=request.data,
                        partial=True
                    )
                else:
                    # Create new exercise
                    serializer = ExerciseLogSerializer(data={
                        **request.data,
                        'workout': workout_log.id
                    })
                
                if serializer.is_valid():
                    exercise = serializer.save()
                    
                    # Handle sets
                    if 'sets' in request.data:
                        # Remove existing sets
                        exercise.sets.all().delete()
                        
                        # Create new sets
                        for set_data in request.data['sets']:
                            SetLog.objects.create(
                                exercise=exercise,
                                reps=set_data['reps'],
                                weight=set_data['weight'],
                                rest_time=set_data['rest_time'],
                                order=set_data['order']
                            )
                    
                    # Return updated exercise with sets
                    updated = ExerciseLog.objects.prefetch_related('sets').get(id=exercise.id)
                    return Response(ExerciseLogSerializer(updated).data)
                    
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except ExerciseLog.DoesNotExist:
            return Response(
                {"detail": "Exercise not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False)
    def stats(self, request):
        """Get workout statistics"""
        queryset = self.get_queryset()
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
            
        total_workouts = queryset.count()
        completed_workouts = queryset.filter(completed=True).count()
        
        return Response({
            'total_workouts': total_workouts,
            'completed_workouts': completed_workouts,
            'completion_rate': completed_workouts/total_workouts if total_workouts > 0 else 0
        })

        