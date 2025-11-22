const logger = require('../services/logger');

// Centralized error handling middleware
class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error codes mapping with detailed descriptions
const ERROR_CODES = {
  // Authentication errors (AUTH_001-AUTH_099)
  AUTH_001: 'Invalid credentials',
  AUTH_002: 'Token expired',
  AUTH_003: 'Invalid token',
  AUTH_004: 'Access denied',
  AUTH_005: 'API key required',
  AUTH_006: 'Invalid API key',
  AUTH_007: 'Insufficient permissions',
  AUTH_008: 'Session expired',
  AUTH_009: 'User not found',
  AUTH_010: 'Account locked',
  
  // Validation errors (VALID_001-VALID_099)
  VALID_001: 'Validation failed',
  VALID_002: 'Invalid input format',
  VALID_003: 'Invalid input detected',
  VALID_004: 'Required field missing',
  VALID_005: 'Invalid email format',
  VALID_006: 'Invalid phone number format',
  VALID_007: 'Password too weak',
  VALID_008: 'Invalid file type',
  VALID_009: 'File too large',
  
  // Database errors (DB_001-DB_099)
  DB_001: 'Database connection failed',
  DB_002: 'Resource not found',
  DB_003: 'Duplicate entry',
  DB_004: 'Database operation failed',
  DB_005: 'Transaction failed',
  
  // File upload errors (FILE_001-FILE_099)
  FILE_001: 'Invalid file type',
  FILE_002: 'File too large',
  FILE_003: 'Upload failed',
  FILE_004: 'File processing failed',
  FILE_005: 'Unsupported file format',
  
  // AI service errors (AI_001-AI_099)
  AI_001: 'AI service unavailable',
  AI_002: 'AI processing failed',
  AI_003: 'AI rate limit exceeded',
  AI_004: 'AI token limit exceeded',
  AI_005: 'AI service timeout',
  
  // Interview errors (INT_001-INT_099)
  INT_001: 'Interview session not found',
  INT_002: 'Interview already completed',
  INT_003: 'Invalid question index',
  INT_004: 'Interview session expired',
  INT_005: 'Concurrent session detected',
  
  // General errors (GEN_001-GEN_099)
  GEN_001: 'Internal server error',
  GEN_002: 'Bad request',
  GEN_003: 'Resource not found',
  GEN_004: 'Service unavailable',
  GEN_005: 'Too many requests',
  GEN_006: 'Feature not implemented'
};

// Structured logging function
const logError = (err, req) => {
  const errorLog = {
    message: err.message,
    code: err.errorCode || 'GEN_001',
    stack: err.stack,
    url: req ? req.url : 'N/A',
    method: req ? req.method : 'N/A',
    userAgent: req ? req.get('User-Agent') : 'N/A',
    ip: req ? req.ip : 'N/A'
  };
  
  // Log the error with Winston
  logger.error(errorLog);
};

// Error response formatter
const formatErrorResponse = (err, req) => {
  // Default error values
  let { statusCode = 500, message = 'Internal server error', errorCode = 'GEN_001' } = err;
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALID_001';
    message = 'Validation failed';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'VALID_002';
    message = 'Invalid input format';
  } else if (err.code === 11000) {
    statusCode = 409;
    errorCode = 'DB_003';
    message = 'Duplicate entry';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'AUTH_003';
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'AUTH_002';
    message = 'Token expired';
  } else if (err.type === 'entity.too.large') {
    statusCode = 413;
    errorCode = 'FILE_002';
    message = 'File too large';
  }
  
  // Log the error
  logError(err, req);
  
  // Return formatted error response
  return {
    success: false,
    error: {
      code: errorCode,
      message: message,
      statusCode: statusCode,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  };
};

// Success response formatter
const formatSuccessResponse = (data, message = 'Success', statusCode = 200) => {
  return {
    success: true,
    message: message,
    data: data,
    statusCode: statusCode,
    timestamp: new Date().toISOString()
  };
};

// Centralized error handler
const handleAppError = (err, req, res, next) => {
  // Format error response
  const errorResponse = formatErrorResponse(err, req);
  
  // Send error response
  res.status(err.statusCode || 500).json(errorResponse);
};

// 404 handler
const handleNotFound = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'GEN_003');
  next(error);
};

// Global error handler for unhandled errors
const handleGlobalError = (err, req, res, next) => {
  // Log the unhandled error
  logger.error('Unhandled error:', err);
  
  // For operational errors, use our standard error handler
  if (err.isOperational) {
    return handleAppError(err, req, res, next);
  }
  
  // For programming errors, send a generic error response
  const error = new AppError('Internal server error', 500, 'GEN_001');
  handleAppError(error, req, res, next);
};

module.exports = {
  AppError,
  ERROR_CODES,
  handleAppError,
  handleNotFound,
  handleGlobalError,
  formatErrorResponse,
  formatSuccessResponse,
  logError
};