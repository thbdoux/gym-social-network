# workouts/views.py
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Q, Count, F
from django.core.exceptions import ValidationError
import logging

logger = logging.getLogger(__name__)

from .models import (
    WorkoutTemplate, ExerciseTemplate, SetTemplate,
    Program, WorkoutInstance, ExerciseInstance, SetInstance,
    WorkoutLog, ExerciseLog, SetLog, ProgramShare
)
from .serializers import (
    WorkoutTemplateSerializer, ExerciseTemplateSerializer, SetTemplateSerializer,
    ProgramSerializer, WorkoutInstanceSerializer, ExerciseInstanceSerializer,
    SetInstanceSerializer, ProgramShareSerializer,
    WorkoutLogSerializer, WorkoutLogCreateSerializer, WorkoutLogUpdateSerializer,
    ExerciseLogSerializer, SetLogSerializer
)

class WorkoutInstanceViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutInstanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return WorkoutInstance.objects.filter(
            program__creator=self.request.user
        ).prefetch_related('exercises', 'exercises__sets')

    def perform_update(self, serializer):
        logger.info(f"Update data received: {self.request.data}")
        serializer.save()


class WorkoutTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'name']

    def get_queryset(self):
        return WorkoutTemplate.objects.filter(
            creator=self.request.user
        ).prefetch_related(
            'exercises',
            'exercises__sets'
        )

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    @action(detail=True, methods=['post'])
    def add_exercise(self, request, pk=None):
        workout = self.get_object()
        serializer = ExerciseTemplateSerializer(data=request.data)
        
        with transaction.atomic():
            if serializer.is_valid():
                exercise = serializer.save(workout=workout)
                
                for set_data in request.data.get('sets', []):
                    set_serializer = SetTemplateSerializer(data=set_data)
                    if set_serializer.is_valid():
                        set_serializer.save(exercise=exercise)
                    else:
                        return Response(set_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post', 'put', 'delete'], url_path='exercises/(?P<exercise_id>[^/.]+)')
    def handle_exercise(self, request, pk=None, exercise_id=None):
        """Handle exercise operations (update, delete) within a template"""
        workout = self.get_object()
        
        try:
            if exercise_id != 'new':  # Handle existing exercise
                exercise = workout.exercises.get(id=exercise_id)
                
                if request.method == 'DELETE':
                    exercise.delete()
                    return Response(status=status.HTTP_204_NO_CONTENT)
                
                # Update existing exercise
                serializer = ExerciseTemplateSerializer(
                    exercise,
                    data=request.data,
                    partial=True
                )
            else:  # Handle new exercise
                serializer = ExerciseTemplateSerializer(data=request.data)
            
            if serializer.is_valid():
                if exercise_id == 'new':
                    exercise = serializer.save(workout=workout)
                else:
                    exercise = serializer.save()
                
                # Handle sets if provided
                if 'sets' in request.data:
                    # Remove existing sets
                    exercise.sets.all().delete()
                    
                    # Create new sets
                    for set_data in request.data['sets']:
                        set_serializer = SetTemplateSerializer(data=set_data)
                        if set_serializer.is_valid():
                            set_serializer.save(exercise=exercise)
                        else:
                            return Response(
                                set_serializer.errors,
                                status=status.HTTP_400_BAD_REQUEST
                            )
                
                return Response(
                    ExerciseTemplateSerializer(exercise).data,
                    status=status.HTTP_200_OK
                )
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
            
        except ExerciseTemplate.DoesNotExist:
            return Response(
                {"detail": "Exercise not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class ProgramViewSet(viewsets.ModelViewSet):
    serializer_class = ProgramSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        filter_type = self.request.query_params.get('filter', 'all')
        user_id = self.request.query_params.get('user_id')
        
        queryset = Program.objects.prefetch_related(
            'workout_instances',
            'workout_instances__exercises',
            'workout_instances__exercises__sets',
            'likes'
        ).annotate(
            likes_count=Count('likes', distinct=True),
            forks_count=Count('forks', distinct=True)
        )
        
        # Filter based on the requested filter type
        if filter_type == 'created':
            # Programs created by the specified user or current user
            if user_id:
                queryset = queryset.filter(creator_id=user_id)
            else:
                queryset = queryset.filter(creator=self.request.user)
                
        elif filter_type == 'shared':
            # Programs shared with the current user
            queryset = queryset.filter(shares__shared_with=self.request.user)
            
        elif filter_type == 'public':
            # Public programs
            queryset = queryset.filter(is_public=True)
            
        elif filter_type == 'all':
            # Default: Programs created by user + shared with user + public
            queryset = queryset.filter(
                Q(creator=self.request.user) | 
                Q(shares__shared_with=self.request.user) |
                Q(is_public=True)
            ).distinct()
        
        return queryset

    def retrieve(self, request, *args, **kwargs):
        """Custom retrieve to ensure program active status is accurate"""
        instance = self.get_object()
        
        # If the user is not the creator, ensure is_active is false in the response
        if instance.creator != request.user and instance.is_active:
            serializer = self.get_serializer(instance)
            data = serializer.data
            data['is_active'] = False
            return Response(data)
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    @action(detail=True, methods=['get'])
    def shares(self, request, pk=None):
        program = self.get_object()
        shares = ProgramShare.objects.filter(program=program)
        serializer = ProgramShareSerializer(shares, many=True)
        return Response(serializer.data)
        
    @action(
        detail=True,
        methods=['get', 'put', 'patch', 'delete'],
        url_path='workouts/(?P<workout_id>\d+)'
    )
    def handle_workout(self, request, pk=None, workout_id=None):
        logger.info(f"""
        Workout operation:
        - Method: {request.method}
        - Program ID: {pk}
        - Workout ID: {workout_id}
        - Data: {request.data}
        """)
        
        program = self.get_object()
        
        try:
            workout = program.workout_instances.prefetch_related(
                'exercises__sets'
            ).get(id=workout_id)
            
            if request.method in ['PUT', 'PATCH']:
                serializer = WorkoutInstanceSerializer(
                    workout,
                    data=request.data,
                    partial=request.method == 'PATCH',
                    context={'request': request}
                )
                
                if not serializer.is_valid():
                    logger.error(f"Serializer validation errors: {serializer.errors}")
                    return Response(
                        {
                            "detail": "Validation failed",
                            "errors": serializer.errors
                        }, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
                try:
                    updated_workout = serializer.save()
                    logger.info(f"Successfully updated workout: {updated_workout.id}")
                    return Response(WorkoutInstanceSerializer(updated_workout).data)
                except Exception as e:
                    logger.error(f"Error saving workout: {str(e)}")
                    return Response(
                        {"detail": str(e)}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                    
            elif request.method == 'GET':
                serializer = WorkoutInstanceSerializer(workout)
                return Response(serializer.data)
            
            elif request.method == 'DELETE':
                workout.delete()
                return Response(status=status.HTTP_204_NO_CONTENT)
                
        except WorkoutInstance.DoesNotExist:
            return Response(
                {"detail": "Workout not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def add_workout(self, request, pk=None):
        program = self.get_object()
        template_id = request.data.get('template_id')
        
        try:
            with transaction.atomic():
                if template_id:
                    template = WorkoutTemplate.objects.prefetch_related(
                        'exercises', 'exercises__sets'
                    ).get(
                        Q(id=template_id),
                        Q(creator=request.user) | Q(is_public=True)
                    )
                    
                    instance = WorkoutInstance.objects.create(
                        program=program,
                        based_on_template=template,
                        name=template.name,
                        description=template.description,
                        split_method=template.split_method,
                        preferred_weekday=request.data.get('preferred_weekday', 0),
                        order=program.workout_instances.count(),
                        # Add new fields
                        difficulty_level=template.difficulty_level,
                        estimated_duration=template.estimated_duration,
                        equipment_required=template.equipment_required,
                        tags=template.tags
                    )
                    
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
                    instance = WorkoutInstance.objects.create(
                        program=program,
                        name=request.data.get('name', 'New Workout'),
                        description=request.data.get('description', ''),
                        split_method=request.data.get('split_method', 'custom'),
                        preferred_weekday=request.data.get('preferred_weekday', 0),
                        order=program.workout_instances.count(),
                        # Add new fields with default values
                        difficulty_level=request.data.get('difficulty_level', 'intermediate'),
                        estimated_duration=request.data.get('estimated_duration', 60),
                        equipment_required=request.data.get('equipment_required', []),
                        tags=request.data.get('tags', [])
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
    def toggle_active(self, request, pk=None):
        program = self.get_object()
        
        # Only allow the creator to toggle active state
        if program.creator != request.user:
            return Response(
                {"detail": "You don't have permission to modify this program."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        new_status = request.data.get('is_active', not program.is_active)
        
        with transaction.atomic():
            if new_status:
                # Deactivate all other programs
                Program.objects.filter(
                    creator=request.user,
                    is_active=True
                ).update(is_active=False)
                
                # Set this program as the user's current program
                request.user.current_program = program
                request.user.save()
            else:
                # If deactivating, remove it as current program
                if request.user.current_program == program:
                    request.user.current_program = None
                    request.user.save()
            
            program.is_active = new_status
            program.save()
            
        return Response(self.get_serializer(program).data)

    @action(detail=True, methods=['post'])
    def fork(self, request, pk=None):
        original_program = self.get_object()
        
        with transaction.atomic():
            new_program = Program.objects.create(
                creator=request.user,
                forked_from=original_program,
                name=f"{original_program.name}",
                description=original_program.description,
                focus=original_program.focus,
                sessions_per_week=original_program.sessions_per_week,
                is_active=False,
                is_public=True,
                difficulty_level=original_program.difficulty_level,
                recommended_level=original_program.recommended_level,
                required_equipment=original_program.required_equipment,
                estimated_completion_weeks=original_program.estimated_completion_weeks,
                tags=original_program.tags
            )
            
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
            
            return Response(self.get_serializer(new_program).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        program = self.get_object()
        user = request.user
        
        if user in program.likes.all():
            program.likes.remove(user)
            liked = False
        else:
            program.likes.add(user)
            liked = True
            
        return Response({'liked': liked})

    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
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
            
            return Response(
                ProgramShareSerializer(share).data,
                status=status.HTTP_201_CREATED
            )
            
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )


class WorkoutLogViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['date', 'created_at']
    ordering = ['-date', '-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return WorkoutLogCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return WorkoutLogUpdateSerializer
        return WorkoutLogSerializer

    def get_queryset(self):
        return WorkoutLog.objects.filter(
            # user=self.request.user
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
        instance_id = request.data.get('instance_id')
        
        try:
            instance = WorkoutInstance.objects.select_related(
                'program'
            ).prefetch_related(
                'exercises',
                'exercises__sets'
            ).get(id=instance_id)
            
            with transaction.atomic():
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
                
                return Response(
                    WorkoutLogSerializer(workout_log).data,
                    status=status.HTTP_201_CREATED
                )
                
        except WorkoutInstance.DoesNotExist:
            return Response(
                {"detail": "Workout instance not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def update_exercise(self, request, pk=None):
        workout_log = self.get_object()
        exercise_id = request.data.get('exercise_id')
        
        try:
            with transaction.atomic():
                if exercise_id:
                    exercise = workout_log.exercises.get(id=exercise_id)
                    serializer = ExerciseLogSerializer(
                        exercise,
                        data=request.data,
                        partial=True
                    )
                else:
                    serializer = ExerciseLogSerializer(data={
                        **request.data,
                        'workout': workout_log.id
                    })
                
                if serializer.is_valid():
                    exercise = serializer.save()
                    
                    # Handle sets if provided
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

    @action(detail=True, methods=['get'], url_path='shared')
    def shared_log(self, request, pk=None):
        """Endpoint for accessing workout logs shared in social feed"""
        try:
            log = WorkoutLog.objects.select_related(
                'program', 'based_on_instance', 'gym'
            ).prefetch_related(
                'exercises', 'exercises__sets'
            ).get(id=pk)
            
            # You could add additional permission checks here if needed
            # For example, only allow access if the log is referenced in a public post
            
            serializer = WorkoutLogSerializer(log)
            return Response(serializer.data)
        except WorkoutLog.DoesNotExist:
            return Response(
                {"detail": "Workout log not found"}, 
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

    
    def create(self, request, *args, **kwargs):
        """Override create to add detailed error logging"""
        import json
        logger.info(f"Creating workout log with data: {json.dumps(request.data, indent=2, default=str)}")
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Serializer validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            logger.exception(f"Error creating workout log: {str(e)}")
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# Add these imports if not present
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_workouts_count(request):
    """Get the count of workout logs for the current user"""
    count = request.user.workout_logs.count()
    return Response({"count": count})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_workouts_count(request, user_id):
    """Get the count of workout logs for a specific user"""
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        user = User.objects.get(id=user_id)
        count = WorkoutLog.objects.filter(user=user).count()
        return Response({"count": count})
    except User.DoesNotExist:
        return Response(
            {"detail": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )