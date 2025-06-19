// api/index.ts - Improved version with token refresh
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { handleApiError } from './utils/errorHandler';
import { authEvents } from './utils/authEvents';
import { API_URL } from './config';

// Prevent multiple operations
let isLoggingOut = false;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Add timeout to prevent hanging requests
});

// Request interceptor
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
  (error) => Promise.reject(error)
);

// Enhanced response interceptor with token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 errors for token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh token first
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Attempt token refresh
        const response = await axios.post(`${API_URL}/auth/refresh/`, {
          refresh: refreshToken
        });

        const { access: newToken } = response.data;
        
        // Store new token
        await SecureStore.setItemAsync('token', newToken);
        
        // Update original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        // Process queued requests
        processQueue(null, newToken);
        
        console.log('✅ Token refreshed successfully');
        
        // Retry original request
        return apiClient(originalRequest);
        
      } catch (refreshError) {
        console.log('🚨 Token refresh failed, logging out');
        
        // Only logout if refresh fails
        processQueue(refreshError);
        
        if (!isLoggingOut) {
          isLoggingOut = true;
          
          try {
            await SecureStore.deleteItemAsync('token');
            await SecureStore.deleteItemAsync('refreshToken');
            authEvents.emit('tokenExpired');
            
            setTimeout(() => {
              router.replace('/(auth)/login');
              setTimeout(() => {
                isLoggingOut = false;
              }, 1000);
            }, 100);
            
          } catch (logoutError) {
            console.error('Error during logout:', logoutError);
            isLoggingOut = false;
          }
        }
        
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other 4xx errors more gracefully
    if (error.response?.status === 403) {
      // Don't immediately logout on 403, might be permission issue
      console.log('⚠️ 403 Forbidden - permission denied');
    }

    return Promise.reject(handleApiError(error));
  }
);

// Reset flags when app becomes active
export const resetLogoutFlag = () => {
  isLoggingOut = false;
  isRefreshing = false;
  failedQueue = [];
  console.log('🔄 API client flags reset');
};

export default apiClient;