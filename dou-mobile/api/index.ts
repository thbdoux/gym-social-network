// api/index.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { handleApiError } from './utils/errorHandler';

/**
 * Configure the base API client with common settings
 */
const apiClient = axios.create({
  // baseURL: 'http://172.20.10.2:8000/api', 
  baseURL: 'http://192.168.1.26:8000/api',
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

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Clear token
        await SecureStore.deleteItemAsync('token');
        
        // We can't directly navigate here as we're outside the React component
        // Instead, we'll use an event system or AuthContext to handle logout
        // For now, we'll just reject the promise
      } catch (logoutError) {
        console.error('Error during logout:', logoutError);
      }
      
      return Promise.reject(error);
    }

    console.error('Response error:', error);
    return Promise.reject(handleApiError(error));
  }
);

export default apiClient;