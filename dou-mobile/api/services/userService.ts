// api/services/userService.ts
import apiClient from '../index';
import { extractData } from '../utils/responseParser';

interface User {
  id: number;
  username: string;
  email: string;
  [key: string]: any;
}

interface LoginResponse {
  access: string;
  refresh?: string;
}

interface RegisterUserData {
  username: string;
  password: string;
  email: string;
  training_level?: string;
  personality_type?: string;
}

/**
 * Service for user API operations
 */
const userService = {
  
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/users/me/');
    return response.data;
  },
  
  searchUsers: async (query: string): Promise<User[]> => {
    if (!query || query.length < 2) return [];
    
    try {
      const response = await apiClient.get(`/users/search/?q=${encodeURIComponent(query)}`);
      return extractData(response);
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  },

  getUserById: async (id: number): Promise<User> => {
    const response = await apiClient.get(`/users/${id}/`);
    return response.data;
  },

  getAllUsers: async (): Promise<User[]> => {
    const response = await apiClient.get('/users/');
    // Return results property if it exists, otherwise return entire data
    return response.data.results || response.data;
  },
  
  getFriends: async (): Promise<User[]> => {
    const response = await apiClient.get('/users/friends/');
    // Return results property if it exists, otherwise return entire data
    return Array.isArray(response.data) ? response.data :
           Array.isArray(response.data.results) ? response.data.results : [];
  },

  updateUser: async (updates: Partial<User>): Promise<User> => {
    const response = await apiClient.patch('/users/me/', updates);
    return response.data;
  },
  
  updateLanguagePreference: async (language: string): Promise<User> => {
    const response = await apiClient.post('/users/update-language/', { language });
    return response.data;
  },

  followUser: async (userId: number): Promise<any> => {
    const response = await apiClient.post(`/users/${userId}/follow/`);
    return response.data;
  },

  unfollowUser: async (userId: number): Promise<any> => {
    const response = await apiClient.post(`/users/${userId}/unfollow/`);
    return response.data;
  },
  
  getFriendRequests: async (): Promise<any[]> => {
    const response = await apiClient.get('/users/friend_requests/');
    return Array.isArray(response.data) ? response.data :
           Array.isArray(response.data.results) ? response.data.results : [];
  },

  sendFriendRequest: async (userId: number): Promise<any> => {
    const response = await apiClient.post(`/users/${userId}/send_friend_request/`);
    return response.data;
  },

  respondToFriendRequest: async (userId: number, responseType: 'accept' | 'reject'): Promise<any> => {
    const apiResponse = await apiClient.post(`/users/${userId}/respond_to_request/`, { response: responseType });
    return apiResponse.data;
  },

  removeFriend: async (userId: number): Promise<any> => {
    const response = await apiClient.post(`/users/${userId}/remove_friend/`);
    return response.data;
  },

  registerUser: async (userData: RegisterUserData): Promise<User> => {
    const response = await apiClient.post('/users/', userData);
    return response.data;
  },

  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post('/users/token/', {
      username,
      password,
    });
    return response.data;
  },

  getNotifications: async (): Promise<any[]> => {
    // This would be implemented when API endpoint is available
    return [];
  },


  /**
   * Check friendship status between current user and another user
   * @param userId - The ID of the user to check friendship status with
   * @returns A string representing the friendship status: 'self', 'friends', 'request_sent', 'request_received', or 'not_friends'
   */
  checkFriendshipStatus: async (userId: number): Promise<string> => {
    try {
      const response = await apiClient.get(`/users/${userId}/friendship-status/`);
      return response.data.status;
    } catch (error) {
      console.error('Error checking friendship status:', error);
      return 'not_friends'; // Default to not friends if there's an error
    }
  },
};

export default userService;