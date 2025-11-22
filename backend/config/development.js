// Development environment configuration
module.exports = {
  env: 'development',
  port: process.env.PORT || 5000,
  sslPort: process.env.SSL_PORT || 5443,
  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/ai-interview-dev',
    options: {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || null
  },
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  },
  rateLimit: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100 // limit each IP to 100 requests per windowMs
  },
  session: {
    secret: process.env.SESSION_SECRET || 'dev-session-secret-change-in-production',
    ttl: 24 * 60 * 60 // 24 hours
  },
  logging: {
    level: 'debug',
    format: 'pretty'
  }
};