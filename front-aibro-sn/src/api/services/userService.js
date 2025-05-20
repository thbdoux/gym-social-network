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
  
  searchUsers: async (query) => {
    if (!query || query.length < 2) return [];
    
    try {
      const response = await apiClient.get(`/users/search/?q=${encodeURIComponent(query)}`);
      return extractData(response);
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
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

  updateLanguagePreference: async (language) => {
    const response = await apiClient.post('/users/update-language/', { language });
    return response.data;
  },
  
  followUser: async (userId) => {
    const response = await apiClient.post(`/users/${userId}/follow/`);
    return response.data;
  },

  unfollowUser: async (userId) => {
    const response = await apiClient.post(`/users/${userId}/unfollow/`);
    return response.data;
  },
  
  getFriendRequests: async () => {
    const response = await apiClient.get('/users/friend_requests/');
    return Array.isArray(response.data) ? response.data :
           Array.isArray(response.data.results) ? response.data.results : [];
  },

  sendFriendRequest: async (userId) => {
    const response = await apiClient.post(`/users/${userId}/send_friend_request/`);
    return response.data;
  },

  respondToFriendRequest: async (userId, response) => {
    const apiResponse = await apiClient.post(`/users/${userId}/respond_to_request/`, { response });
    return apiResponse.data;
  },

  removeFriend: async (userId) => {
    const response = await apiClient.post(`/users/${userId}/remove_friend/`);
    return response.data;
  },

  registerUser: async (userData) => {
    const response = await apiClient.post('/users/', userData);
    return response.data;
  },

  login: async (username, password) => {
    const response = await apiClient.post('/users/token/', {
      username,
      password,
    });
    return response.data;
  },

  getNotifications: async () => {
    // This would be implemented when API endpoint is available
    return [];
  }

};
export default userService;