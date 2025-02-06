# gyms/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GymViewSet

router = DefaultRouter()
router.register(r'', GymViewSet, basename='gym')

urlpatterns = [
   path('', include(router.urls)),
]

# Available endpoints:
# GET /gyms/ - List gyms
# GET /gyms/{id}/ - Get gym details
# GET /gyms/{id}/members/ - List gym members
# GET /gyms/{id}/active_members/ - List currently active members
# GET /gyms/{id}/stats/ - Get gym statistics
# POST /gyms/{id}/announce/ - Create gym announcement