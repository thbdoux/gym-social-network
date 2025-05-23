// api/services/userService.ts
import apiClient from '../index';
import { extractData } from '../utils/responseParser';
import { compressImage } from '../../utils/imageUtils';

// Add any missing imports to ensure the code works correctly
import { Platform } from 'react-native';

interface User {
  id: number;
  username: string;
  email: string;
  email_verified?: boolean;
  avatar?: string;
  [key: string]: any;
}

interface LoginResponse {
  access: string;
  refresh?: string;
}

interface SocialLoginResponse {
  access: string;
  refresh?: string;
  user: User;
}

interface RegisterUserData {
  username: string;
  password: string;
  email: string;
  training_level?: string;
  personality_type?: string;
  language_preference?: string;
  fitness_goals?: string;
  bio?: string;
}

// Used to store the most recently uploaded avatar path
let lastUploadedAvatarPath: string | null = null;

/**
 * Service for user API operations
 */
const userService = {
  
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/users/me/');
    return response.data;
  },
  
  // Get the last uploaded avatar path
  getLastUploadedAvatarPath: () => {
    return lastUploadedAvatarPath;
  },
  
  // Clear the last uploaded avatar path
  clearLastUploadedAvatarPath: () => {
    lastUploadedAvatarPath = null;
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

  updateUser: async (updates: Partial<User> | FormData): Promise<User> => {
    try {
      let response;
      let hasAvatarUpdate = false;
      
      // Check if updates is FormData (for file uploads)
      if (updates instanceof FormData) {
        console.log('Using FormData for update');
        
        // Check if FormData contains an avatar/profile picture
        const processedFormData = new FormData();
        let hasProfileImage = false;
        let avatarFieldName = '';
        
        // Clone and process the FormData
        for (const [key, value] of (updates as any).entries()) {
          // Check if this is an image field (avatar, profile_picture, etc.)
          const isImageField = key === 'avatar' || key === 'profile_picture' || key === 'profile_image';
          
          if (isImageField && typeof value === 'object' && value.uri) {
            hasProfileImage = true;
            hasAvatarUpdate = true;
            avatarFieldName = key;
            
            try {
              // Log original image details
              console.log(`Original image: ${JSON.stringify({
                uri: value.uri,
                type: value.type,
                name: value.name
              })}`);
              
              // Compress the image before adding to FormData
              console.log('Compressing profile image before upload');
              const compressedUri = await compressImage(value.uri, {
                maxWidth: 1000,
                maxHeight: 1000,
                quality: 0.8,
                maxSizeKB: 800
              });
              
              // Create a new file object with the compressed URI
              const compressedFile = {
                uri: compressedUri,
                type: value.type || 'image/jpeg',
                name: value.name || 'profile-picture.jpg'
              };
              
              processedFormData.append(key, compressedFile as any);
              console.log(`Added compressed image to FormData (${key})`);
            } catch (compressionError) {
              console.error('Error compressing image:', compressionError);
              // Fall back to original image if compression fails
              processedFormData.append(key, value);
            }
          } else {
            // For non-image fields, just copy as is
            processedFormData.append(key, value);
          }
        }
        
        if (hasProfileImage) {
          console.log('Uploading with compressed profile image');
        }
        
        // For FormData with file uploads, explicit configuration is needed
        response = await apiClient.patch('/users/me/', processedFormData, {
          headers: {
            'Accept': 'application/json',
            // Don't set Content-Type header - let Axios set it with boundary
          },
          // Add this to make axios handle the FormData correctly
          transformRequest: (data, headers) => {
            // Remove Content-Type header to let browser set it
            delete headers['Content-Type'];
            return data;
          }
        });
        
        // If this was an avatar update, store the path for later use
        if (hasAvatarUpdate && response.data && response.data[avatarFieldName]) {
          lastUploadedAvatarPath = response.data[avatarFieldName];
          console.log('Updated avatar path:', lastUploadedAvatarPath);
        }
      } else {
        // For regular JSON data
        console.log('Using JSON for update:', JSON.stringify(updates));
        
        // Check if this is an avatar update via JSON
        if (updates.avatar) {
          hasAvatarUpdate = true;
        }
        
        response = await apiClient.patch('/users/me/', updates);
        
        // If this was an avatar update, store the path for later use
        if (hasAvatarUpdate && response.data && response.data.avatar) {
          lastUploadedAvatarPath = response.data.avatar;
          console.log('Updated avatar path:', lastUploadedAvatarPath);
        }
      }
      
      // If this was an avatar update, force a refresh of the avatar in the UI
      // by adding a timestamp-based cache buster for components to use
      if (hasAvatarUpdate) {
        console.log('Avatar updated successfully');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      
      // Enhanced error logging
      if (error.response) {
        console.error('API Error Response:', JSON.stringify({
          data: error.response.data,
          headers: error.response.headers,
          status: error.response.status
        }));
        
        // Show friendly message for 413 errors
        if (error.response.status === 413) {
          throw new Error('The image is too large. Please try a smaller image or try again.');
        }
      }
      
      throw error;
    }
  },
  
  // Rest of the service methods remain unchanged
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

  // Updated register method that uses new endpoint
  register: async (userData: RegisterUserData): Promise<any> => {
    const response = await apiClient.post('/users/register/', userData);
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

  // NEW METHODS FOR SOCIAL AUTH AND EMAIL VERIFICATION

  /**
   * Social login with external providers like Google or Instagram
   * @param provider - The social provider (google, instagram)
   * @param accessToken - OAuth access token from the provider
   */
  socialLogin: async (provider: string, accessToken: string): Promise<SocialLoginResponse> => {
    const response = await apiClient.post('/users/social-auth/', { 
      provider, 
      access_token: accessToken 
    });
    return response.data;
  },

  /**
   * Verify email with token received from verification email
   * @param token - Verification token
   * @param email - User email address
   */
  verifyEmail: async (token: string, email: string): Promise<any> => {
    const response = await apiClient.post('/users/verify-email/', { token, email });
    return response.data;
  },

  /**
   * Resend verification email to user
   * @param email - Email address to send verification email to
   */
  resendVerification: async (email: string): Promise<any> => {
    const response = await apiClient.post('/users/resend-verification/', { email });
    return response.data;
  },
  
  /**
   * Check if email is already registered
   * @param email - Email to check
   */
  checkEmailExists: async (email: string): Promise<boolean> => {
    try {
      const response = await apiClient.post('/users/check-email/', { email });
      return response.data.exists;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  },

  /**
   * Request password reset
   * @param email - User's email address
   */
  requestPasswordReset: async (email: string): Promise<any> => {
    const response = await apiClient.post('/users/password-reset/', { email });
    return response.data;
  },

  /**
   * Reset password with token
   * @param token - Reset token
   * @param email - User email
   * @param newPassword - New password
   */
  resetPassword: async (token: string, email: string, newPassword: string): Promise<any> => {
    const response = await apiClient.post('/users/password-reset-confirm/', { 
      token, 
      email, 
      new_password: newPassword 
    });
    return response.data;
  }
};

export default userService;