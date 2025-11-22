const logger = require('../services/logger');
const { decryptEnvVar } = require('./encryption');

/**
 * Validates required environment variables
 * @returns {Array<string>} Array of missing environment variables
 */
function validateEnvVariables() {
  const requiredVars = [
    'PORT',
    'FRONTEND_URL',
    'SESSION_SECRET',
    'ENCRYPTION_KEY',
    'MONGO_URI',
    'OPENAI_API_KEY',
    'OPENAI_MODEL',
    'JWT_SECRET'
  ];

  const missingVars = [];

  requiredVars.forEach(varName => {
    // Decrypt the variable before checking if it exists
    const decryptedValue = decryptEnvVar(process.env[varName]);
    if (!decryptedValue) {
      missingVars.push(varName);
    }
  });

  return missingVars;
}

/**
 * Validates environment variable formats
 * @returns {Array<string>} Array of invalid environment variables
 */
function validateEnvFormats() {
  const invalidVars = [];

  // Decrypt variables before validation
  const decryptedMongoUri = decryptEnvVar(process.env.MONGO_URI);
  const decryptedFrontendUrl = decryptEnvVar(process.env.FRONTEND_URL);
  const decryptedOpenaiModel = decryptEnvVar(process.env.OPENAI_MODEL);

  // Validate PORT is a number
  if (process.env.PORT && isNaN(parseInt(process.env.PORT))) {
    invalidVars.push('PORT must be a valid number');
  }

  // Validate MONGO_URI format
  if (decryptedMongoUri && !decryptedMongoUri.startsWith('mongodb://') && !decryptedMongoUri.startsWith('mongodb+srv://')) {
    invalidVars.push('MONGO_URI must start with mongodb:// or mongodb+srv://');
  }

  // Validate FRONTEND_URL format
  if (decryptedFrontendUrl && !decryptedFrontendUrl.startsWith('http://') && !decryptedFrontendUrl.startsWith('https://')) {
    invalidVars.push('FRONTEND_URL must start with http:// or https://');
  }

  // Validate OPENAI_MODEL is not empty
  if (decryptedOpenaiModel && decryptedOpenaiModel.trim() === '') {
    invalidVars.push('OPENAI_MODEL cannot be empty');
  }

  return invalidVars;
}

/**
 * Performs comprehensive environment validation
 * @returns {Object} Validation result with isValid flag and errors array
 */
function validateEnvironment() {
  const missingVars = validateEnvVariables();
  const invalidVars = validateEnvFormats();

  const errors = [
    ...missingVars.map(varName => `Missing required environment variable: ${varName}`),
    ...invalidVars
  ];

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateEnvironment
};