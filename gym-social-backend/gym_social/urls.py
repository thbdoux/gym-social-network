from django.contrib import admin
from django.urls import path, include
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
    openapi.Info(
        title="Gym Social API",
        default_version='v1',
        description="API documentation for Gym Social Network",
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/posts/', include('apps.posts.urls')),
    path('api/workouts/', include('apps.workouts.urls')),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0)),
]