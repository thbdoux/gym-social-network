// src/api.js
import axios from 'axios';

// Simple event for authentication errors
export const AUTH_ERROR_EVENT = 'api_auth_error';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Try both formats to see which works
      config.headers.Authorization = `Bearer ${token}`;
      
      // Debug info
      console.log(`Request to ${config.url} with Authorization header`);
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Debug error details
    console.error('API Error:', 
      error.config?.url, 
      error.response?.status, 
      error.response?.data
    );
    
    // Handle auth errors (except during login)
    if (error.response?.status === 401 && !error.config.url.includes('/users/token/')) {
      localStorage.removeItem('token');
      window.dispatchEvent(new CustomEvent(AUTH_ERROR_EVENT));
    }
    
    return Promise.reject(error);
  }
);

export default api;