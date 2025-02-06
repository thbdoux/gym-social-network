# users/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import User, Friendship, FriendRequest

class FriendshipInline(admin.TabularInline):
    model = Friendship
    fk_name = 'from_user'
    extra = 1
    raw_id_fields = ('to_user',)

class FriendRequestInline(admin.TabularInline):
    model = FriendRequest
    fk_name = 'from_user'
    extra = 1
    raw_id_fields = ('to_user',)

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'get_preferred_gym', 'training_level', 
                   'get_friends_count', 'date_joined')
    list_filter = ('training_level', 'personality_type', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    inlines = [FriendshipInline, FriendRequestInline]
    readonly_fields = ('date_joined', 'last_login')
    raw_id_fields = ('preferred_gym', 'current_program')

    def get_preferred_gym(self, obj):
        if obj.preferred_gym:
            return format_html(
                '<a href="{}?id={}">{}</a>',
                '../gym/',
                obj.preferred_gym.id,
                obj.preferred_gym.name
            )
        return '-'
    get_preferred_gym.short_description = 'Gym'

    def get_friends_count(self, obj):
        return obj.friends.count()
    get_friends_count.short_description = 'Friends'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'preferred_gym', 'current_program'
        ).prefetch_related('friends')

@admin.register(FriendRequest)
class FriendRequestAdmin(admin.ModelAdmin):
    list_display = ('from_user', 'to_user', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('from_user__username', 'to_user__username')
    raw_id_fields = ('from_user', 'to_user')