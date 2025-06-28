// api/config.js
// Centralized API configuration

// This is the base API URL without the /api endpoint
export const API_BASE_URL = 'https://dou-social.fr';
// export const API_BASE_URL = 'http://192.168.1.154:8000';

// export const API_BASE_URL = 'http://192.168.0.14:8000';

// This is the full API URL used for API requests 
export const API_URL = `${API_BASE_URL}/api`;

// Function to convert relative paths to absolute URLs
export const getFullUrl = (path) => {
  if (!path) return null;
  
  // If already a full URL, return as is
  if (path.startsWith('http')) {
    return path;
  }
  
  // If path starts with /media or similar, it needs the base URL without /api
  if (path.startsWith('/media')) {
    return `${API_BASE_URL}${path}`;
  }
  
  // For API endpoints, use the full API URL
  if (path.startsWith('/')) {
    return `${API_URL}${path}`;
  }
  
  // Default case, just append to API URL
  return `${API_URL}/${path}`;
};