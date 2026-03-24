// Frontend Utility: Error Handler
// Location: src/utils/errorHandler.js
// Purpose: Consistent error handling across the app

export const handleError = (error) => {
  // Network error
  if (!error.response) {
    return 'Network error. Please check your connection.';
  }

  // Server returned error
  const status = error.response.status;
  const message = error.response.data?.message;

  switch (status) {
    case 400:
      return message || 'Bad request. Please check your input.';
    case 401:
      return 'Session expired. Please login again.';
    case 403:
      return 'Access denied. You do not have permission.';
    case 404:
      return 'Resource not found.';
    case 500:
      return 'Server error. Please try again later.';
    default:
      return message || 'An unexpected error occurred.';
  }
};

// Display error in console for debugging
export const logError = (error, context = '') => {
  console.error(`[${context}]`, error);
};
