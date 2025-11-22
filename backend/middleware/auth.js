const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { AppError } = require('./errorHandler');

dotenv.config();

// Authentication middleware
const authenticateToken = (req, res, next) => {
  // Get token from header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return next(new AppError('Access token required', 401, 'AUTH_008'));
  }

  // Verify token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Token expired', 401, 'AUTH_009'));
      }
      if (err.name === 'JsonWebTokenError') {
        return next(new AppError('Invalid token', 403, 'AUTH_010'));
      }
      return next(new AppError('Authentication failed', 403, 'AUTH_011'));
    }
    
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };