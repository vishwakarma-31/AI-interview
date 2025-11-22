// Utility functions for implementing retry mechanisms with exponential backoff

/**
 * Wait for a specified number of milliseconds
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after ms milliseconds
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic and exponential backoff
 * @param {Function} fn - Function to execute
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} options.baseDelay - Base delay in milliseconds (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in milliseconds (default: 30000)
 * @param {Function} options.shouldRetry - Function to determine if an error should trigger a retry
 * @returns {Promise} Promise that resolves with the result of fn or rejects after max retries
 */
export async function withRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    shouldRetry = () => true
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error;
      
      // If this is the last attempt or shouldRetry returns false, don't retry
      if (attempt === maxRetries || !shouldRetry(error, attempt)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelay
      );
      
      console.warn(`Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`, error);
      
      // Wait before retrying
      await sleep(delay);
    }
  }
  
  // If we get here, all retries failed
  throw lastError;
}

/**
 * Default retry condition function
 * Determines if an error should trigger a retry based on common retryable conditions
 * @param {Error} error - The error to evaluate
 * @param {number} attempt - Current attempt number
 * @returns {boolean} True if the error should trigger a retry
 */
export function defaultShouldRetry(error, attempt) {
  // Don't retry on client-side validation errors
  if (error.message && (
    error.message.includes('Validation') || 
    error.message.includes('Invalid') ||
    error.message.includes('Bad Request')
  )) {
    return false;
  }
  
  // Retry on network errors, timeouts, and server errors
  if (error.message && (
    error.message.includes('Network Error') ||
    error.message.includes('timeout') ||
    error.message.includes('Timeout') ||
    error.message.includes('502') ||
    error.message.includes('503') ||
    error.message.includes('504') ||
    error.message.includes('unavailable') ||
    error.message.includes('Service Unavailable')
  )) {
    return true;
  }
  
  // Retry on common retryable HTTP status codes
  if (error.response && [408, 429, 500, 502, 503, 504].includes(error.response.status)) {
    return true;
  }
  
  // For other errors, only retry on first attempt
  return attempt === 0;
}