const ApiKey = require('../models/ApiKey');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { AppError, formatSuccessResponse } = require('../middleware/errorHandler');
const AuditLog = require('../models/AuditLog');

/**
 * Generate a new API key
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function generateNewApiKey(req, res, next) {
  try {
    // Generate a new API key
    const newApiKey = generateApiKey();
    
    // In a real application, you would store this in a database
    // For this implementation, we'll return it in the response
    res.status(201).json(formatSuccessResponse({
      apiKey: newApiKey
    }, 'New API key generated successfully', 201));
  } catch (error) {
    next(error);
  }
}

/**
 * Get all API keys (for demonstration purposes)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getAllApiKeys(req, res, next) {
  try {
    // In a real application, you would fetch this from a database
    // For this implementation, we'll read from environment variables
    const apiKeys = [
      process.env.API_KEY_1,
      process.env.API_KEY_2,
      process.env.API_KEY_3
    ].filter(key => key);
    
    res.json(formatSuccessResponse({
      apiKeys
    }, 'API keys retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Revoke an API key (for demonstration purposes)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function revokeApiKey(req, res, next) {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      throw new AppError('API key is required', 400, 'VALID_004');
    }
    
    // In a real application, you would remove this from a database
    // For this implementation, we'll just return a success response
    res.json(formatSuccessResponse(null, 'API key revoked successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Get audit logs with filtering and pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getAuditLogs(req, res, next) {
  try {
    // Get pagination parameters from query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Get filter parameters from query
    const action = req.query.action;
    const entityType = req.query.entityType;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    
    // Validate pagination parameters
    if (page < 1) {
      throw new AppError('Page must be greater than 0', 400, 'VALID_001');
    }
    
    if (limit < 1 || limit > 100) {
      throw new AppError('Limit must be between 1 and 100', 400, 'VALID_001');
    }
    
    // Build filter object
    const filter = {};
    if (action) {
      filter.action = action;
    }
    if (entityType) {
      filter.entityType = entityType;
    }
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate);
      }
    }
    
    // Get audit logs with pagination and sorting
    const totalLogs = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email');
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalLogs / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    // Send standardized success response with pagination info
    res.json(formatSuccessResponse({
      logs,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalLogs: totalLogs,
        hasNextPage: hasNextPage,
        hasPrevPage: hasPrevPage,
        limit: limit
      },
      filter: {
        action: action || null,
        entityType: entityType || null,
        startDate: startDate || null,
        endDate: endDate || null
      }
    }, 'Audit logs retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generateNewApiKey,
  getAllApiKeys,
  revokeApiKey,
  getAuditLogs
};