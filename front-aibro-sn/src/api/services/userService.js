// src/api/services/userService.js
import apiClient from '../index';
import { extractData } from '../utils/responseParser';

/**
 * Service for user API operations
 */
 const userService = {
  
  getCurrentUser: async () => {
    const response = await apiClient.get('/users/me/');
    return response.data;
  },

  getUserById: async (id) => {
    const response = await apiClient.get(`/users/${id}/`);
    return response.data;
  },

  getAllUsers: async () => {
    const response = await apiClient.get('/users/');
    // Return results property if it exists, otherwise return entire data
    return response.data.results || response.data;
  },
  
  getFriends: async () => {
    const response = await apiClient.get('/users/friends/');
    // Return results property if it exists, otherwise return entire data
    return Array.isArray(response.data) ? response.data :
           Array.isArray(response.data.results) ? response.data.results : [];
  },

  updateUser: async (updates) => {
    const response = await apiClient.patch('/users/me/', updates);
    return response.data;
  },

  followUser: async (userId) => {
    const response = await apiClient.post(`/users/${userId}/follow/`);
    return response.data;
  },

  unfollowUser: async (userId) => {
    const response = await apiClient.post(`/users/${userId}/unfollow/`);
    return response.data;
  }
};
export default userService;