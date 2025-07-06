# gyms/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.GymViewSet, basename='gym')

urlpatterns = [
    path('', include(router.urls)),
    path('search/external/', views.search_external_gyms, name='search_external_gyms'),
    path('search/all/', views.search_all_gyms, name='search_all_gyms'),
    path('external/<str:place_id>/', views.get_external_gym_details, name='get_external_gym_details'),
    path('geocode/', views.geocode_address, name='geocode_address'),
    path('test-osm/', views.test_osm_connection, name='test_osm_connection'),
]

# Available endpoints:
# GET /gyms/ - List gyms
# GET /gyms/{id}/ - Get gym details
# GET /gyms/{id}/members/ - List gym members
# GET /gyms/{id}/active_members/ - List currently active members
# GET /gyms/{id}/stats/ - Get gym statistics
# POST /gyms/{id}/announce/ - Create gym announcement