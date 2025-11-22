const User = require('../models/User');
const { AppError } = require('./errorHandler');
const logger = require('../services/logger');

// Define role hierarchy
const roleHierarchy = {
  'admin': ['admin', 'interviewer', 'candidate'],
  'interviewer': ['interviewer', 'candidate'],
  'candidate': ['candidate']
};

// Role-based access control middleware
const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      // Get user from request (added by authenticateToken middleware)
      const user = req.user;
      
      if (!user) {
        return next(new AppError('User not authenticated', 401, 'AUTH_016'));
      }
      
      // If roles is a string, convert to array
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      
      // Check if user has required role
      const hasPermission = allowedRoles.some(role => {
        // If role hierarchy is defined for user's role, check if required role is in hierarchy
        if (roleHierarchy[user.role]) {
          return roleHierarchy[user.role].includes(role);
        }
        // Otherwise, do exact match
        return user.role === role;
      });
      
      if (!hasPermission) {
        logger.warn('Access denied due to insufficient permissions', {
          userId: user.id,
          userRole: user.role,
          requiredRoles: allowedRoles,
          ip: req.ip,
          url: req.url
        });
        
        return next(new AppError('Access denied. Insufficient permissions.', 403, 'AUTH_017'));
      }
      
      next();
    } catch (error) {
      logger.error('Role check error:', error);
      return next(new AppError('Internal server error during authorization', 500, 'AUTH_018'));
    }
  };
};

// Permission-based access control middleware
const requirePermission = (permissions) => {
  return async (req, res, next) => {
    try {
      // Get user from request (added by authenticateToken middleware)
      const user = req.user;
      
      if (!user) {
        return next(new AppError('User not authenticated', 401, 'AUTH_016'));
      }
      
      // Get full user object from database to check permissions
      const fullUser = await User.findById(user.id);
      
      if (!fullUser) {
        return next(new AppError('User not found', 404, 'DB_002'));
      }
      
      // If permissions is a string, convert to array
      const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
      
      // Check if user has required permissions
      const hasPermission = requiredPermissions.every(permission => 
        fullUser.permissions && fullUser.permissions.includes(permission)
      );
      
      if (!hasPermission) {
        logger.warn('Access denied due to insufficient permissions', {
          userId: user.id,
          userRole: user.role,
          userPermissions: fullUser.permissions || [],
          requiredPermissions: requiredPermissions,
          ip: req.ip,
          url: req.url
        });
        
        return next(new AppError('Access denied. Insufficient permissions.', 403, 'AUTH_017'));
      }
      
      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      return next(new AppError('Internal server error during authorization', 500, 'AUTH_018'));
    }
  };
};

// Check if user has a specific role or higher
const requireRoleOrHigher = (minimumRole) => {
  return async (req, res, next) => {
    try {
      // Get user from request (added by authenticateToken middleware)
      const user = req.user;
      
      if (!user) {
        return next(new AppError('User not authenticated', 401, 'AUTH_016'));
      }
      
      // Check if user's role is at least the minimum required role
      const userRoles = roleHierarchy[user.role] || [user.role];
      const minimumRoles = roleHierarchy[minimumRole] || [minimumRole];
      
      const hasPermission = userRoles.some(role => minimumRoles.includes(role));
      
      if (!hasPermission) {
        logger.warn('Access denied due to insufficient role hierarchy', {
          userId: user.id,
          userRole: user.role,
          minimumRole: minimumRole,
          ip: req.ip,
          url: req.url
        });
        
        return next(new AppError('Access denied. Insufficient role level.', 403, 'AUTH_019'));
      }
      
      next();
    } catch (error) {
      logger.error('Role hierarchy check error:', error);
      return next(new AppError('Internal server error during authorization', 500, 'AUTH_018'));
    }
  };
};

module.exports = { 
  requireRole,
  requirePermission,
  requireRoleOrHigher
};