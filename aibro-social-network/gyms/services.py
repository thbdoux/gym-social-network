# gyms/services.py
import requests
import logging
from typing import Dict, List, Optional, Tuple
from django.conf import settings
from django.core.cache import cache
from .models import Gym

logger = logging.getLogger(__name__)

class GymExternalService:
    """Service to interact with gym APIs (Google Places + OpenStreetMap fallback)"""
    
    def __init__(self):
        self.api_key = getattr(settings, 'GOOGLE_PLACES_API_KEY', '')
        self.base_url = "https://maps.googleapis.com/maps/api/place"
        self.overpass_url = "https://overpass-api.de/api/interpreter"
        
    def search_gyms(self, query: str, location: str = None, radius: int = 50000) -> List[Dict]:
        """
        Search for gyms using Google Places API with OpenStreetMap fallback
        
        Args:
            query: Search query (gym name, brand, etc.)
            location: "lat,lng" string for location-based search
            radius: Search radius in meters (default 50km)
            
        Returns:
            List of gym data dictionaries
        """
        # Try Google Places API first
        if self.api_key:
            try:
                if location and not query:
                    results = self._nearby_search(location, radius)
                else:
                    results = self._text_search(query, location)
                
                if results:
                    return results
                    
            except Exception as e:
                logger.warning(f"Google Places API failed, trying fallback: {e}")
        
        # Fallback to OpenStreetMap
        logger.info("Using OpenStreetMap Overpass API fallback")
        return self._search_openstreetmap(query, location, radius)
    
    def _text_search(self, query: str, location: str = None) -> List[Dict]:
        """Search gyms by text query"""
        cache_key = f"gym_search_text_{query}_{location}"
        cached_result = cache.get(cache_key)
        if cached_result:
            return cached_result
            
        url = f"{self.base_url}/textsearch/json"
        params = {
            'query': f"{query} gym fitness center",
            'key': self.api_key,
            'region': 'fr',  # Bias results to France
            'type': 'gym'
        }
        
        if location:
            params['location'] = location
            params['radius'] = 50000
            
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data.get('status') == 'OK':
                results = self._process_places_results(data.get('results', []))
                cache.set(cache_key, results, 3600)  # Cache for 1 hour
                return results
            else:
                logger.error(f"Places API error: {data.get('status')}")
                return []
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Error calling Places API: {e}")
            return []
    
    def _nearby_search(self, location: str, radius: int) -> List[Dict]:
        """Search gyms near a location"""
        cache_key = f"gym_search_nearby_{location}_{radius}"
        cached_result = cache.get(cache_key)
        if cached_result:
            return cached_result
            
        url = f"{self.base_url}/nearbysearch/json"
        params = {
            'location': location,
            'radius': radius,
            'type': 'gym',
            'key': self.api_key
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data.get('status') == 'OK':
                results = self._process_places_results(data.get('results', []))
                cache.set(cache_key, results, 3600)  # Cache for 1 hour
                return results
            else:
                logger.error(f"Places API error: {data.get('status')}")
                return []
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Error calling Places API: {e}")
            return []
    
    def _process_places_results(self, results: List[Dict]) -> List[Dict]:
        """Process and standardize Places API results"""
        processed = []
        
        for place in results:
            try:
                # Extract location
                location = place.get('geometry', {}).get('location', {})
                lat = location.get('lat')
                lng = location.get('lng')
                
                # Build address
                address = place.get('formatted_address', '')
                if not address:
                    address = place.get('vicinity', '')
                
                gym_data = {
                    'external_id': place.get('place_id'),
                    'name': place.get('name', ''),
                    'location': address,
                    'latitude': lat,
                    'longitude': lng,
                    'description': '',
                    'phone': '',
                    'website': '',
                    'source': 'google_places',
                    'rating': place.get('rating'),
                    'user_ratings_total': place.get('user_ratings_total'),
                    'price_level': place.get('price_level'),
                    'business_status': place.get('business_status'),
                    'types': place.get('types', []),
                    'photos': self._extract_photo_urls(place.get('photos', [])),
                    'opening_hours': self._extract_opening_hours(place.get('opening_hours')),
                    'amenities': {}
                }
                
                processed.append(gym_data)
                
            except Exception as e:
                logger.error(f"Error processing place data: {e}")
                continue
                
        return processed
    
    def _extract_photo_urls(self, photos: List[Dict]) -> List[str]:
        """Extract photo URLs from Places API photos"""
        if not photos or not self.api_key:
            return []
            
        photo_urls = []
        for photo in photos[:5]:  # Limit to 5 photos
            photo_reference = photo.get('photo_reference')
            if photo_reference:
                url = f"{self.base_url}/photo?maxwidth=400&photoreference={photo_reference}&key={self.api_key}"
                photo_urls.append(url)
                
        return photo_urls
    
    def _extract_opening_hours(self, opening_hours: Dict) -> Dict:
        """Extract opening hours information"""
        if not opening_hours:
            return {}
            
        return {
            'open_now': opening_hours.get('open_now'),
            'weekday_text': opening_hours.get('weekday_text', []),
            'periods': opening_hours.get('periods', [])
        }
    
    def get_gym_details(self, place_id: str) -> Optional[Dict]:
        """Get detailed information about a specific gym"""
        if not self.api_key or not place_id:
            return None
    
    def _search_openstreetmap(self, query: str, location: str = None, radius: int = 10000) -> List[Dict]:
        """Search gyms using OpenStreetMap Overpass API (free fallback)"""
        cache_key = f"osm_gym_search_{query}_{location}_{radius}"
        cached_result = cache.get(cache_key)
        if cached_result:
            return cached_result
            
        try:
            import threading
            import queue
            
            # Use threading to avoid blocking ASGI event loop
            result_queue = queue.Queue()
            
            def make_request():
                try:
                    import urllib.request
                    import json
                    
                    if location:
                        lat, lng = map(float, location.split(','))
                        overpass_query = f'[out:json][timeout:3];node["amenity"="gym"](around:{radius},{lat},{lng});out;'
                    else:
                        result_queue.put([])
                        return
                    
                    req = urllib.request.Request(
                        self.overpass_url,
                        data=overpass_query.encode('utf-8'),
                        headers={'Content-Type': 'text/plain'}
                    )
                    
                    with urllib.request.urlopen(req, timeout=5) as response:
                        data = json.loads(response.read().decode('utf-8'))
                        results = self._process_osm_results(data.get('elements', []))
                        result_queue.put(results)
                        
                except Exception as e:
                    logger.warning(f"OSM thread failed: {e}")
                    result_queue.put([])
            
            # Run in separate thread
            thread = threading.Thread(target=make_request)
            thread.daemon = True
            thread.start()
            thread.join(timeout=8)  # 8 second timeout
            
            if not result_queue.empty():
                results = result_queue.get()
                cache.set(cache_key, results, 3600)
                return results
            else:
                logger.warning("OSM request timed out")
                return []
            
        except Exception as e:
            logger.warning(f"OSM search failed: {str(e)}")
            return []
    
    def _process_osm_results(self, elements: List[Dict]) -> List[Dict]:
        """Process OpenStreetMap results into standardized format"""
        processed = []
        
        for element in elements:
            try:
                # Get coordinates
                if element['type'] == 'node':
                    lat, lng = element['lat'], element['lon']
                elif element['type'] == 'way' and 'center' in element:
                    lat, lng = element['center']['lat'], element['center']['lon']
                else:
                    continue
                
                tags = element.get('tags', {})
                name = tags.get('name', 'Gym')
                
                # Build address from OSM tags
                address_parts = []
                if tags.get('addr:housenumber'):
                    address_parts.append(tags['addr:housenumber'])
                if tags.get('addr:street'):
                    address_parts.append(tags['addr:street'])
                if tags.get('addr:city'):
                    address_parts.append(tags['addr:city'])
                elif tags.get('addr:town'):
                    address_parts.append(tags['addr:town'])
                if tags.get('addr:postcode'):
                    address_parts.append(tags['addr:postcode'])
                
                address = ', '.join(address_parts) if address_parts else f"Near {lat:.4f}, {lng:.4f}"
                
                # Extract amenities and opening hours
                amenities = {}
                opening_hours = {}
                
                if tags.get('opening_hours'):
                    opening_hours['weekday_text'] = [tags['opening_hours']]
                
                # Map OSM tags to amenities
                if tags.get('wheelchair') == 'yes':
                    amenities['wheelchair_accessible'] = True
                if tags.get('internet_access'):
                    amenities['wifi'] = tags['internet_access'] in ['wlan', 'wifi', 'yes']
                if tags.get('changing_room') == 'yes':
                    amenities['changing_rooms'] = True
                
                gym_data = {
                    'external_id': f"osm_{element['type']}_{element['id']}",
                    'name': name,
                    'location': address,
                    'latitude': lat,
                    'longitude': lng,
                    'description': '',
                    'phone': tags.get('phone', ''),
                    'website': tags.get('website', ''),
                    'source': 'openstreetmap',
                    'amenities': amenities,
                    'opening_hours': opening_hours,
                    'photos': [],
                    'types': [tags.get('leisure', tags.get('amenity', 'gym'))],
                    'brand': tags.get('brand', ''),
                }
                
                processed.append(gym_data)
                
            except Exception as e:
                logger.error(f"Error processing OSM element: {e}")
                continue
                
        return processed
            
        cache_key = f"gym_details_{place_id}"
        cached_result = cache.get(cache_key)
        if cached_result:
            return cached_result
            
        url = f"{self.base_url}/details/json"
        params = {
            'place_id': place_id,
            'fields': 'name,formatted_address,geometry,formatted_phone_number,website,opening_hours,rating,user_ratings_total,price_level,photos,types,business_status',
            'key': self.api_key
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data.get('status') == 'OK':
                result = self._process_places_results([data.get('result', {})])
                if result:
                    # Add additional details
                    place = data.get('result', {})
                    result[0]['phone'] = place.get('formatted_phone_number', '')
                    result[0]['website'] = place.get('website', '')
                    
                    cache.set(cache_key, result[0], 3600)
                    return result[0]
                    
        except requests.exceptions.RequestException as e:
            logger.error(f"Error getting place details: {e}")
            
        return None
    
    def save_gym_to_database(self, gym_data: Dict) -> Tuple[Gym, bool]:
        """
        Save external gym data to local database
        
        Returns:
            Tuple of (Gym instance, created boolean)
        """
        try:
            # Check if gym already exists by external_id
            external_id = gym_data.get('external_id')
            if external_id:
                existing_gym = Gym.objects.filter(external_id=external_id).first()
                if existing_gym:
                    return existing_gym, False
            
            # Create new gym
            gym = Gym.objects.create(
                name=gym_data.get('name', ''),
                location=gym_data.get('location', ''),
                description=gym_data.get('description', ''),
                latitude=gym_data.get('latitude'),
                longitude=gym_data.get('longitude'),
                phone=gym_data.get('phone', ''),
                website=gym_data.get('website', ''),
                external_id=external_id or '',
                source=gym_data.get('source', 'google_places'),
                amenities=gym_data.get('amenities', {}),
                equipment={},
                opening_hours=gym_data.get('opening_hours', {}),
                photos=gym_data.get('photos', [])
            )
            
            return gym, True
            
        except Exception as e:
            logger.error(f"Error saving gym to database: {e}")
            raise
    
    def geocode_location(self, address: str) -> Optional[Tuple[float, float]]:
        """
        Convert address to coordinates using Google Geocoding API
        
        Returns:
            Tuple of (latitude, longitude) or None
        """
        if not self.api_key:
            return None
            
        url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            'address': f"{address}, France",
            'key': self.api_key
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data.get('status') == 'OK' and data.get('results'):
                location = data['results'][0]['geometry']['location']
                return location['lat'], location['lng']
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Error geocoding address: {e}")
            
        return None