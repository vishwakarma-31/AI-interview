const redis = require('redis');
const dotenv = require('dotenv');
const logger = require('../services/logger');

dotenv.config();

// Create a single Redis client instance using environment variables
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
});

// Handle Redis connection errors
redisClient.on('error', err => {
  logger.error('Redis error in shared client:', err);
});

module.exports = redisClient;
