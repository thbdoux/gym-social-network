# workouts/views.py
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Q, Count, F, Max
from django.core.exceptions import ValidationError
import logging

from django.utils import timezone
from datetime import timedelta

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

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
    WorkoutLogSerializer, ExerciseLogSerializer, SetLogSerializer
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
            if exercise_id != 'new':
                exercise = workout.exercises.get(id=exercise_id)
                
                if request.method == 'DELETE':
                    exercise.delete()
                    return Response(status=status.HTTP_204_NO_CONTENT)
                
                serializer = ExerciseTemplateSerializer(
                    exercise,
                    data=request.data,
                    partial=True
                )
            else:
                serializer = ExerciseTemplateSerializer(data=request.data)
            
            if serializer.is_valid():
                if exercise_id == 'new':
                    exercise = serializer.save(workout=workout)
                else:
                    exercise = serializer.save()
                
                if 'sets' in request.data:
                    exercise.sets.all().delete()
                    
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
        
        if filter_type == 'created':
            if user_id:
                queryset = queryset.filter(creator_id=user_id)
            else:
                queryset = queryset.filter(creator=self.request.user)
                
        elif filter_type == 'shared':
            queryset = queryset.filter(shares__shared_with=self.request.user)
            
        elif filter_type == 'public':
            queryset = queryset.filter(is_public=True)
            
        elif filter_type == 'all':
            queryset = queryset.filter(
                Q(creator=self.request.user) | 
                Q(shares__shared_with=self.request.user) |
                Q(is_public=True)
            ).distinct()
        
        return queryset

    def retrieve(self, request, *args, **kwargs):
        """Custom retrieve to ensure program active status is accurate"""
        instance = self.get_object()
        
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
                            order=ex_template.order,
                            effort_type=ex_template.effort_type
                        )
                        
                        for set_template in ex_template.sets.all():
                            SetInstance.objects.create(
                                exercise=ex_instance,
                                based_on_template=set_template,
                                reps=set_template.reps,
                                weight=set_template.weight,
                                weight_unit=set_template.weight_unit, 
                                duration=set_template.duration,  
                                distance=set_template.distance,
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
        
        if program.creator != request.user:
            return Response(
                {"detail": "You don't have permission to modify this program."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        new_status = request.data.get('is_active', not program.is_active)
        
        with transaction.atomic():
            if new_status:
                Program.objects.filter(
                    creator=request.user,
                    is_active=True
                ).update(is_active=False)
                
                request.user.current_program = program
                request.user.save()
            else:
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
                        order=orig_exercise.order,
                        effort_type=orig_exercise.effort_type
                    )
                    
                    for orig_set in orig_exercise.sets.all():
                        SetInstance.objects.create(
                            exercise=new_exercise,
                            based_on_template=orig_set.based_on_template,
                            reps=orig_set.reps,
                            weight=orig_set.weight,
                            weight_unit=orig_set.weight_unit, 
                            duration=orig_set.duration,  
                            distance=orig_set.distance,
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
    """Simplified WorkoutLog ViewSet using unified serializer"""
    serializer_class = WorkoutLogSerializer  # Single serializer for all operations
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['date', 'created_at']
    ordering = ['-date', '-created_at']

    def get_queryset(self):
        return WorkoutLog.objects.filter(
            # user=self.request.user
        ).select_related(
            'program',
            'based_on_instance',
            'gym'
        ).prefetch_related(
            'exercises',
            'exercises__sets',
            'workout_partners'
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def log_from_instance(self, request):
        instance_id = request.data.get('instance_id')
        workout_partners = request.data.get('workout_partners', [])
        
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
                
                if workout_partners:
                    from django.contrib.auth import get_user_model
                    User = get_user_model()
                    
                    valid_partners = User.objects.filter(id__in=workout_partners)
                    if valid_partners.count() != len(workout_partners):
                        return Response(
                            {"detail": "Some workout partner user IDs are invalid"},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    workout_log.workout_partners.set(workout_partners)
                
                for instance_exercise in instance.exercises.all():
                    exercise_log = ExerciseLog.objects.create(
                        workout=workout_log,
                        based_on_instance=instance_exercise,
                        name=instance_exercise.name,
                        equipment=instance_exercise.equipment,
                        notes=instance_exercise.notes,
                        order=instance_exercise.order,
                        effort_type=instance_exercise.effort_type  
                    )
                    
                    for instance_set in instance_exercise.sets.all():
                        SetLog.objects.create(
                            exercise=exercise_log,
                            based_on_instance=instance_set,
                            reps=instance_set.reps,
                            weight=instance_set.weight,
                            weight_unit=instance_set.weight_unit,
                            duration=instance_set.duration,
                            distance=instance_set.distance,
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
                    
                    if 'sets' in request.data:
                        exercise.sets.all().delete()
                        
                        for set_data in request.data['sets']:
                            SetLog.objects.create(
                                exercise=exercise,
                                reps=set_data.get('reps'),
                                weight=set_data.get('weight'),
                                weight_unit=set_data.get('weight_unit', 'kg'),  
                                duration=set_data.get('duration'),  
                                distance=set_data.get('distance'),
                                rest_time=set_data.get('rest_time', 60),
                                order=set_data.get('order', 0)
                            )
                    
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
                'exercises', 'exercises__sets', 'workout_partners'
            ).get(id=pk)
            
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

    @action(detail=False, methods=['get'])
    def with_partners(self, request):
        """Get workout logs where current user was a workout partner"""
        logs = WorkoutLog.objects.filter(
            workout_partners=request.user
        ).select_related(
            'program', 'based_on_instance', 'gym', 'user'
        ).prefetch_related(
            'exercises', 'exercises__sets', 'workout_partners'
        )
        
        serializer = WorkoutLogSerializer(logs, many=True)
        return Response(serializer.data)

# Function-based views
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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_logs_by_username(request, username):
    """Get workout logs for a specific user by username"""
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        user = User.objects.get(username=username)
        logs = WorkoutLog.objects.filter(user=user).select_related(
            'program', 'based_on_instance', 'gym'
        ).prefetch_related(
            'exercises', 'exercises__sets', 'workout_partners'
        )
        
        serialized_logs = []
        
        for log in logs:
            try:
                serializer = WorkoutLogSerializer(log)
                serialized_logs.append(serializer.data)
            except Exception as e:
                logger.error(f"Error serializing log {log.id}: {str(e)}")
                serialized_logs.append({
                    "id": log.id,
                    "name": log.name,
                    "date": log.date,
                    "error": "Could not fully load this workout log due to data issues"
                })
        
        return Response(serialized_logs)
    except User.DoesNotExist:
        return Response(
            {"detail": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.exception(f"Error in get_user_logs_by_username: {str(e)}")
        return Response(
            {"detail": f"An error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recent_exercises(request):
    """Get recently used exercises based on workout logs"""
    
    # Get query parameters
    days = int(request.query_params.get('days', 30))  # Default: last 30 days
    limit = int(request.query_params.get('limit', 10))  # Default: top 10 exercises
    
    # Calculate the date threshold
    date_threshold = timezone.now() - timedelta(days=days)
    
    # Query to get most frequent exercises from recent workout logs
    recent_exercises = ExerciseLog.objects.filter(
        workout__user=request.user,
        workout__date__gte=date_threshold,
        workout__completed=True  # Only count completed workouts
    ).values(
        'name'  # Group by exercise name
    ).annotate(
        usage_count=Count('id'),  # Count how many times each exercise was used
        last_used=Max('workout__date')  # Track when it was last used
    ).order_by(
        '-usage_count',  # Sort by most used first
        '-last_used'     # Then by most recently used
    )[:limit]
    
    # Format the response
    exercises = []
    for exercise in recent_exercises:
        exercises.append({
            'name': exercise['name'],
            'usage_count': exercise['usage_count'],
            'last_used': exercise['last_used']
        })
    
    return Response({
        'exercises': exercises,
        'period_days': days,
        'total_found': len(exercises)
    })


# Alternative version that returns exercise IDs instead of names
# (if your exercise selector works with IDs from a predefined exercise database)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recent_exercise_names(request):
    """Get recently used exercise names for the exercise selector"""
    
    days = int(request.query_params.get('days', 30))
    limit = int(request.query_params.get('limit', 15))
    
    date_threshold = timezone.now() - timedelta(days=days)
    
    # Get exercise names ordered by frequency and recency
    exercise_names = ExerciseLog.objects.filter(
        workout__user=request.user,
        workout__date__gte=date_threshold,
        workout__completed=True
    ).values('name').annotate(
        usage_count=Count('id'),
        last_used=Max('workout__date')
    ).order_by('-usage_count', '-last_used').values_list('name', flat=True)[:limit]
    
    return Response(list(exercise_names))