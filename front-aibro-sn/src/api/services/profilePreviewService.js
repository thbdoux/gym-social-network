// src/api/services/profilePreviewService.js
import apiClient from '../index';
import { extractData } from '../utils/responseParser';

/**
 * Service for profile preview API operations
 */
const profilePreviewService = {
  /**
   * Get complete profile preview data for a user
   */
  getUserProfilePreview: async (userId) => {
    const response = await apiClient.get(`/users/${userId}/profile-preview/`);
    return response.data;
  },

  /**
   * Get a user's friends for profile preview
   */
  getUserFriends: async (userId) => {
    const response = await apiClient.get(`/users/${userId}/friends/`);
    return response.data.friends || [];
  },

  /**
   * Get a user's posts for profile preview
   */
  getUserPosts: async (userId) => {
    const response = await apiClient.get(`/users/${userId}/posts/`);
    return response.data || [];
  },

  /**
   * Get detailed program data with appropriate permissions for profile preview
   */
  getProgramDetails: async (programId) => {
    const response = await apiClient.get(`/workouts/programs/${programId}/details/`);
    return response.data;
  },

  /**
   * Get detailed workout log data with appropriate permissions for profile preview
   */
  getWorkoutLogDetails: async (logId) => {
    const response = await apiClient.get(`/workouts/logs/${logId}/details/`);
    return response.data;
  }
};

export default profilePreviewService;