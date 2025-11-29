const crypto = require('crypto');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const redis = require('redis');

const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../services/logger');

// Get Redis configuration from environment or config
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
});

// Handle Redis connection errors
redisClient.on('error', err => {
  logger.error('Redis error in authController:', err);
});

// Connect to Redis
redisClient.connect().catch(err => {
  logger.error('Failed to connect to Redis in authController:', err);
});

dotenv.config();

// Generate JWT token with enhanced security
const generateToken = user => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.role,
      // Add a unique identifier for the token to enable token blacklisting
      tokenId: crypto.randomBytes(16).toString('hex'),
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      // Add security options
      issuer: 'AI-Interview-Assistant',
      audience: process.env.FRONTEND_URL || 'http://localhost:5173',
      subject: user._id.toString(),
    }
  );
};

// Generate refresh token
const generateRefreshToken = user => {
  return jwt.sign(
    {
      id: user._id,
      tokenId: crypto.randomBytes(16).toString('hex'),
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: '7d',
      issuer: 'AI-Interview-Assistant',
      subject: user._id.toString(),
    }
  );
};

// Redis client is already defined above

// Verify token and check if it's blacklisted
const verifyToken = async token => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is blacklisted in Redis
    const blacklistResult = await redisClient.get(`blacklisted_token:${decoded.tokenId}`);
    if (blacklistResult === 'blacklisted') {
      throw new Error('Token has been blacklisted');
    }

    return decoded;
  } catch (error) {
    throw new AppError('Invalid or expired token', 401, 'AUTH_003');
  }
};

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function register(req, res, next) {
  try {
    const { username, email, password, role } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      throw new AppError('Username, email, and password are required', 400, 'VALID_001');
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      throw new AppError('User with this email or username already exists', 409, 'DB_003');
    }

    // Create new user
    const user = new User({ username, email, password, role });
    await user.save();

    // Generate tokens
    const accessToken = generateToken(user);
    const userRefreshToken = generateRefreshToken(user);

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', userRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      data: {
        message: 'User registered successfully',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Login user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      throw new AppError('Email and password are required', 400, 'VALID_001');
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('Invalid credentials', 401, 'AUTH_001');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('Account is deactivated', 401, 'AUTH_004');
    }

    // Validate password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401, 'AUTH_001');
    }

    // Generate tokens
    const accessToken = generateToken(user);
    const userRefreshToken = generateRefreshToken(user);

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', userRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      data: {
        message: 'Login successful',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Refresh access token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function refreshToken(req, res, next) {
  try {
    const { refreshToken: refreshTokenCookie } = req.cookies;

    if (!refreshTokenCookie) {
      throw new AppError('Refresh token required', 401, 'AUTH_005');
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshTokenCookie,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new AppError('User not found', 404, 'DB_002');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('Account is deactivated', 401, 'AUTH_004');
    }

    // Generate new tokens
    const accessToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Set new refresh token as HTTP-only cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      data: {
        message: 'Token refreshed successfully',
        accessToken,
      },
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Refresh token expired', 401, 'AUTH_006'));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid refresh token', 401, 'AUTH_007'));
    }
    next(error);
  }
}

/**
 * Logout user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function logout(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      try {
        // Decode token to get tokenId
        const decoded = jwt.decode(token);
        if (decoded && decoded.tokenId) {
          // Add token to blacklist in Redis with expiration
          // Set expiration to match the token's remaining TTL
          const tokenTTL = decoded.exp - Math.floor(Date.now() / 1000);
          if (tokenTTL > 0) {
            await redisClient.setEx(
              `blacklisted_token:${decoded.tokenId}`,
              tokenTTL,
              'blacklisted'
            );
          }
        }
      } catch (decodeError) {
        // If we can't decode the token, we still want to clear the cookie
        logger.warn('Failed to decode token during logout', { error: decodeError.message });
      }
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getCurrentUser(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      throw new AppError('User not found', 404, 'DB_002');
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser,
  verifyToken,
};
