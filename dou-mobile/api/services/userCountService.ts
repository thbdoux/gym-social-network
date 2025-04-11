// api/services/userCountService.ts
import apiClient from '../index';
import { extractData } from '../utils/responseParser';


/**
 * Service for user count-related API operations
 */
const userCountService = {

  // Add these methods to userCountService

  /**
   * Get the count of friends for a specific user
   */
  getUserFriendsCount: async (userId: number): Promise<number> => {
    try {
      const response = await apiClient.get(`/users/${userId}/friends/count/`);
      return response.data.count || 0;
    } catch (error) {
      console.error('Error fetching user friends count:', error);
      return 0;
    }
  },

  /**
   * Get the count of posts for a specific user
   */
  getUserPostsCount: async (userId: number): Promise<number> => {
    try {
      const response = await apiClient.get(`/posts/user/${userId}/count/`);
      return response.data.count || 0;
    } catch (error) {
      console.error('Error fetching user posts count:', error);
      return 0;
    }
  },

  /**
   * Get the count of workouts for a specific user
   */
  getUserWorkoutsCount: async (userId: number): Promise<number> => {
    try {
      const response = await apiClient.get(`/workouts/logs/user/${userId}/count/`);
      return response.data.count || 0;
    } catch (error) {
      console.error('Error fetching user workouts count:', error);
      return 0;
    }
  },

  /**
   * Get all counts for a specific user in a single request
   */
  getUserAllCounts: async (userId: number): Promise<{
    friends_count: number;
    posts_count: number;
    workouts_count: number;
  }> => {
    try {
      const response = await apiClient.get(`/users/${userId}/counts/`);
      return {
        friends_count: response.data.friends_count || 0,
        posts_count: response.data.posts_count || 0,
        workouts_count: response.data.workouts_count || 0
      };
    } catch (error) {
      console.error('Error fetching user all counts:', error);
      return {
        friends_count: 0,
        posts_count: 0,
        workouts_count: 0
      };
    }
  },
  /**
   * Get the count of friends for the current user
   */
  getFriendsCount: async (): Promise<number> => {
    try {
      const response = await apiClient.get('/users/friends/count/');
      return response.data.count || 0;
    } catch (error) {
      console.error('Error fetching friends count:', error);
      return 0;
    }
  },

  /**
   * Get the count of posts for the current user
   */
  getPostsCount: async (): Promise<number> => {
    try {
      const response = await apiClient.get('/posts/count/');
      return response.data.count || 0;
    } catch (error) {
      console.error('Error fetching posts count:', error);
      return 0;
    }
  },

  /**
   * Get the count of workouts for the current user
   */
  getWorkoutsCount: async (): Promise<number> => {
    try {
      const response = await apiClient.get('/workouts/logs/count/');
      return response.data.count || 0;
    } catch (error) {
      console.error('Error fetching workouts count:', error);
      return 0;
    }
  },

  /**
   * Get all counts in a single request (more efficient)
   */
  getAllCounts: async (): Promise<{
    friends_count: number;
    posts_count: number;
    workouts_count: number;
  }> => {
    try {
      const response = await apiClient.get('/users/me/counts/');
      return {
        friends_count: response.data.friends_count || 0,
        posts_count: response.data.posts_count || 0,
        workouts_count: response.data.workouts_count || 0
      };
    } catch (error) {
      console.error('Error fetching all counts:', error);
      return {
        friends_count: 0,
        posts_count: 0,
        workouts_count: 0
      };
    }
  }
};

export default userCountService;