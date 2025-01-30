# gyms/admin.py
from django.contrib import admin
from .models import Gym

@admin.register(Gym)
class GymAdmin(admin.ModelAdmin):
    list_display = ('name', 'location', 'member_count', 'created_at')
    list_filter = ('location',)
    search_fields = ('name', 'location', 'description')
    ordering = ('name', 'location')