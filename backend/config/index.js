// Configuration loader
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Get environment
const env = process.env.NODE_ENV || 'development';

// Load environment-specific configuration
let config;
try {
  config = require(`./${env}`);
} catch (error) {
  console.warn(`Configuration file for environment "${env}" not found, using development config`);
  config = require('./development');
}

// Load interview configuration
const interviewConfig = require('./interview');

// Override with environment variables if present
config.port = process.env.PORT || config.port;
config.sslPort = process.env.SSL_PORT || config.sslPort;
config.mongo.uri = process.env.MONGO_URI || config.mongo.uri;
config.redis.host = process.env.REDIS_HOST || config.redis.host;
config.redis.port = process.env.REDIS_PORT || config.redis.port;
config.redis.password = process.env.REDIS_PASSWORD || config.redis.password;
config.session.secret = process.env.SESSION_SECRET || config.session.secret;

module.exports = {
  ...config,
  interview: interviewConfig,
  env
};