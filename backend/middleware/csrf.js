const Tokens = require('csrf');
const { AppError } = require('./errorHandler');
const logger = require('../services/logger');

const tokens = new Tokens();

// Configure CSRF with enhanced security options
const csrfOptions = {
  saltLength: 16,
  secretLength: 32
};

// Generate CSRF token
const generateCsrfToken = (req, res, next) => {
  try {
    // Generate a new secret for the user session if one doesn't exist
    if (!req.session) {
      return next(new AppError('Session not initialized', 500, 'CSRF_001'));
    }
    
    // Generate a new secret for each request for enhanced security
    req.session.csrfSecret = tokens.secretSync();
    
    // Generate token from secret
    const csrfToken = tokens.create(req.session.csrfSecret);
    req.csrfToken = csrfToken;
    res.locals.csrfToken = csrfToken;
    
    // Set CSRF token in response header for frontend access
    res.setHeader('X-CSRF-Token', csrfToken);
    
    next();
  } catch (error) {
    logger.error('CSRF token generation error:', error);
    return next(new AppError('Failed to generate CSRF token', 500, 'CSRF_002'));
  }
};

// Validate CSRF token
const validateCsrfToken = (req, res, next) => {
  try {
    // Check if we're dealing with a safe HTTP method (no CSRF protection needed)
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(req.method)) {
      return next();
    }
    
    if (!req.session || !req.session.csrfSecret) {
      logger.warn('CSRF validation failed: No secret found', {
        method: req.method,
        url: req.url,
        ip: req.ip
      });
      return next(new AppError('CSRF token validation failed: No secret found', 403, 'CSRF_003'));
    }
    
    // Extract token from multiple possible sources
    const token = req.body._csrf || 
                  req.query._csrf || 
                  req.headers['x-csrf-token'] || 
                  req.headers['x-csrf'] ||
                  req.body.csrfToken;
    
    if (!token) {
      logger.warn('CSRF token is required', {
        method: req.method,
        url: req.url,
        ip: req.ip
      });
      return next(new AppError('CSRF token is required', 403, 'CSRF_004'));
    }
    
    // Verify token
    const isValid = tokens.verify(req.session.csrfSecret, token);
    
    if (!isValid) {
      logger.warn('CSRF token validation failed: Invalid token', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        token: token ? `${token.substring(0, 5)}...` : 'null'
      });
      
      // Invalidate the session to prevent further attacks
      req.session.csrfSecret = null;
      
      return next(new AppError('CSRF token validation failed: Invalid token', 403, 'CSRF_005'));
    }
    
    // Generate a new secret after successful validation to implement
    // the "one-time token" pattern for enhanced security
    req.session.csrfSecret = tokens.secretSync();
    
    next();
  } catch (error) {
    logger.error('CSRF token validation error:', error);
    return next(new AppError('Failed to validate CSRF token', 500, 'CSRF_006'));
  }
};

// Double submit cookie pattern implementation
const doubleSubmitCookie = (req, res, next) => {
  try {
    // Only apply to state-changing requests
    const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!stateChangingMethods.includes(req.method)) {
      return next();
    }
    
    // Get token from header
    const headerToken = req.headers['x-csrf-token'];
    
    // Get token from cookie
    const cookieToken = req.cookies['_csrf'];
    
    // Both tokens must be present
    if (!headerToken || !cookieToken) {
      return next(new AppError('CSRF double submit validation failed: Missing tokens', 403, 'CSRF_007'));
    }
    
    // Tokens must match
    if (headerToken !== cookieToken) {
      logger.warn('CSRF double submit validation failed: Token mismatch', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        headerToken: headerToken ? `${headerToken.substring(0, 5)}...` : 'null',
        cookieToken: cookieToken ? `${cookieToken.substring(0, 5)}...` : 'null'
      });
      
      return next(new AppError('CSRF double submit validation failed: Token mismatch', 403, 'CSRF_008'));
    }
    
    next();
  } catch (error) {
    logger.error('CSRF double submit validation error:', error);
    return next(new AppError('Failed to validate double submit CSRF tokens', 500, 'CSRF_009'));
  }
};

// Set CSRF cookie middleware
const setCsrfCookie = (req, res, next) => {
  try {
    if (req.csrfToken) {
      // Set CSRF token as HTTP-only cookie with short expiration
      res.cookie('_csrf', req.csrfToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 60 * 1000 // 30 minutes
      });
    }
    next();
  } catch (error) {
    logger.error('CSRF cookie setting error:', error);
    return next(new AppError('Failed to set CSRF cookie', 500, 'CSRF_010'));
  }
};

module.exports = {
  generateCsrfToken,
  validateCsrfToken,
  doubleSubmitCookie,
  setCsrfCookie
};