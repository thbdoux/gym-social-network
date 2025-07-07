# gyms/views.py
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from .models import Gym
from .serializers import GymSerializer, GymCreateSerializer
from .services import GymExternalService
import logging

logger = logging.getLogger(__name__)

class GymViewSet(ModelViewSet):
    """ViewSet for managing gyms in database"""
    queryset = Gym.objects.all()
    serializer_class = GymSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return GymCreateSerializer
        return GymSerializer
    
    @action(detail=False, methods=['post'])
    def save_external_gym(self, request):
        """Save an external gym to database"""
        gym_data = request.data
        
        if not gym_data.get('external_id'):
            return Response(
                {'error': 'external_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            service = GymExternalService()
            gym, created = service.save_gym_to_database(gym_data)
            
            serializer = self.get_serializer(gym)
            return Response({
                'gym': serializer.data,
                'created': created
            }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error saving external gym: {e}")
            return Response(
                {'error': 'Failed to save gym'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def search_external_gyms(request):
    """
    Search for gyms using external API (Google Places)
    
    Query Parameters:
    - q: Search query (gym name, brand, etc.)
    - location: Address or "lat,lng" for location-based search
    - radius: Search radius in meters (default 50000)
    """
    query = request.GET.get('q', '').strip()
    location_param = request.GET.get('location', '').strip()
    radius = int(request.GET.get('radius', 50000))
    
    if not query and not location_param:
        return Response(
            {'error': 'Either query (q) or location parameter is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        service = GymExternalService()
        
        # If location is provided as address, geocode it
        location_coords = None
        if location_param:
            # Check if it's already coordinates (lat,lng format)
            if ',' in location_param and len(location_param.split(',')) == 2:
                try:
                    lat, lng = map(float, location_param.split(','))
                    location_coords = f"{lat},{lng}"
                except ValueError:
                    # Not coordinates, try geocoding as address
                    coords = service.geocode_location(location_param)
                    if coords:
                        location_coords = f"{coords[0]},{coords[1]}"
            else:
                # Geocode the address
                coords = service.geocode_location(location_param)
                if coords:
                    location_coords = f"{coords[0]},{coords[1]}"
        
        # Search for gyms
        results = service.search_gyms(
            query=query,
            location=location_coords,
            radius=radius
        )
        
        return Response({
            'results': results,
            'count': len(results),
            'query': query,
            'location': location_param,
            'geocoded_location': location_coords
        })
        
    except Exception as e:
        logger.error(f"Error searching external gyms: {e}")
        return Response(
            {'error': 'Failed to search gyms'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_external_gym_details(request, place_id):
    """Get detailed information about a specific gym from external API"""
    
    try:
        service = GymExternalService()
        gym_details = service.get_gym_details(place_id)
        
        if gym_details:
            return Response({'gym': gym_details})
        else:
            return Response(
                {'error': 'Gym not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
    except Exception as e:
        logger.error(f"Error getting gym details: {e}")
        return Response(
            {'error': 'Failed to get gym details'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def search_all_gyms(request):
    """
    Combined search: local database + external API
    
    Query Parameters:
    - q: Search query
    - location: Location for search
    - include_external: Include external API results (default: true)
    """
    query = request.GET.get('q', '').strip()
    location = request.GET.get('location', '').strip()
    include_external = request.GET.get('include_external', 'true').lower() == 'true'
    
    try:
        results = {
            'local_gyms': [],
            'external_gyms': [],
            'total_count': 0
        }
        
        # Search local database
        if query:
            local_gyms = Gym.objects.filter(
                name__icontains=query
            ).order_by('name')
        else:
            local_gyms = Gym.objects.all().order_by('name')
        
        serializer = GymSerializer(local_gyms, many=True)
        results['local_gyms'] = serializer.data
        
        # Search external API if requested (now with threading support)
        if include_external and (query or location):
            service = GymExternalService()
            
            # Geocode location if provided
            location_coords = None
            if location:
                if ',' in location and len(location.split(',')) == 2:
                    try:
                        lat, lng = map(float, location.split(','))
                        location_coords = f"{lat},{lng}"
                    except ValueError:
                        pass  # Skip geocoding for now to avoid blocking
                else:
                    pass  # Skip geocoding for now to avoid blocking
            
            external_gyms = service.search_gyms(
                query=query,
                location=location_coords
            )
            
            # Filter out gyms that are already in local database
            local_external_ids = set(
                gym.external_id for gym in local_gyms 
                if gym.external_id
            )
            
            results['external_gyms'] = [
                gym for gym in external_gyms 
                if gym.get('external_id') not in local_external_ids
            ]
        
        results['total_count'] = len(results['local_gyms'])
        
        return Response(results)
        
    except Exception as e:
        logger.error(f"Error in combined gym search: {e}")
        return Response(
            {'error': 'Failed to search gyms'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def test_osm_connection(request):
    """Test OpenStreetMap API connectivity"""
    try:
        response = requests.post(
            "https://overpass-api.de/api/interpreter",
            data='[out:json][timeout:5];node["amenity"="gym"](around:5000,44.8378,-0.5940);out;',
            headers={'Content-Type': 'text/plain'},
            timeout=8
        )
        
        return Response({
            'status': response.status_code,
            'response_size': len(response.content),
            'first_100_chars': response.text[:100],
            'success': response.status_code == 200
        })
        
    except Exception as e:
        return Response({
            'error': str(e),
            'success': False
        }, status=500)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def geocode_address(request):
    """Geocode an address to coordinates"""
    address = request.data.get('address', '').strip()
    
    if not address:
        return Response(
            {'error': 'Address is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        service = GymExternalService()
        coords = service.geocode_location(address)
        
        if coords:
            return Response({
                'latitude': coords[0],
                'longitude': coords[1],
                'address': address
            })
        else:
            return Response(
                {'error': 'Could not geocode address'}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
    except Exception as e:
        logger.error(f"Error geocoding address: {e}")
        return Response(
            {'error': 'Failed to geocode address'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )