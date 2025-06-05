// api/index.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { handleApiError } from './utils/errorHandler';
import { authEvents } from './utils/authEvents';
import { API_URL } from './config';

// Prevent multiple logout operations
let isLoggingOut = false;

/**
 * Configure the base API client with common settings
 */
const apiClient = axios.create({
  // Use the centralized API URL configuration
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error retrieving token:', error);
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized) - but only once per session
    if (error.response?.status === 401 && !originalRequest._retry && !isLoggingOut) {
      console.log('🚨 401 Unauthorized detected - initiating logout');
      originalRequest._retry = true;
      
      // Prevent multiple simultaneous logout operations
      if (isLoggingOut) {
        console.log('🔒 Logout already in progress, skipping');
        return Promise.reject(error);
      }
      
      isLoggingOut = true;
      
      try {
        // Clear token immediately
        await SecureStore.deleteItemAsync('token');
        console.log('🗑️ Token cleared from storage');
        
        // Emit the token expired event to notify auth context
        authEvents.emit('tokenExpired');
        
        // Add small delay to allow auth context to handle logout
        setTimeout(() => {
          // Force navigation to login - this ensures user is redirected
          console.log('🔄 Redirecting to login page');
          router.replace('/(auth)/login');
          
          // Reset the logout flag after navigation
          setTimeout(() => {
            isLoggingOut = false;
            console.log('✅ Logout process completed');
          }, 1000);
        }, 100);
        
      } catch (logoutError) {
        console.error('🚨 Error during logout:', logoutError);
        isLoggingOut = false;
      }
      
      return Promise.reject(error);
    }

    // Handle other 4xx errors that should also trigger logout
    if (error.response?.status === 403 && !originalRequest._retry && !isLoggingOut) {
      console.log('🚨 403 Forbidden detected - session may be invalid');
      originalRequest._retry = true;
      
      if (!isLoggingOut) {
        isLoggingOut = true;
        
        try {
          await SecureStore.deleteItemAsync('token');
          authEvents.emit('tokenExpired');
          
          setTimeout(() => {
            router.replace('/(auth)/login');
            setTimeout(() => {
              isLoggingOut = false;
            }, 1000);
          }, 100);
          
        } catch (logoutError) {
          console.error('🚨 Error during 403 logout:', logoutError);
          isLoggingOut = false;
        }
      }
      
      return Promise.reject(error);
    }

    console.error('Response error:', error);
    return Promise.reject(handleApiError(error));
  }
);

// Reset logout flag when app becomes active (handles edge cases)
export const resetLogoutFlag = () => {
  isLoggingOut = false;
  console.log('🔄 Logout flag reset');
};

export default apiClient;