// Utility functions for user-friendly error messages

// Map backend error codes to user-friendly messages
const ERROR_CODE_MESSAGES = {
  // Authentication errors
  AUTH_001: 'Invalid credentials. Please check your email and password.',
  AUTH_002: 'Your session has expired. Please log in again.',
  AUTH_003: 'Invalid session. Please log in again.',
  AUTH_004: 'Access denied. You do not have permission to perform this action.',
  AUTH_005: 'API key is required for this operation.',
  AUTH_006: 'Invalid API key. Please check your API key and try again.',
  AUTH_007: 'Insufficient permissions. Contact your administrator for access.',
  AUTH_008: 'Your session has expired. Please log in again.',
  AUTH_009: 'User not found. Please check your credentials.',
  AUTH_010: 'Your account has been locked. Contact support for assistance.',

  // Validation errors
  VALID_001: 'Please check the information you entered and try again.',
  VALID_002: 'Invalid input format. Please check your entry and try again.',
  VALID_003: 'Invalid input detected. Please check your entry and try again.',
  VALID_004: 'Required information is missing. Please fill in all required fields.',
  VALID_005: 'Invalid email format. Please enter a valid email address.',
  VALID_006: 'Invalid phone number format. Please enter a valid phone number.',
  VALID_007: 'Password is too weak. Please use a stronger password.',
  VALID_008: 'Invalid file type. Please upload a supported file format.',
  VALID_009: 'File is too large. Please upload a smaller file.',

  // Database errors
  DB_001: 'Database connection failed. Please try again later.',
  DB_002: 'Resource not found. The requested item could not be found.',
  DB_003: 'Duplicate entry detected. This item already exists.',
  DB_004: 'Database operation failed. Please try again later.',
  DB_005: 'Transaction failed. Please try again later.',

  // File upload errors
  FILE_001: 'Invalid file type. Please upload a PDF or DOCX file.',
  FILE_002: 'File is too large. Maximum file size is 10MB.',
  FILE_003: 'File upload failed. Please try again.',
  FILE_004: 'File processing failed. Please try again with a different file.',
  FILE_005: 'Unsupported file format. Please upload a PDF or DOCX file.',

  // AI service errors
  AI_001: 'AI service is temporarily unavailable. Please try again later.',
  AI_002: 'AI processing failed. Please try again.',
  AI_003: 'AI service is busy. Please wait a moment and try again.',
  AI_004: 'AI service limit reached. Please try again later.',
  AI_005: 'AI service timed out. Please try again.',

  // Interview errors
  INT_001: 'Interview session not found. Please start a new interview.',
  INT_002: 'Interview already completed. You cannot submit additional answers.',
  INT_003: 'Invalid question. Please refresh the page and try again.',
  INT_004: 'Interview session expired. Please start a new interview.',
  INT_005: 'Another session is already in progress. Please complete or abandon it first.',

  // General errors
  GEN_001: 'An unexpected error occurred. Please try again later.',
  GEN_002: 'Bad request. Please check your input and try again.',
  GEN_003: 'Resource not found. Please check the URL and try again.',
  GEN_004: 'Service is temporarily unavailable. Please try again later.',
  GEN_005: 'Too many requests. Please wait a moment and try again.',
  GEN_006: 'This feature is not yet implemented. Please check back later.',
};

// Get user-friendly error message based on error object
export function getFriendlyErrorMessage(error) {
  // If error is a string, return it directly
  if (typeof error === 'string') {
    return error;
  }

  // If error has a code, try to map it to a friendly message
  if (error && error.code) {
    return (
      ERROR_CODE_MESSAGES[error.code] ||
      error.message ||
      'An unexpected error occurred. Please try again later.'
    );
  }

  // If error has a message, return it
  if (error && error.message) {
    return error.message;
  }

  // Default message
  return 'An unexpected error occurred. Please try again later.';
}

// Get error message for specific operation
export function getOperationErrorMessage(error, operation) {
  const baseMessage = getFriendlyErrorMessage(error);

  // Add operation-specific context
  switch (operation) {
    case 'startInterview':
      return `Failed to start interview: ${baseMessage}`;
    case 'submitAnswer':
      return `Failed to submit answer: ${baseMessage}`;
    case 'fetchCandidates':
      return `Failed to load candidates: ${baseMessage}`;
    default:
      return baseMessage;
  }
}
