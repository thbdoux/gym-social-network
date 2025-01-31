from django.contrib import admin
from .models import (
    WorkoutTemplate, ExerciseTemplate, SetTemplate,
    Program,
    WorkoutLog, ExerciseLog, SetLog
)

class SetTemplateInline(admin.TabularInline):
    model = SetTemplate
    extra = 1

class ExerciseTemplateInline(admin.TabularInline):
    model = ExerciseTemplate
    extra = 1
    show_change_link = True
    inlines = [SetTemplateInline]

class WorkoutTemplateInline(admin.TabularInline):
    model = WorkoutTemplate
    extra = 1
    fields = ('name', 'split_method', 'preferred_weekday', 'order')
    ordering = ('order',)

class SetLogInline(admin.TabularInline):
    model = SetLog
    extra = 0

class ExerciseLogInline(admin.TabularInline):
    model = ExerciseLog
    extra = 0
    show_change_link = True
    inlines = [SetLogInline]

@admin.register(WorkoutTemplate)
class WorkoutTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'split_method', 'program', 'preferred_weekday', 'order', 'created_at')
    list_filter = ('split_method', 'program', 'created_at')
    search_fields = ('name', 'description', 'user__username')
    inlines = [ExerciseTemplateInline]
    ordering = ('program', 'order', 'created_at')

@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'focus', 'sessions_per_week', 'is_active', 'workout_count')
    list_filter = ('focus', 'is_active', 'created_at')
    search_fields = ('name', 'description', 'user__username')
    inlines = [WorkoutTemplateInline]

    def workout_count(self, obj):
        return obj.workouts.count()
    workout_count.short_description = 'Workouts'

@admin.register(WorkoutLog)
class WorkoutLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'workout_template', 'program', 'date', 'completed')
    list_filter = ('completed', 'date', 'program')
    search_fields = ('workout_template__name', 'user__username', 'notes')
    inlines = [ExerciseLogInline]
    date_hierarchy = 'date'