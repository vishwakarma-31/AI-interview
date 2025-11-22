// Environment variable validation utility
const requiredEnvVars = [
  'VITE_API_BASE_URL'
];

export function validateEnvironment() {
  const missingVars = [];
  
  // Check for required environment variables
  requiredEnvVars.forEach(varName => {
    if (!import.meta.env[varName]) {
      missingVars.push(varName);
    }
  });
  
  // Throw error if any required variables are missing
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}. ` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }
  
  // Validate API base URL format
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  try {
    new URL(apiBaseUrl);
  } catch (e) {
    throw new Error(
      `Invalid VITE_API_BASE_URL format: ${apiBaseUrl}. ` +
      'Please ensure it is a valid URL (e.g., http://localhost:5000/api)'
    );
  }
  
  console.log('Environment validation passed');
}

export function getEnvVar(varName, defaultValue = null) {
  const value = import.meta.env[varName];
  if (value === undefined || value === '') {
    if (defaultValue !== null) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${varName} is required but not set`);
  }
  return value;
}

// Runtime configuration validation
export function validateRuntimeConfig() {
  // Validate that the API is accessible
  const apiBaseUrl = getEnvVar('VITE_API_BASE_URL');
  
  // Additional runtime validations can be added here
  // For example, checking feature flags, validating service URLs, etc.
  
  return {
    apiBaseUrl,
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0'
  };
}