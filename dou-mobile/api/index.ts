// api/index.ts - Enhanced with better network handling
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { handleApiError } from './utils/errorHandler';
import { authEvents } from './utils/authEvents';
import { API_URL } from './config';
import NetInfo from '@react-native-async-storage/async-storage'; // If you have it

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

// Create multiple timeout configurations for different scenarios
const createApiClient = () => {
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 15000, // Reduced from 20s for faster failure detection
    
    // Add additional axios configs for better performance
    maxRedirects: 3,
    validateStatus: (status) => status < 500, // Don't throw on 4xx errors, handle them in interceptor
  });
};

const apiClient = createApiClient();

// Enhanced timeout handling for different request types
const setRequestTimeout = (config: any) => {
  // Shorter timeout for quick operations (auth, user profile)
  if (config.url?.includes('/auth/') || config.url?.includes('/user/profile')) {
    config.timeout = 10000;
  }
  // Longer timeout for data-heavy operations
  else if (config.url?.includes('/workouts/') || config.url?.includes('/analytics/')) {
    config.timeout = 25000;
  }
  // Default timeout for everything else
  else {
    config.timeout = 15000;
  }
  
  return config;
};

// Request interceptor with enhanced error handling
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Apply dynamic timeout
      config = setRequestTimeout(config);
      
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Add request timestamp for debugging
      config.metadata = { startTime: Date.now() };
      
      console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url} (timeout: ${config.timeout}ms)`);
      
    } catch (error) {
      console.error('Error in request interceptor:', error);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with better error handling
apiClient.interceptors.response.use(
  (response) => {
    // Log response time for debugging
    const duration = Date.now() - (response.config.metadata?.startTime || Date.now());
    console.log(`✅ API Response: ${response.config.url} (${duration}ms)`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const duration = Date.now() - (originalRequest?.metadata?.startTime || Date.now());
    
    // Enhanced error logging
    if (error.code === 'ECONNABORTED') {
      console.log(`⏰ Request timeout: ${originalRequest?.url} after ${duration}ms`);
    } else if (error.message?.includes('Network Error')) {
      console.log(`🌐 Network error: ${originalRequest?.url} after ${duration}ms`);
    } else {
      console.log(`❌ API Error: ${originalRequest?.url} - ${error.response?.status} (${duration}ms)`);
    }

    // Handle timeout errors specifically
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      // For timeouts, don't attempt token refresh, just fail fast
      return Promise.reject({
        ...error,
        isTimeout: true,
        message: 'Request timed out. Please check your connection and try again.',
      });
    }

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
        console.log('🔄 Attempting token refresh...');
        
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Use a fresh axios instance for token refresh to avoid infinite loops
        const refreshResponse = await axios.post(`${API_URL}/auth/refresh/`, {
          refresh: refreshToken
        }, {
          timeout: 10000, // Short timeout for refresh
        });

        const { access: newToken } = refreshResponse.data;
        
        await SecureStore.setItemAsync('token', newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        processQueue(null, newToken);
        console.log('✅ Token refreshed successfully');
        
        // Retry original request with new token
        return apiClient(originalRequest);
        
      } catch (refreshError) {
        console.log('🚨 Token refresh failed, logging out');
        
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

    // Handle network errors gracefully
    if (error.message?.includes('Network Error')) {
      return Promise.reject({
        ...error,
        isNetworkError: true,
        message: 'Network connection failed. Please check your internet connection.',
      });
    }

    return Promise.reject(handleApiError(error));
  }
);

// Enhanced reset function
export const resetApiClient = () => {
  isLoggingOut = false;
  isRefreshing = false;
  failedQueue = [];
  
  // Clear any existing interceptors and recreate them if needed
  console.log('🔄 API client reset completed');
};

// Health check function to test connectivity
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${API_URL}/health/`, { 
      timeout: 5000,
      headers: { 'Cache-Control': 'no-cache' }
    });
    return response.status === 200;
  } catch (error) {
    console.log('🏥 API health check failed:', error);
    return false;
  }
};

export default apiClient;