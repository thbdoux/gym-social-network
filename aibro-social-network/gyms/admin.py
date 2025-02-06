# gyms/admin.py
from django.contrib import admin
from .models import Gym, GymAnnouncement

class GymAnnouncementInline(admin.TabularInline):
   model = GymAnnouncement
   extra = 1

@admin.register(Gym)
class GymAdmin(admin.ModelAdmin):
   list_display = ('name', 'location', 'member_count', 'active_users_today', 'created_at')
   list_filter = ('location', 'created_at')
   search_fields = ('name', 'location', 'description')
   ordering = ('name', 'location')
   inlines = [GymAnnouncementInline]
   
   def get_queryset(self, request):
       return super().get_queryset(request).prefetch_related('regular_users', 'workout_logs')

@admin.register(GymAnnouncement)
class GymAnnouncementAdmin(admin.ModelAdmin):
   list_display = ('gym', 'title', 'start_date', 'end_date')
   list_filter = ('start_date', 'end_date', 'gym')
   search_fields = ('title', 'content', 'gym__name')