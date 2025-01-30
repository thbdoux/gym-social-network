# users/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Schedule

class ScheduleInline(admin.TabularInline):
    model = Schedule
    extra = 1

class UserAdmin(BaseUserAdmin):
    inlines = (ScheduleInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'fitness_practice', 'training_level')
    list_filter = BaseUserAdmin.list_filter + ('fitness_practice', 'training_level', 'personality')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Profile', {'fields': ('surname', 'bio', 'profile_picture', 'gym', 
                              'fitness_practice', 'training_level', 
                              'personality', 'goals', 'friends')}),
    )

admin.site.register(User, UserAdmin)
admin.site.register(Schedule)