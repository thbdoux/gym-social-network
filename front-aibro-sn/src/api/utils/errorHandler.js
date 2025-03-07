
 export const handleApiError = (error) => {
    // Add detailed logging in development
    if (process.env.NODE_ENV === 'development') {
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
      if (error.response.data.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error.response.data === 'string') {
        errorMessage = error.response.data;
      }
  
      // Handle specific HTTP status codes
      switch (statusCode) {
        case 401:
          errorMessage = 'Authentication required. Please log in again.';
          // Optionally trigger logout or token refresh here
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
    const enhancedError = new Error(errorMessage);
    enhancedError.statusCode = statusCode;
    enhancedError.originalError = error;
    enhancedError.response = error.response;
    
    return enhancedError;
  };