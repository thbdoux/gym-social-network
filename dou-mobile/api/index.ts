// api/index.ts - Enhanced with logout state tracking

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { handleApiError } from './utils/errorHandler';
import { authEvents } from './utils/authEvents';
import { API_URL } from './config';

// Enhanced state tracking
let isLoggingOut = false;
let isRefreshing = false;
let isLoggedOut = false; // NEW: Track if user is logged out
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

// Create API client with enhanced configuration
const createApiClient = () => {
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 15000,
    maxRedirects: 3,
    validateStatus: (status) => status < 500,
  });
};

const apiClient = createApiClient();

// Enhanced timeout handling
const setRequestTimeout = (config: any) => {
  if (config.url?.includes('/auth/') || config.url?.includes('/user/profile')) {
    config.timeout = 10000;
  }
  else if (config.url?.includes('/workouts/') || config.url?.includes('/analytics/')) {
    config.timeout = 25000;
  }
  else {
    config.timeout = 15000;
  }
  
  return config;
};

// Enhanced request interceptor with logout checks
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // CRITICAL: Block all requests if logged out
      if (isLoggedOut) {
        console.log('🚫 Blocking request - user is logged out:', config.url);
        return Promise.reject({
          message: 'Request blocked - user is logged out',
          code: 'USER_LOGGED_OUT',
          config
        });
      }

      // Block requests during logout process
      if (isLoggingOut) {
        console.log('🚫 Blocking request - logout in progress:', config.url);
        return Promise.reject({
          message: 'Request blocked - logout in progress',
          code: 'LOGOUT_IN_PROGRESS',
          config
        });
      }
      
      config = setRequestTimeout(config);
      
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
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

// Enhanced response interceptor
apiClient.interceptors.response.use(
  (response) => {
    const duration = Date.now() - (response.config.metadata?.startTime || Date.now());
    console.log(`✅ API Response: ${response.config.url} (${duration}ms)`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const duration = Date.now() - (originalRequest?.metadata?.startTime || Date.now());
    
    // Handle blocked requests gracefully
    if (error.code === 'USER_LOGGED_OUT' || error.code === 'LOGOUT_IN_PROGRESS') {
      console.log(`🚫 Request blocked: ${error.message}`);
      return Promise.reject(error);
    }
    
    // Enhanced error logging
    if (error.code === 'ECONNABORTED') {
      console.log(`⏰ Request timeout: ${originalRequest?.url} after ${duration}ms`);
    } else if (error.message?.includes('Network Error')) {
      console.log(`🌐 Network error: ${originalRequest?.url} after ${duration}ms`);
    } else {
      console.log(`❌ API Error: ${originalRequest?.url} - ${error.response?.status} (${duration}ms)`);
    }

    // Don't attempt refresh if logged out
    if (isLoggedOut || isLoggingOut) {
      return Promise.reject(error);
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return Promise.reject({
        ...error,
        isTimeout: true,
        message: 'Request timed out. Please check your connection and try again.',
      });
    }

    // Token refresh logic (only if not logged out)
    if (error.response?.status === 401 && !originalRequest._retry && !isLoggedOut) {
      if (isRefreshing) {
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

        const refreshResponse = await axios.post(`${API_URL}/auth/refresh/`, {
          refresh: refreshToken
        }, {
          timeout: 10000,
        });

        const { access: newToken } = refreshResponse.data;
        
        await SecureStore.setItemAsync('token', newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        processQueue(null, newToken);
        console.log('✅ Token refreshed successfully');
        
        return apiClient(originalRequest);
        
      } catch (refreshError) {
        console.log('🚨 Token refresh failed, logging out');
        
        processQueue(refreshError);
        
        if (!isLoggingOut && !isLoggedOut) {
          isLoggingOut = true;
          isLoggedOut = true; // Set logged out immediately
          
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
  console.log('🔄 Resetting API client state...');
  isLoggingOut = false;
  isRefreshing = false;
  isLoggedOut = false; // Reset logged out state
  failedQueue = [];
  
  console.log('✅ API client reset completed');
};

// New function to mark user as logged out
export const setUserLoggedOut = () => {
  console.log('🚫 Marking user as logged out - blocking all requests');
  isLoggedOut = true;
  isLoggingOut = false;
  isRefreshing = false;
  failedQueue = [];
};

// New function to mark user as logged in
export const setUserLoggedIn = () => {
  console.log('✅ Marking user as logged in - allowing requests');
  isLoggedOut = false;
  isLoggingOut = false;
  isRefreshing = false;
  failedQueue = [];
};

// Legacy alias
export const resetLogoutFlag = resetApiClient;

// Health check function
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