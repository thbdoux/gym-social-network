# # workouts/admin.py
# from django.contrib import admin
# from .models import Workout, Exercise, Set, WorkoutLog, LoggedSet

# class SetInline(admin.TabularInline):
#     model = Set
#     extra = 1

# class ExerciseInline(admin.TabularInline):
#     model = Exercise
#     extra = 1
#     show_change_link = True

# class LoggedSetInline(admin.TabularInline):
#     model = LoggedSet
#     extra = 0

# @admin.register(Workout)
# class WorkoutAdmin(admin.ModelAdmin):
#     list_display = ('name', 'user', 'split_method', 'is_template', 'created_at')
#     list_filter = ('split_method', 'is_template', 'created_at')
#     search_fields = ('name', 'description', 'user__username')
#     inlines = [ExerciseInline]

# @admin.register(Exercise)
# class ExerciseAdmin(admin.ModelAdmin):
#     list_display = ('name', 'workout', 'equipment', 'order')
#     list_filter = ('workout__split_method',)
#     search_fields = ('name', 'equipment', 'notes')
#     inlines = [SetInline]

# @admin.register(WorkoutLog)
# class WorkoutLogAdmin(admin.ModelAdmin):
#     list_display = ('workout', 'user', 'date', 'gym', 'completed')
#     list_filter = ('completed', 'date', 'gym')
#     search_fields = ('workout__name', 'user__username', 'notes')
#     inlines = [LoggedSetInline]
#     date_hierarchy = 'date'

##########


# workouts/admin.py

from django.contrib import admin
from .models import (
    WorkoutTemplate, ExerciseTemplate, SetTemplate,
    Program, ScheduledWorkout,
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

class ScheduledWorkoutInline(admin.TabularInline):
    model = ScheduledWorkout
    extra = 1

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
    list_display = ('name', 'user', 'split_method', 'created_at')
    list_filter = ('split_method', 'created_at')
    search_fields = ('name', 'description', 'user__username')
    inlines = [ExerciseTemplateInline]

@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'focus', 'sessions_per_week', 'is_active')
    list_filter = ('focus', 'is_active', 'created_at')
    search_fields = ('name', 'description', 'user__username')
    inlines = [ScheduledWorkoutInline]

@admin.register(WorkoutLog)
class WorkoutLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'workout_template', 'program', 'date', 'completed')
    list_filter = ('completed', 'date', 'program')
    search_fields = ('workout_template__name', 'user__username', 'notes')
    inlines = [ExerciseLogInline]
    date_hierarchy = 'date'