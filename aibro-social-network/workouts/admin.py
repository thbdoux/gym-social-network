# admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import (
    WorkoutTemplate, ExerciseTemplate, SetTemplate,
    Program, WorkoutInstance, ExerciseInstance, SetInstance, ProgramShare,
    WorkoutLog, ExerciseLog, SetLog
)

# Template Admin
class SetTemplateInline(admin.TabularInline):
    model = SetTemplate
    extra = 1
    fields = ('reps', 'weight', 'rest_time', 'order')

class ExerciseTemplateInline(admin.TabularInline):
    model = ExerciseTemplate
    extra = 1
    fields = ('name', 'equipment', 'notes', 'order')
    show_change_link = True

@admin.register(WorkoutTemplate)
class WorkoutTemplateAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'creator', 'split_method', 'difficulty_level',
        'estimated_duration', 'is_public', 'use_count', 'created_at'
    )
    list_filter = (
        'split_method', 'difficulty_level', 'is_public', 
        'created_at'
    )
    search_fields = ('name', 'description', 'creator__username', 'tags')
    inlines = [ExerciseTemplateInline]
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('creator',)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('creator')

# Instance Admin
class SetInstanceInline(admin.TabularInline):
    model = SetInstance
    extra = 1
    fields = ('reps', 'weight', 'rest_time', 'order', 'based_on_template')
    raw_id_fields = ('based_on_template',)

class ExerciseInstanceInline(admin.TabularInline):
    model = ExerciseInstance
    extra = 1
    fields = ('name', 'equipment', 'notes', 'order', 'based_on_template')
    raw_id_fields = ('based_on_template',)
    show_change_link = True

class WorkoutInstanceInline(admin.TabularInline):
    model = WorkoutInstance
    extra = 1
    fields = ('name', 'split_method', 'preferred_weekday', 'order', 'based_on_template')
    raw_id_fields = ('based_on_template',)

@admin.register(WorkoutInstance)
class WorkoutInstanceAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'program', 'split_method', 'preferred_weekday', 
        'order', 'based_on_template'
    )
    list_filter = ('preferred_weekday', 'split_method', 'program__name')
    search_fields = ('name', 'program__name')
    raw_id_fields = ('program', 'based_on_template')
    inlines = [ExerciseInstanceInline]

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'program', 'based_on_template'
        )

# Program Admin
@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'creator', 'focus', 'difficulty_level',
        'sessions_per_week', 'estimated_completion_weeks',
        'is_active', 'is_public', 'get_likes_count'
    )
    list_filter = (
        'focus', 'difficulty_level', 'is_active',
        'is_public', 'created_at'
    )
    search_fields = ('name', 'description', 'creator__username')
    inlines = [WorkoutInstanceInline]
    readonly_fields = ('created_at', 'updated_at', 'get_likes_count', 'get_forks_count')
    raw_id_fields = ('creator', 'forked_from')

    def get_likes_count(self, obj):
        return obj.likes.count()
    get_likes_count.short_description = 'Likes'

    def get_forks_count(self, obj):
        return obj.forks.count()
    get_forks_count.short_description = 'Forks'

    def view_workouts(self, obj):
        count = obj.workout_instances.count()
        return format_html(
            '<a href="{}?program__id={}">{} workouts</a>',
            '../workoutinstance/',
            obj.id,
            count
        )
    view_workouts.short_description = 'Workouts'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'creator', 'forked_from'
        ).prefetch_related('workout_instances', 'likes', 'forks')

@admin.register(ProgramShare)
class ProgramShareAdmin(admin.ModelAdmin):
    list_display = ('program', 'shared_with', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('program__name', 'shared_with__username')
    raw_id_fields = ('program', 'shared_with')

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('program', 'shared_with')

# Log Admin
class SetLogInline(admin.TabularInline):
    model = SetLog
    extra = 0
    fields = ('reps', 'weight', 'rest_time', 'order', 'based_on_instance')
    raw_id_fields = ('based_on_instance',)

class ExerciseLogInline(admin.TabularInline):
    model = ExerciseLog
    extra = 0
    fields = ('name', 'equipment', 'notes', 'order', 'based_on_instance')
    raw_id_fields = ('based_on_instance',)
    show_change_link = True

@admin.register(WorkoutLog)
class WorkoutLogAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'user', 'date', 'based_on_instance',
        'program', 'mood_rating', 'perceived_difficulty', 'completed'
    )
    list_filter = (
        'completed', 'mood_rating', 'perceived_difficulty',
        'date', 'created_at'
    )
    search_fields = ('name', 'user__username', 'notes')
    inlines = [ExerciseLogInline]
    readonly_fields = ('created_at',)
    raw_id_fields = ('user', 'based_on_instance', 'program', 'gym')
    date_hierarchy = 'date'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'user', 'based_on_instance', 'program', 'gym'
        )

# Register Exercise/Set models for individual editing if needed
@admin.register(ExerciseInstance)
class ExerciseInstanceAdmin(admin.ModelAdmin):
    list_display = ('name', 'workout', 'order', 'based_on_template')
    list_filter = ('workout__program__name',)
    search_fields = ('name', 'workout__name')
    raw_id_fields = ('workout', 'based_on_template')
    inlines = [SetInstanceInline]

@admin.register(ExerciseLog)
class ExerciseLogAdmin(admin.ModelAdmin):
    list_display = ('name', 'workout', 'order', 'based_on_instance')
    list_filter = ('workout__date',)
    search_fields = ('name', 'workout__name')
    raw_id_fields = ('workout', 'based_on_instance')
    inlines = [SetLogInline]