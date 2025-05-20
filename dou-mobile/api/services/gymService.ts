// api/services/gymService.ts
import apiClient from '../index';
import { extractData } from '../utils/responseParser';

interface Gym {
  id: number;
  name: string;
  location: string;
  description?: string;
  is_default?: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

/**
 * Service for gym API operations
 */
const gymService = {

  getGyms: async (): Promise<Gym[]> => {
    const response = await apiClient.get('/gyms/');
    return extractData(response);
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
  }
};

export default gymService;