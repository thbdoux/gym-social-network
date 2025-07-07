# gyms/admin.py
from django.contrib import admin
from django.db.models import Count
from django.utils import timezone
from django.db.models import Q
from .models import Gym

@admin.register(Gym)
class GymAdmin(admin.ModelAdmin):
    list_display = ('name', 'location', 'get_member_count', 'get_active_users_today', 'created_at')
    list_filter = ('location', 'created_at')
    search_fields = ('name', 'location', 'description')
    ordering = ('name', 'location')

    def get_queryset(self, request):
        today = timezone.now().date()
        return super().get_queryset(request).annotate(
            member_count=Count('regular_users', distinct=True),
            active_users_count=Count(
                'workout_logs',
                filter=Q(workout_logs__date=today),
                distinct=True
            )
        )

    def get_member_count(self, obj):
        return obj.member_count
    get_member_count.short_description = 'Member Count'
    get_member_count.admin_order_field = 'member_count'

    def get_active_users_today(self, obj):
        return obj.active_users_count
    get_active_users_today.short_description = 'Active Users Today'
    get_active_users_today.admin_order_field = 'active_users_count'