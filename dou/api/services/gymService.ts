// Fixed gymService.ts
import apiClient from '../index';
import { extractData } from '../utils/responseParser';

interface Gym {
  id: number;
  name: string;
  location: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  website?: string;
  external_id?: string;
  source?: string;
  amenities?: Record<string, any>;
  equipment?: Record<string, any>;
  opening_hours?: Record<string, any>;
  photos?: string[];
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  business_status?: string;
  types?: string[];
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

interface ExternalGym {
  external_id: string;
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  phone?: string;
  website?: string;
  source: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  business_status?: string;
  types?: string[];
  photos?: string[];
  opening_hours?: Record<string, any>;
  amenities?: Record<string, any>;
}

interface GymSearchParams {
  q?: string;
  location?: string;
  radius?: number;
  include_external?: boolean;
}

interface GymSearchResponse {
  local_gyms: Gym[];
  external_gyms: ExternalGym[];
  total_count: number;
}

interface ExternalGymSearchResponse {
  results: ExternalGym[];
  count: number;
  query?: string;
  location?: string;
  geocoded_location?: string;
}

interface SaveExternalGymResponse {
  gym: Gym;
  created: boolean;
}

const gymService = {
  getGyms: async (): Promise<Gym[]> => {
    try {
      const response = await apiClient.get('/gyms/');
      const data = extractData(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching gyms:', error);
      return [];
    }
  },

  getGymById: async (id: number): Promise<Gym> => {
    const response = await apiClient.get(`/gyms/${id}/`);
    return response.data;
  },

  createGym: async (gymData: Partial<Gym>): Promise<Gym> => {
    const response = await apiClient.post('/gyms/', gymData);
    return response.data;
  },

  updateGym: async (id: number, updates: Partial<Gym>): Promise<Gym> => {
    const response = await apiClient.patch(`/gyms/${id}/`, updates);
    return response.data;
  },

  deleteGym: async (id: number): Promise<void> => {
    await apiClient.delete(`/gyms/${id}/`);
  },

  searchExternalGyms: async (params: GymSearchParams = {}): Promise<ExternalGymSearchResponse> => {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.q) searchParams.append('q', params.q);
      if (params.location) searchParams.append('location', params.location);
      if (params.radius) searchParams.append('radius', params.radius.toString());
      
      const response = await apiClient.get(`/gyms/search/external/?${searchParams.toString()}`);
      const data = response.data;
      
      return {
        results: Array.isArray(data.results) ? data.results : [],
        count: data.count || 0,
        query: data.query,
        location: data.location,
        geocoded_location: data.geocoded_location
      };
    } catch (error) {
      console.error('Error searching external gyms:', error);
      return { results: [], count: 0 };
    }
  },

  searchAllGyms: async (params: GymSearchParams = {}): Promise<GymSearchResponse> => {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.q) searchParams.append('q', params.q);
      if (params.location) searchParams.append('location', params.location);
      if (params.include_external !== undefined) {
        searchParams.append('include_external', params.include_external.toString());
      }
      
      const response = await apiClient.get(`/gyms/search/all/?${searchParams.toString()}`);
      const data = response.data;
      
      return {
        local_gyms: Array.isArray(data.local_gyms) ? data.local_gyms : [],
        external_gyms: Array.isArray(data.external_gyms) ? data.external_gyms : [],
        total_count: data.total_count || 0
      };
    } catch (error) {
      console.error('Error searching all gyms:', error);
      return { local_gyms: [], external_gyms: [], total_count: 0 };
    }
  },

  getExternalGymDetails: async (placeId: string): Promise<ExternalGym> => {
    const response = await apiClient.get(`/gyms/details/${placeId}/`);
    return response.data.gym;
  },

  saveExternalGym: async (gymData: ExternalGym): Promise<SaveExternalGymResponse> => {
    const response = await apiClient.post('/gyms/save_external_gym/', gymData);
    return response.data;
  },

  geocodeAddress: async (address: string): Promise<{latitude: number; longitude: number; address: string}> => {
    const response = await apiClient.post('/gyms/geocode/', { address });
    return response.data;
  },

  isExternalGym: (gym: Gym | ExternalGym): gym is ExternalGym => {
    return !('id' in gym) && 'external_id' in gym;
  },

  formatGymDisplay: (gym: Gym | ExternalGym): string => {
    if (gymService.isExternalGym(gym)) {
      return `${gym.name} - ${gym.location} (External)`;
    }
    return `${gym.name} - ${gym.location}`;
  },

  formatRating: (gym: Gym | ExternalGym): string => {
    const rating = gym.rating;
    const totalRatings = gym.user_ratings_total;
    
    if (!rating) return 'No rating';
    
    const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
    const ratingsText = totalRatings ? ` (${totalRatings} reviews)` : '';
    
    return `${stars} ${rating.toFixed(1)}${ratingsText}`;
  }
};

export default gymService;
export type { 
  Gym, 
  ExternalGym, 
  GymSearchParams, 
  GymSearchResponse, 
  ExternalGymSearchResponse,
  SaveExternalGymResponse 
};