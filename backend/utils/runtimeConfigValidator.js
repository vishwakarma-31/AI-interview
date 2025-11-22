const logger = require('../services/logger');
const { decryptEnvVar } = require('./encryption');

/**
 * Validates runtime configuration values
 * @param {Object} config - The configuration object to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
function validateRuntimeConfig(config) {
  const errors = [];

  // Decrypt sensitive values for validation
  const decryptedMongoUri = decryptEnvVar(config.MONGO_URI);
  const decryptedOpenaiKey = decryptEnvVar(config.OPENAI_API_KEY);
  const decryptedJwtSecret = decryptEnvVar(config.JWT_SECRET);
  const decryptedSessionSecret = decryptEnvVar(config.SESSION_SECRET);
  const decryptedEncryptionKey = decryptEnvVar(config.ENCRYPTION_KEY);
  const decryptedFrontendUrl = decryptEnvVar(config.FRONTEND_URL);
  const decryptedAllowedOrigins = decryptEnvVar(config.ALLOWED_ORIGINS);

  // Validate PORT
  if (config.PORT) {
    const port = parseInt(config.PORT, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      errors.push('PORT must be a valid number between 1 and 65535');
    }
  }

  // Validate FRONTEND_URL
  if (decryptedFrontendUrl) {
    try {
      new URL(decryptedFrontendUrl);
    } catch (e) {
      errors.push('FRONTEND_URL must be a valid URL');
    }
  }

  // Validate ALLOWED_ORIGINS if present
  if (decryptedAllowedOrigins) {
    const origins = decryptedAllowedOrigins.split(',');
    for (const origin of origins) {
      try {
        new URL(origin.trim());
      } catch (e) {
        errors.push(`ALLOWED_ORIGINS contains invalid URL: ${origin}`);
      }
    }
  }

  // Validate SESSION_SECRET length
  if (decryptedSessionSecret && decryptedSessionSecret.length < 32) {
    errors.push('SESSION_SECRET should be at least 32 characters long for security');
  }

  // Validate ENCRYPTION_KEY length
  if (decryptedEncryptionKey && decryptedEncryptionKey.length < 32) {
    errors.push('ENCRYPTION_KEY should be at least 32 characters long for security');
  }

  // Validate JWT_SECRET length
  if (decryptedJwtSecret && decryptedJwtSecret.length < 32) {
    errors.push('JWT_SECRET should be at least 32 characters long for security');
  }

  // Validate MONGO_URI format
  if (decryptedMongoUri) {
    if (!decryptedMongoUri.startsWith('mongodb://') && !decryptedMongoUri.startsWith('mongodb+srv://')) {
      errors.push('MONGO_URI must start with mongodb:// or mongodb+srv://');
    }
  }

  // Validate OPENAI_API_KEY format (should start with sk-)
  if (decryptedOpenaiKey && !decryptedOpenaiKey.startsWith('sk-')) {
    errors.push('OPENAI_API_KEY should start with "sk-"');
  }

  // Validate OPENAI_MODEL is not empty
  if (config.OPENAI_MODEL && config.OPENAI_MODEL.trim() === '') {
    errors.push('OPENAI_MODEL cannot be empty');
  }

  // Validate NODE_ENV values
  if (config.NODE_ENV && !['development', 'production', 'test'].includes(config.NODE_ENV)) {
    errors.push('NODE_ENV must be one of: development, production, test');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Gets current runtime configuration
 * @returns {Object} Current configuration object
 */
function getCurrentConfig() {
  return {
    PORT: process.env.PORT,
    FRONTEND_URL: process.env.FRONTEND_URL,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    SESSION_SECRET: process.env.SESSION_SECRET,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    MONGO_URI: process.env.MONGO_URI,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    JWT_SECRET: process.env.JWT_SECRET,
    NODE_ENV: process.env.NODE_ENV
  };
}

module.exports = {
  validateRuntimeConfig,
  getCurrentConfig
};