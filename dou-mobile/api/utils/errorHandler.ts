// api/utils/errorHandler.ts
import { AxiosError } from 'axios';

export interface EnhancedError extends Error {
  statusCode?: number;
  originalError?: AxiosError;
  response?: any;
}

export const handleApiError = (error: AxiosError): EnhancedError => {
  // Add detailed logging in development
  if (__DEV__) {
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Request setup error:', error.message);
    }
  }

  // Format the error message
  let errorMessage = 'An unexpected error occurred';
  let statusCode = 500;

  if (error.response) {
    statusCode = error.response.status;
    
    // Extract error message from response
    const responseData = error.response.data as any;
    
    if (responseData?.detail) {
      errorMessage = responseData.detail;
    } else if (responseData?.message) {
      errorMessage = responseData.message;
    } else if (typeof responseData === 'string') {
      errorMessage = responseData;
    }

    // Handle specific HTTP status codes
    switch (statusCode) {
      case 401:
        errorMessage = 'Authentication required. Please log in again.';
        break;
      case 403:
        errorMessage = 'You don\'t have permission to perform this action.';
        break;
      case 404:
        errorMessage = 'The requested resource was not found.';
        break;
      case 422:
        errorMessage = 'Validation error. Please check your input.';
        break;
      default:
        if (statusCode >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
    }
  } else if (error.request) {
    errorMessage = 'No response from server. Please check your connection.';
  }

  // Create an enhanced error object
  const enhancedError: EnhancedError = new Error(errorMessage);
  enhancedError.statusCode = statusCode;
  enhancedError.originalError = error;
  enhancedError.response = error.response;
  
  return enhancedError;
};