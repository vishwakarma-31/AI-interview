const { AppError } = require('./errorHandler');
const logger = require('../services/logger');
const crypto = require('crypto');

// In-memory store for session blacklisting (in production, use Redis)
const blacklistedSessions = new Set();

// Session validation middleware
const validateSession = (req, res, next) => {
  try {
    // Check if session exists
    if (!req.session) {
      return next(new AppError('No active session', 401, 'AUTH_020'));
    }
    
    // Check if session is valid (not destroyed)
    if (req.session.isDestroyed) {
      return next(new AppError('Session has been destroyed', 401, 'AUTH_021'));
    }
    
    // Check if session is blacklisted
    if (blacklistedSessions.has(req.session.id)) {
      return next(new AppError('Session has been invalidated', 401, 'AUTH_022'));
    }
    
    // Check session expiration
    if (req.session.cookie && req.session.cookie.expires) {
      const now = new Date();
      if (req.session.cookie.expires < now) {
        return next(new AppError('Session has expired', 401, 'AUTH_023'));
      }
    }
    
    // Check for session fixation attacks by validating IP address
    if (req.session.ipAddress) {
      const currentIp = req.ip || req.connection.remoteAddress;
      if (req.session.ipAddress !== currentIp) {
        // Invalidate the session
        req.session.destroy();
        blacklistedSessions.add(req.session.id);
        logger.warn('Session IP mismatch detected - possible session fixation attack', {
          sessionId: req.session.id,
          originalIp: req.session.ipAddress,
          currentIp: currentIp,
          userId: req.session.userId
        });
        return next(new AppError('Session IP mismatch detected', 401, 'AUTH_024'));
      }
    }
    
    // Check for user agent consistency
    if (req.session.userAgent) {
      const currentUserAgent = req.get('User-Agent');
      if (req.session.userAgent !== currentUserAgent) {
        // Invalidate the session
        req.session.destroy();
        blacklistedSessions.add(req.session.id);
        logger.warn('Session user agent mismatch detected', {
          sessionId: req.session.id,
          originalUserAgent: req.session.userAgent,
          currentUserAgent: currentUserAgent,
          userId: req.session.userId
        });
        return next(new AppError('Session user agent mismatch detected', 401, 'AUTH_025'));
      }
    }
    
    // Add session info to request object
    req.sessionInfo = {
      id: req.session.id,
      createdAt: req.session.createdAt,
      lastAccess: new Date()
    };
    
    next();
  } catch (error) {
    logger.error('Session validation error:', error);
    return next(new AppError('Internal server error during session validation', 500, 'AUTH_026'));
  }
};

// Session refresh middleware
const refreshSession = (req, res, next) => {
  try {
    // Refresh session expiration
    if (req.session) {
      req.session.touch();
      
      // Update last access time
      req.session.lastAccess = new Date();
    }
    next();
  } catch (error) {
    logger.error('Session refresh error:', error);
    return next(new AppError('Internal server error during session refresh', 500, 'AUTH_027'));
  }
};

// Invalidate session middleware
const invalidateSession = (req, res, next) => {
  try {
    if (req.session) {
      // Add session to blacklist
      blacklistedSessions.add(req.session.id);
      
      // Destroy session
      req.session.destroy((err) => {
        if (err) {
          logger.error('Session destruction error:', err);
        }
      });
    }
    next();
  } catch (error) {
    logger.error('Session invalidation error:', error);
    return next(new AppError('Internal server error during session invalidation', 500, 'AUTH_028'));
  }
};

// Initialize session security middleware
const initializeSessionSecurity = (req, res, next) => {
  try {
    if (req.session) {
      // Store IP address for session fixation protection
      if (!req.session.ipAddress) {
        req.session.ipAddress = req.ip || req.connection.remoteAddress;
      }
      
      // Store user agent for consistency checking
      if (!req.session.userAgent) {
        req.session.userAgent = req.get('User-Agent');
      }
      
      // Store user ID if available
      if (req.user && !req.session.userId) {
        req.session.userId = req.user.id;
      }
      
      // Set session creation time
      if (!req.session.createdAt) {
        req.session.createdAt = new Date();
      }
      
      // Set last access time
      req.session.lastAccess = new Date();
    }
    next();
  } catch (error) {
    logger.error('Session security initialization error:', error);
    return next(new AppError('Internal server error during session security initialization', 500, 'AUTH_029'));
  }
};

module.exports = {
  validateSession,
  refreshSession,
  invalidateSession,
  initializeSessionSecurity
};