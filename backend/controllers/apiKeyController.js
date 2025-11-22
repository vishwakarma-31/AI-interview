const ApiKey = require('../models/ApiKey');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../services/logger');

/**
 * Create a new API key
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function createApiKey(req, res, next) {
  try {
    const { name, permissions, expiresAt } = req.body;
    
    // Validate required fields
    if (!name) {
      throw new AppError('API key name is required', 400, 'VALID_001');
    }
    
    // Generate a new API key
    const key = ApiKey.generateKey();
    const hashedKey = ApiKey.hashKey(key);
    
    // Create API key document
    const apiKey = new ApiKey({
      name,
      key, // Store the plain key temporarily to return to user (it will be removed after)
      hashedKey,
      permissions: permissions || [],
      expiresAt: expiresAt || null,
      createdBy: req.user.id
    });
    
    await apiKey.save();
    
    // Remove the plain key before sending response (we only send it once)
    const responseKey = apiKey.key;
    apiKey.key = undefined;
    
    res.status(201).json({
      success: true,
      data: {
        message: 'API key created successfully',
        apiKey: {
          id: apiKey._id,
          name: apiKey.name,
          key: responseKey, // Send the plain key only once
          permissions: apiKey.permissions,
          isActive: apiKey.isActive,
          expiresAt: apiKey.expiresAt,
          createdAt: apiKey.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all API keys for the user with pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getApiKeys(req, res, next) {
  try {
    // Get pagination parameters from query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Validate pagination parameters
    if (page < 1) {
      throw new AppError('Page must be greater than 0', 400, 'VALID_001');
    }
    
    if (limit < 1 || limit > 100) {
      throw new AppError('Limit must be between 1 and 100', 400, 'VALID_001');
    }
    
    // Use MongoDB with pagination
    const totalApiKeys = await ApiKey.countDocuments({ createdBy: req.user.id });
    const apiKeys = await ApiKey.find({ createdBy: req.user.id })
      .select('-key -hashedKey') // Don't return the key values
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalApiKeys / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    res.json({
      success: true,
      data: { 
        apiKeys,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalApiKeys: totalApiKeys,
          hasNextPage: hasNextPage,
          hasPrevPage: hasPrevPage,
          limit: limit
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a specific API key by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getApiKeyById(req, res, next) {
  try {
    const { id } = req.params;
    
    const apiKey = await ApiKey.findOne({ 
      _id: id, 
      createdBy: req.user.id 
    }).select('-key -hashedKey');
    
    if (!apiKey) {
      throw new AppError('API key not found', 404, 'DB_002');
    }
    
    res.json({
      success: true,
      data: { apiKey }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an API key
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function updateApiKey(req, res, next) {
  try {
    const { id } = req.params;
    const { name, permissions, isActive, expiresAt } = req.body;
    
    const apiKey = await ApiKey.findOne({ 
      _id: id, 
      createdBy: req.user.id 
    });
    
    if (!apiKey) {
      throw new AppError('API key not found', 404, 'DB_002');
    }
    
    // Update fields if provided
    if (name !== undefined) apiKey.name = name;
    if (permissions !== undefined) apiKey.permissions = permissions;
    if (isActive !== undefined) apiKey.isActive = isActive;
    if (expiresAt !== undefined) apiKey.expiresAt = expiresAt;
    
    await apiKey.save();
    
    // Remove sensitive fields from response
    apiKey.key = undefined;
    apiKey.hashedKey = undefined;
    
    res.json({
      success: true,
      data: {
        message: 'API key updated successfully',
        apiKey
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete an API key
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function deleteApiKey(req, res, next) {
  try {
    const { id } = req.params;
    
    const apiKey = await ApiKey.findOneAndDelete({ 
      _id: id, 
      createdBy: req.user.id 
    });
    
    if (!apiKey) {
      throw new AppError('API key not found', 404, 'DB_002');
    }
    
    res.json({
      success: true,
      data: {
        message: 'API key deleted successfully'
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createApiKey,
  getApiKeys,
  getApiKeyById,
  updateApiKey,
  deleteApiKey
};