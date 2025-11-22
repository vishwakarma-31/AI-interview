const ApiKey = require('../models/ApiKey');
const { AppError } = require('./errorHandler');
const logger = require('../services/logger');

// Generate a secure API key
const generateApiKey = () => {
  return require('crypto').randomBytes(32).toString('hex');
};

// API Key authentication middleware
const authenticateApiKey = async (req, res, next) => {
  try {
    // Get API key from header
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return next(new AppError('API key required', 401, 'AUTH_012'));
    }
    
    // Hash the provided key for comparison
    const hashedKey = ApiKey.hashKey(apiKey);
    
    // Find API key in database
    const apiKeyDoc = await ApiKey.findOne({ 
      hashedKey,
      isActive: true
    });
    
    if (!apiKeyDoc) {
      return next(new AppError('Invalid API key', 403, 'AUTH_013'));
    }
    
    // Check if API key has expired
    if (apiKeyDoc.expiresAt && apiKeyDoc.expiresAt < new Date()) {
      return next(new AppError('API key has expired', 403, 'AUTH_014'));
    }
    
    // Update last used timestamp
    apiKeyDoc.lastUsedAt = new Date();
    await apiKeyDoc.save();
    
    // Add API key info to request object
    req.apiKey = {
      id: apiKeyDoc._id,
      name: apiKeyDoc.name,
      permissions: apiKeyDoc.permissions,
      createdBy: apiKeyDoc.createdBy
    };
    
    next();
  } catch (error) {
    logger.error('API key authentication error:', error);
    next(new AppError('Authentication failed', 500, 'AUTH_015'));
  }
};

module.exports = {
  authenticateApiKey,
  generateApiKey
};