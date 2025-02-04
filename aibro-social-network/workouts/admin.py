# admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import (
    WorkoutTemplate, ExerciseTemplate, SetTemplate,
    Program, WorkoutInstance, ProgramShare,
    WorkoutLog, ExerciseLog, SetLog
)

class SetTemplateInline(admin.TabularInline):
    model = SetTemplate
    extra = 1
    fields = ('reps', 'weight', 'rest_time', 'order')

class ExerciseTemplateInline(admin.TabularInline):
    model = ExerciseTemplate
    extra = 1
    fields = ('name', 'equipment', 'notes', 'order')
    show_change_link = True

class WorkoutInstanceInline(admin.TabularInline):
    model = WorkoutInstance
    extra = 1
    fields = ('template', 'preferred_weekday', 'order')
    raw_id_fields = ('template',)

class SetLogInline(admin.TabularInline):
    model = SetLog
    extra = 0
    fields = ('reps', 'weight', 'rest_time', 'order')
    readonly_fields = ('template',)

class ExerciseLogInline(admin.TabularInline):
    model = ExerciseLog
    extra = 0
    fields = ('name', 'equipment', 'notes', 'order')
    readonly_fields = ('template',)
    show_change_link = True

@admin.register(WorkoutTemplate)
class WorkoutTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'creator', 'split_method', 'is_public', 'created_at')
    list_filter = ('split_method', 'is_public', 'created_at')
    search_fields = ('name', 'description', 'creator__username')
    inlines = [ExerciseTemplateInline]
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('creator',)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('creator')

@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ('name', 'creator', 'focus', 'sessions_per_week', 
                   'is_active', 'is_public', 'get_likes_count', 
                   'get_forks_count', 'view_workouts')
    list_filter = ('focus', 'is_active', 'is_public', 'created_at')
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
@admin.register(WorkoutInstance)
class WorkoutInstanceAdmin(admin.ModelAdmin):
    list_display = ('template', 'program', 'preferred_weekday', 'order')
    list_filter = ('preferred_weekday', 'program__name')
    search_fields = ('template__name', 'program__name')
    raw_id_fields = ('program', 'template')

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('program', 'template')

@admin.register(ProgramShare)
class ProgramShareAdmin(admin.ModelAdmin):
    list_display = ('program', 'shared_with', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('program__name', 'shared_with__username')
    raw_id_fields = ('program', 'shared_with')

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('program', 'shared_with')

@admin.register(WorkoutLog)
class WorkoutLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'workout_instance', 'program', 'date', 
                   'completed', 'created_at')
    list_filter = ('completed', 'date', 'created_at')
    search_fields = ('user__username', 'notes', 'workout_instance__template__name')
    inlines = [ExerciseLogInline]
    readonly_fields = ('created_at',)
    raw_id_fields = ('user', 'workout_instance', 'program', 'gym')
    date_hierarchy = 'date'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'user', 'workout_instance', 'program', 'gym'
        )