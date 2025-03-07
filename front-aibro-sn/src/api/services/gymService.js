// src/api/services/gymService.js
import apiClient from '../index';
import { extractData } from '../utils/responseParser';

/**
 * Service for gym API operations
 */
const gymService = {

  getGyms: async () => {
    const response = await apiClient.get('/gyms/');
    return extractData(response);
  },

  getGymById: async (id) => {
    const response = await apiClient.get(`/gyms/${id}/`);
    return response.data;
  },

  createGym: async (gymData) => {
    const response = await apiClient.post('/gyms/', gymData);
    return response.data;
  },

  updateGym: async (id, updates) => {
    const response = await apiClient.patch(`/gyms/${id}/`, updates);
    return response.data;
  },

  deleteGym: async (id) => {
    await apiClient.delete(`/gyms/${id}/`);
  }
};

export default gymService;