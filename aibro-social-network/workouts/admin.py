# workouts/admin.py
from django.contrib import admin
from .models import Workout, Exercise, Set, WorkoutLog, LoggedSet

class SetInline(admin.TabularInline):
    model = Set
    extra = 1

class ExerciseInline(admin.TabularInline):
    model = Exercise
    extra = 1
    show_change_link = True

class LoggedSetInline(admin.TabularInline):
    model = LoggedSet
    extra = 0

@admin.register(Workout)
class WorkoutAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'split_method', 'is_template', 'created_at')
    list_filter = ('split_method', 'is_template', 'created_at')
    search_fields = ('name', 'description', 'user__username')
    inlines = [ExerciseInline]

@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ('name', 'workout', 'equipment', 'order')
    list_filter = ('workout__split_method',)
    search_fields = ('name', 'equipment', 'notes')
    inlines = [SetInline]

@admin.register(WorkoutLog)
class WorkoutLogAdmin(admin.ModelAdmin):
    list_display = ('workout', 'user', 'date', 'gym', 'completed')
    list_filter = ('completed', 'date', 'gym')
    search_fields = ('workout__name', 'user__username', 'notes')
    inlines = [LoggedSetInline]
    date_hierarchy = 'date'