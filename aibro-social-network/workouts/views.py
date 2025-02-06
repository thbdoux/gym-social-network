# workouts/views.py
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction, models
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404

from .models import (
    WorkoutTemplate, ExerciseTemplate, SetTemplate,
    Program, WorkoutInstance, ProgramShare,
    WorkoutLog, ExerciseLog, SetLog
)
from .serializers import (
    WorkoutTemplateSerializer, WorkoutTemplateDetailSerializer,
    ExerciseTemplateSerializer, SetTemplateSerializer,
    ProgramSerializer, WorkoutInstanceSerializer, ProgramShareSerializer,
    WorkoutLogSerializer, WorkoutLogCreateSerializer,
    ExerciseLogSerializer, SetLogSerializer
)

class WorkoutTemplateViewSet(viewsets.ModelViewSet):
    """
    Manage workout templates
    """
    serializer_class = WorkoutTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'name']

    def get_queryset(self):
        user = self.request.user
        return WorkoutTemplate.objects.filter(
            Q(creator=user) | 
            Q(is_public=True)
        ).prefetch_related(
            'exercises',
            'exercises__sets'
        )

    def get_serializer_class(self):
        if self.action in ['retrieve', 'create', 'update']:
            return WorkoutTemplateDetailSerializer
        return WorkoutTemplateSerializer

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
                
                # Create sets if provided
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

    @action(detail=True, methods=['post'])
    def update_workout(self, request, pk=None):
        """Update a workout template with its exercises and sets"""
        workout = self.get_object()
        
        try:
            with transaction.atomic():
                # Update basic workout details if provided
                if 'name' in request.data:
                    workout.name = request.data['name']
                if 'description' in request.data:
                    workout.description = request.data['description']
                if 'split_method' in request.data:
                    workout.split_method = request.data['split_method']
                if 'is_public' in request.data:
                    workout.is_public = request.data['is_public']
                
                workout.save()

                # Handle exercises updates if provided
                if 'exercises' in request.data:
                    for exercise_data in request.data['exercises']:
                        exercise_id = exercise_data.get('id')
                        
                        if exercise_id:
                            # Update existing exercise
                            try:
                                exercise = workout.exercises.get(id=exercise_id)
                                
                                # Update exercise fields
                                if 'name' in exercise_data:
                                    exercise.name = exercise_data['name']
                                if 'equipment' in exercise_data:
                                    exercise.equipment = exercise_data['equipment']
                                if 'notes' in exercise_data:
                                    exercise.notes = exercise_data['notes']
                                if 'order' in exercise_data:
                                    exercise.order = exercise_data['order']
                                
                                exercise.save()

                                # Handle sets updates if provided
                                if 'sets' in exercise_data:
                                    for set_data in exercise_data['sets']:
                                        set_id = set_data.get('id')
                                        
                                        if set_id:
                                            # Update existing set
                                            try:
                                                set_obj = exercise.sets.get(id=set_id)
                                                for field in ['reps', 'weight', 'rest_time', 'order']:
                                                    if field in set_data:
                                                        setattr(set_obj, field, set_data[field])
                                                set_obj.save()
                                            except SetTemplate.DoesNotExist:
                                                return Response(
                                                    {"detail": f"Set {set_id} not found"},
                                                    status=status.HTTP_404_NOT_FOUND
                                                )
                                        else:
                                            # Create new set
                                            SetTemplate.objects.create(
                                                exercise=exercise,
                                                **{k: v for k, v in set_data.items() 
                                                if k in ['reps', 'weight', 'rest_time', 'order']}
                                            )

                            except ExerciseTemplate.DoesNotExist:
                                return Response(
                                    {"detail": f"Exercise {exercise_id} not found"},
                                    status=status.HTTP_404_NOT_FOUND
                                )
                        else:
                            # Create new exercise
                            new_exercise = ExerciseTemplate.objects.create(
                                workout=workout,
                                name=exercise_data['name'],
                                equipment=exercise_data.get('equipment', ''),
                                notes=exercise_data.get('notes', ''),
                                order=exercise_data.get('order', 0)
                            )
                            
                            # Create its sets if provided
                            for set_data in exercise_data.get('sets', []):
                                SetTemplate.objects.create(
                                    exercise=new_exercise,
                                    **{k: v for k, v in set_data.items() 
                                    if k in ['reps', 'weight', 'rest_time', 'order']}
                                )

                # Return updated workout
                serializer = WorkoutTemplateDetailSerializer(workout)
                return Response(serializer.data)

        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    @action(detail=True, methods=['post'])
    def copy(self, request, pk=None):
        """Create a copy of this template"""
        template = self.get_object()
        
        with transaction.atomic():
            # Create new template
            new_template = WorkoutTemplate.objects.create(
                creator=request.user,
                name=f"Copy of {template.name}",
                description=template.description,
                split_method=template.split_method,
                is_public=False
            )
            
            # Copy exercises and sets
            for exercise in template.exercises.all():
                new_exercise = ExerciseTemplate.objects.create(
                    workout=new_template,
                    name=exercise.name,
                    equipment=exercise.equipment,
                    notes=exercise.notes,
                    order=exercise.order
                )
                
                for set_template in exercise.sets.all():
                    SetTemplate.objects.create(
                        exercise=new_exercise,
                        reps=set_template.reps,
                        weight=set_template.weight,
                        rest_time=set_template.rest_time,
                        order=set_template.order
                    )
            
            serializer = WorkoutTemplateDetailSerializer(new_template)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False)
    def trending(self, request):
        return self.get_queryset().annotate(
            popularity=Count('workout_instances') + Count('workout_logs')
        ).order_by('-popularity')[:10]

    @action(detail=False)
    def by_equipment(self, request):
        equipment = request.query_params.get('equipment')
        return self.get_queryset().filter(equipment_required__contains=[equipment])

class ProgramViewSet(viewsets.ModelViewSet):
    """
    Manage workout programs with social features
    """
    serializer_class = ProgramSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'creator__username']
    ordering_fields = ['created_at', 'name', 'likes_count']

    def get_queryset(self):
        user = self.request.user
        return Program.objects.filter(
            Q(creator=user) | 
            Q(shares__shared_with=user) |
            Q(is_public=True)
        ).prefetch_related(
            'workout_instances',
            'workout_instances__template',
            'workout_instances__template__exercises',
            'workout_instances__template__exercises__sets',
            'likes'
        ).annotate(
            likes_count=Count('likes', distinct=True),
            forks_count=Count('forks', distinct=True)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    @action(detail=True, methods=['post'])
    def add_workout(self, request, pk=None):
        """Add a workout template instance to the program"""
        program = self.get_object()
        
        # Get the template
        template_id = request.data.get('template_id')
        try:
            template = WorkoutTemplate.objects.get(
                Q(id=template_id),
                Q(creator=request.user) | Q(is_public=True)
            )
        except WorkoutTemplate.DoesNotExist:
            return Response(
                {"detail": "Template not found or not accessible"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create instance
        instance = WorkoutInstance.objects.create(
            program=program,
            template=template,
            preferred_weekday=request.data.get('preferred_weekday', 0),
            order=request.data.get('order')
        )
        
        serializer = WorkoutInstanceSerializer(instance)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def remove_workout(self, request, pk=None):
        """Remove a workout instance from the program"""
        program = self.get_object()
        instance_id = request.data.get('instance_id')
        
        try:
            instance = program.workout_instances.get(id=instance_id)
            instance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except WorkoutInstance.DoesNotExist:
            return Response(
                {"detail": "Workout instance not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def update_workout(self, request, pk=None):
        """Update a workout instance in the program"""
        program = self.get_object()
        instance_id = request.data.get('instance_id')
        
        try:
            # Get the instance and verify it belongs to this program
            instance = program.workout_instances.get(id=instance_id)
            
            # Update fields if provided
            if 'preferred_weekday' in request.data:
                instance.preferred_weekday = request.data['preferred_weekday']
                
            if 'order' in request.data:
                # If changing order, verify new order is valid
                new_order = request.data['order']
                if new_order != instance.order:
                    # Check if this order already exists
                    if program.workout_instances.filter(order=new_order).exists():
                        # Shift other workouts to make room
                        if new_order > instance.order:
                            # Moving down - shift intermediates up
                            program.workout_instances.filter(
                                order__gt=instance.order,
                                order__lte=new_order
                            ).update(order=models.F('order') - 1)
                        else:
                            # Moving up - shift intermediates down
                            program.workout_instances.filter(
                                order__gte=new_order,
                                order__lt=instance.order
                            ).update(order=models.F('order') + 1)
                    instance.order = new_order
            
            instance.save()
            
            serializer = WorkoutInstanceSerializer(instance)
            return Response(serializer.data)
            
        except WorkoutInstance.DoesNotExist:
            return Response(
                {"detail": "Workout instance not found in this program"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def fork(self, request, pk=None):
        """Create a fork of this program"""
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
                is_active=True,
                is_public=False
            )
            
            # Clone workout instances
            for instance in original_program.workout_instances.all():
                WorkoutInstance.objects.create(
                    program=new_program,
                    template=instance.template,
                    preferred_weekday=instance.preferred_weekday,
                    order=instance.order
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

    @action(detail=False, methods=['get'])
    def shared_with_me(self, request):
        """List programs shared with the current user"""
        shared_programs = Program.objects.filter(
            shares__shared_with=request.user
        ).distinct()
        serializer = self.get_serializer(shared_programs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_programs(self, request):
        """List programs created by the current user"""
        my_programs = Program.objects.filter(creator=request.user)
        serializer = self.get_serializer(my_programs, many=True)
        return Response(serializer.data)

    @action(detail=False)
    def recommend(self, request):
        user_level = request.user.training_level
        available_equipment = request.user.preferred_gym.equipment
        return self.get_queryset().filter(
            recommended_level=user_level,
            required_equipment__contained_by=available_equipment
        )
class WorkoutLogViewSet(viewsets.ModelViewSet):
    """
    Manage workout logs (records of performed workouts)
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['date', 'created_at']
    ordering = ['-date', '-created_at']

    def get_serializer_class(self):
        if self.action in ['create', 'update']:
            return WorkoutLogCreateSerializer
        return WorkoutLogSerializer

    def get_queryset(self):
        return WorkoutLog.objects.filter(
            user=self.request.user
        ).select_related(
            'program',
            'workout_instance',
            'workout_instance__template',
            'gym'
        ).prefetch_related(
            'exercises',
            'exercises__sets'
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def log_from_instance(self, request):
        """Create a new workout log from a program workout instance"""
        instance_id = request.data.get('instance_id')
        try:
            instance = WorkoutInstance.objects.select_related(
                'template', 'program'
            ).prefetch_related(
                'template__exercises',
                'template__exercises__sets'
            ).get(id=instance_id)
            
            with transaction.atomic():
                # Create workout log
                workout_log = WorkoutLog.objects.create(
                    user=request.user,
                    workout_instance=instance,
                    program=instance.program,
                    date=request.data.get('date'),
                    gym_id=request.data.get('gym_id'),
                    notes=request.data.get('notes', '')
                )
                
                # Copy exercises and sets from template
                for exercise_template in instance.template.exercises.all():
                    exercise_log = ExerciseLog.objects.create(
                        workout_log=workout_log,
                        template=exercise_template,
                        name=exercise_template.name,
                        equipment=exercise_template.equipment,
                        notes=exercise_template.notes,
                        order=exercise_template.order
                    )
                    
                    for set_template in exercise_template.sets.all():
                        SetLog.objects.create(
                            exercise=exercise_log,
                            template=set_template,
                            reps=set_template.reps,
                            weight=set_template.weight,
                            rest_time=set_template.rest_time,
                            order=set_template.order
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
        """Update a specific exercise in the workout log"""
        workout_log = self.get_object()
        exercise_id = request.data.get('exercise_id')
        
        try:
            exercise = workout_log.exercises.get(id=exercise_id)
            serializer = ExerciseLogSerializer(
                exercise,
                data=request.data,
                partial=True
            )
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
            
        except ExerciseLog.DoesNotExist:
            return Response(
                {"detail": "Exercise not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get workout statistics for the current user"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        queryset = self.get_queryset()
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