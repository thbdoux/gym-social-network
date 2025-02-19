# workouts/admin.py
from django.contrib import admin
from .models import (
    WorkoutTemplate, ExerciseTemplate, SetTemplate,
    Program, WorkoutInstance, ExerciseInstance, SetInstance
)

@admin.register(WorkoutInstance)
class WorkoutInstanceAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'program', 'split_method', 'preferred_weekday', 
        'order', 'based_on_template'
    )
    list_filter = ('preferred_weekday', 'split_method', 'program__name')
    search_fields = ('name', 'description', 'program__name')
    raw_id_fields = ('program', 'based_on_template')
    ordering = ('program', 'order')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'program', 'based_on_template'
        ).prefetch_related('exercises', 'exercises__sets')

@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'creator', 'focus', 'is_active',
        'difficulty_level', 'sessions_per_week',
        'get_likes_count', 'get_workouts_count'
    )
    list_filter = (
        'focus', 'difficulty_level', 'is_active',
        'is_public', 'created_at'
    )
    search_fields = ('name', 'description', 'creator__username', 'tags')
    readonly_fields = (
        'created_at', 'updated_at', 'workouts_count',
        'likes_count', 'forks_count'
    )
    raw_id_fields = ('creator', 'forked_from')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'creator', 'forked_from'
        ).prefetch_related(
            'workout_instances', 'likes', 'forks'
        )
    
    def get_likes_count(self, obj):
        return obj.likes.count()
    get_likes_count.short_description = 'Likes'
    
    def get_workouts_count(self, obj):
        return obj.workout_instances.count()
    get_workouts_count.short_description = 'Workouts'
    
    def workouts_count(self, obj):
        return obj.workout_instances.count()
    workouts_count.short_description = 'Total Workouts'
    
    def likes_count(self, obj):
        return obj.likes.count()
    likes_count.short_description = 'Total Likes'
    
    def forks_count(self, obj):
        return obj.forks.count()
    forks_count.short_description = 'Total Forks'

# Register other models with basic ModelAdmin
admin.site.register(ExerciseInstance)
admin.site.register(SetInstance)