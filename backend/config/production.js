// Production environment configuration
module.exports = {
  env: 'production',
  port: process.env.PORT || 5000,
  sslPort: process.env.SSL_PORT || 5443,
  mongo: {
    uri: process.env.MONGO_URI,
    options: {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || null
  },
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
    credentials: true
  },
  rateLimit: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10 // limit each IP to 10 requests per windowMs
  },
  session: {
    secret: process.env.SESSION_SECRET,
    ttl: 24 * 60 * 60 // 24 hours
  },
  logging: {
    level: 'warn',
    format: 'json'
  }
};