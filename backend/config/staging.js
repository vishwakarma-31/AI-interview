// Staging environment configuration
module.exports = {
  env: 'staging',
  port: process.env.PORT || 5000,
  sslPort: process.env.SSL_PORT || 5443,
  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://mongo:27017/ai-interview-staging',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },
  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || null
  },
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://staging.ai-interview.example.com'],
    credentials: true
  },
  rateLimit: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 50 // limit each IP to 50 requests per windowMs
  },
  session: {
    secret: process.env.SESSION_SECRET,
    ttl: 24 * 60 * 60 // 24 hours
  },
  logging: {
    level: 'info',
    format: 'json'
  }
};