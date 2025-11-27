const xss = require('xss');
const validator = require('validator');
const { AppError } = require('./errorHandler');
const logger = require('../services/logger');

// Custom XSS white list configuration
// Extends the default XSS white list with our specific requirements
// Currently we're using the default list but keeping this structure for future customization
const xssWhiteList = {
  ...xss.whiteList,
  // Allow additional tags for rich text content if needed
  // 'p': ['class', 'style'],
  // 'strong': [],
  // 'em': [],
};

// Custom XSS options for enhanced security
// These options configure how the XSS filter processes input
const xssOptions = {
  whiteList: xssWhiteList, // Use our custom white list
  stripIgnoreTag: true, // Strip all HTML tags not in the whitelist (security enhancement)
  stripIgnoreTagBody: ['script'], // Strip content inside script tags to prevent script injection
  css: false // Disable CSS filter as we don't need to process CSS in our application
};

// Create a custom XSS filter instance with our security configuration
// Create a custom XSS filter instance with our security configuration
const customXss = new xss.FilterXSS(xssOptions);

// Helper function to recursively sanitize objects
// This function handles nested objects and arrays by recursively sanitizing all string values
// It also sanitizes object keys to prevent key-based injection attacks
const sanitizeObject = (obj) => {
  // Handle primitive values and null
  if (typeof obj !== 'object' || obj === null) {
    // Sanitize string values to remove potentially dangerous HTML/JavaScript
    if (typeof obj === 'string') {
      return customXss.process(obj);
    }
    return obj;
  }
  
  // Initialize sanitized object with correct type (array or object)
  const sanitized = Array.isArray(obj) ? [] : {};
  
  // Iterate through all properties of the object
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    // Sanitize the key itself to prevent key-based injection
    const sanitizedKey = customXss.process(key);
    
    // Recursively sanitize based on the type of the value
    if (typeof obj[key] === 'string') {
      // Directly sanitize string values
      sanitized[sanitizedKey] = customXss.process(obj[key]);
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      // Recursively sanitize nested objects/arrays
      sanitized[sanitizedKey] = sanitizeObject(obj[key]);
    } else {
      // Leave non-string, non-object values unchanged
      sanitized[sanitizedKey] = obj[key];
    }
  }
  
  return sanitized;
};

// Comprehensive input sanitization middleware
// This middleware sanitizes all user input to prevent XSS attacks
// It processes request body, query parameters, route parameters, and sensitive headers
const sanitizeInput = (req, res, next) => {
  try {
    // Sanitize request body to remove potentially dangerous HTML/JavaScript
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    
    // Sanitize query parameters to prevent XSS in URLs
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }
    
    // Sanitize route parameters to prevent XSS in dynamic URL segments
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }
    
    // Sanitize headers that might contain user input to prevent header-based XSS
    if (req.headers && typeof req.headers === 'object') {
      // Focus on headers that are most likely to contain user-generated content
      const sensitiveHeaders = ['user-agent', 'referer', 'x-forwarded-for'];
      for (let i = 0; i < sensitiveHeaders.length; i++) {
        const header = sensitiveHeaders[i];
        if (req.headers[header] && typeof req.headers[header] === 'string') {
          req.headers[header] = customXss.process(req.headers[header]);
        }
      }
    }
    
    next();
  } catch (error) {
    logger.error('Input sanitization error:', error);
    return next(new AppError('Failed to sanitize input', 500, 'SAN_001'));
  }
};

// Enhanced validation middleware
// This middleware performs semantic validation on user input
// It checks email formats, URLs, and phone numbers using the validator library
const validateInput = (req, res, next) => {
  try {
    // Validate email addresses, URLs, and phone numbers in the request body
    if (req.body && typeof req.body === 'object') {
      const keys = Object.keys(req.body);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        // Check if the field name suggests it should contain an email
        if (key.includes('email') && typeof req.body[key] === 'string') {
          if (!validator.isEmail(req.body[key])) {
            return next(new AppError(`Invalid email format for field: ${key}`, 400, 'VALID_002'));
          }
        }
        
        // Validate URLs to ensure they follow proper URL format
        if (key.includes('url') && typeof req.body[key] === 'string') {
          if (req.body[key] && !validator.isURL(req.body[key])) {
            return next(new AppError(`Invalid URL format for field: ${key}`, 400, 'VALID_003'));
          }
        }
        
        // Validate phone numbers using libphonenumber for international format support
        if (key.includes('phone') && typeof req.body[key] === 'string') {
          if (req.body[key] && !validator.isMobilePhone(req.body[key], 'any', { strictMode: false })) {
            return next(new AppError(`Invalid phone number format for field: ${key}`, 400, 'VALID_004'));
          }
        }
      }
    }
    
    next();
  } catch (error) {
    logger.error('Input validation error:', error);
    return next(new AppError('Failed to validate input', 500, 'SAN_002'));
  }
};

// SQL injection prevention middleware
// This middleware detects common SQL injection patterns in user input
// It checks for SQL keywords, comment sequences, and dangerous patterns
const preventSqlInjection = (req, res, next) => {
  try {
    // Patterns that might indicate SQL injection attempts
    // These regex patterns detect common SQL injection techniques
    const sqlInjectionPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|OR|AND)\b)/i, // SQL keywords
      /(;|--|\/\*|\*\/|xp_|sp_)/i, // SQL comment sequences and system procedures
      /('|")\s*(=|OR|AND)\s*('|")/i // String comparison patterns often used in injections
    ];
    
    // Check all input sources for potential SQL injection attempts
    const inputSources = [
      req.body,    // Request body data
      req.query,   // Query parameters
      req.params   // Route parameters
      // req.headers  // HTTP headers (commented out to avoid false positives)
    ];
    
    // Iterate through each input source
    for (let i = 0; i < inputSources.length; i++) {
      const source = inputSources[i];
      if (source && typeof source === 'object') {
        const keys = Object.keys(source);
        for (let j = 0; j < keys.length; j++) {
          const key = keys[j];
          const value = source[key];
          // Only check string values for SQL injection patterns
          if (typeof value === 'string') {
            // Check each pattern against the input value
            for (let k = 0; k < sqlInjectionPatterns.length; k++) {
              const pattern = sqlInjectionPatterns[k];
              if (pattern.test(value)) {
                // Log potential SQL injection attempt for security monitoring
                logger.warn('Potential SQL injection attempt detected', {
                  pattern: pattern.toString(),
                  value: value.substring(0, 50) + '...',
                  key: key,
                  ip: req.ip,
                  url: req.url
                });
                
                // Return error to prevent potential SQL injection
                return next(new AppError('Invalid input detected', 400, 'SAN_003'));
              }
            }
          }
        }
      }
    }
    
    next();
  } catch (error) {
    logger.error('SQL injection prevention error:', error);
    return next(new AppError('Failed to prevent SQL injection', 500, 'SAN_004'));
  }
};

// Input length validation middleware
// This middleware prevents excessively long inputs that could lead to denial of service
// It enforces reasonable limits on different types of user input fields
const validateInputLength = (req, res, next) => {
  try {
    // Maximum lengths for different types of input to prevent abuse
    // These limits balance usability with security concerns
    const maxLengths = {
      username: 30,      // Reasonable limit for usernames
      email: 254,        // RFC 5321 limit for email addresses
      password: 128,     // Secure limit for passwords
      name: 100,         // Reasonable limit for person names
      title: 200,        // Limit for titles/subjects
      description: 5000, // Generous limit for longer text descriptions
      comment: 2000,     // Limit for comments
      default: 1000      // Default limit for unspecified fields
    };
    
    // Check all input sources for length violations
    const inputSources = [req.body, req.query, req.params];
    
    // Iterate through each input source
    for (let i = 0; i < inputSources.length; i++) {
      const source = inputSources[i];
      if (source && typeof source === 'object') {
        const keys = Object.keys(source);
        for (let j = 0; j < keys.length; j++) {
          const key = keys[j];
          const value = source[key];
          // Only validate string values for length
          if (typeof value === 'string') {
            // Get the appropriate max length for this field or use default
            const maxLength = maxLengths[key] || maxLengths.default;
            // Check if the input exceeds the maximum allowed length
            if (value.length > maxLength) {
              return next(new AppError(`Input for ${key} exceeds maximum length of ${maxLength} characters`, 400, 'SAN_005'));
            }
          }
        }
      }
    }
    
    next();
  } catch (error) {
    logger.error('Input length validation error:', error);
    return next(new AppError('Failed to validate input length', 500, 'SAN_006'));
  }
};

// Export all security middleware functions for use in the application
module.exports = { 
  sanitizeInput,       // XSS protection middleware
  validateInput,        // Semantic input validation
  preventSqlInjection,  // SQL injection prevention
  validateInputLength   // Input length validation
};