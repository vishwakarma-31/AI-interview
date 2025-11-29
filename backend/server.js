const crypto = require('crypto');
const fs = require('fs');
const https = require('https');

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const { RedisStore } = require('connect-redis');
const redis = require('redis');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const multer = require('multer');
const cookieParser = require('cookie-parser');

// Sentry integration
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');
const logger = require('./services/logger');

// Load environment variables
dotenv.config();

// Load environment-specific configuration
const config = require('./config');

// Enhanced environment variable handling with decryption
const { decryptEnvVar } = require('./utils/encryption');
const {
  getDatabaseCredentials,
  getJWTSecrets,
  getOpenAIApiKey,
} = require('./utils/secretsManager');

// Initialize secrets manager
// In production, this would connect to AWS Secrets Manager
// For now, we'll use environment variables as fallback

// Get secrets from secrets manager or fallback to environment variables
async function initializeSecrets() {
  try {
    // Get database credentials
    const dbCredentials = await getDatabaseCredentials();
    const dbUri = dbCredentials.uri || process.env.MONGO_URI || config.mongo.uri;
    // Only decrypt if it appears to be encrypted (check for our new format with IV prefix)
    process.env.MONGO_URI = /^[0-9a-fA-F]{32}:/.test(dbUri) ? decryptEnvVar(dbUri) : dbUri;

    // Get JWT secrets
    const jwtSecrets = await getJWTSecrets();
    const accessTokenSecret = jwtSecrets.accessTokenSecret || process.env.JWT_SECRET;
    const refreshTokenSecret = jwtSecrets.refreshTokenSecret || process.env.JWT_REFRESH_SECRET;

    // Only decrypt if they appear to be encrypted (check for our new format with IV prefix)
    process.env.JWT_SECRET = /^[0-9a-fA-F]{32}:/.test(accessTokenSecret)
      ? decryptEnvVar(accessTokenSecret)
      : accessTokenSecret;
    process.env.JWT_REFRESH_SECRET = /^[0-9a-fA-F]{32}:/.test(refreshTokenSecret)
      ? decryptEnvVar(refreshTokenSecret)
      : refreshTokenSecret;

    // Get OpenAI API key
    const openaiApiKey = await getOpenAIApiKey();
    // Only decrypt if it appears to be encrypted (check for our new format with IV prefix)
    process.env.OPENAI_API_KEY = /^[0-9a-fA-F]{32}:/.test(openaiApiKey)
      ? decryptEnvVar(openaiApiKey)
      : openaiApiKey;

    // Get other secrets
    const sessionSecret = process.env.SESSION_SECRET || config.session.secret;
    const encryptionKey = process.env.ENCRYPTION_KEY;
    const sentryDsn = process.env.SENTRY_DSN;

    // Only decrypt if they appear to be encrypted (check for our new format with IV prefix)
    process.env.SESSION_SECRET = /^[0-9a-fA-F]{32}:/.test(sessionSecret)
      ? decryptEnvVar(sessionSecret)
      : sessionSecret;
    process.env.ENCRYPTION_KEY = /^[0-9a-fA-F]{32}:/.test(encryptionKey)
      ? decryptEnvVar(encryptionKey)
      : encryptionKey;
    process.env.SENTRY_DSN = /^[0-9a-fA-F]{32}:/.test(sentryDsn)
      ? decryptEnvVar(sentryDsn)
      : sentryDsn;

    logger.info('Secrets initialized successfully');
  } catch (error) {
    logger.error('Error initializing secrets:', error.message);
    // Continue with environment variables as fallback
  }
}

// Initialize secrets
initializeSecrets();

// Environment validation
const { validateEnvironment } = require('./utils/envValidator');

const envValidation = validateEnvironment();

if (!envValidation.isValid) {
  logger.error('Environment validation failed:', envValidation.errors);
  logger.info('Please check your .env file and ensure all required variables are set correctly');
  process.exit(1);
}

logger.info('Environment validation passed');

// Runtime config validation
const { validateRuntimeConfig, getCurrentConfig } = require('./utils/runtimeConfigValidator');

const runtimeConfig = getCurrentConfig();
const runtimeValidation = validateRuntimeConfig(runtimeConfig);

if (!runtimeValidation.isValid) {
  logger.warn('Runtime configuration validation warnings:', runtimeValidation.errors);
} else {
  logger.info('Runtime configuration validation passed');
}

// Import routes
const interviewRoutes = require('./routes/interviewRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const testRoutes = require('./routes/testRoutes');
const apiKeyRoutes = require('./routes/apiKeyRoutes');
const privacyRoutes = require('./routes/privacyRoutes');
const exportRoutes = require('./routes/exportRoutes');
const auditRoutes = require('./routes/auditRoutes');
const legalRoutes = require('./routes/legalRoutes');
const schedulingRoutes = require('./routes/schedulingRoutes');
const organizationRoutes = require('./routes/organizationRoutes');

// Import middleware
const { validateRequest } = require('./middleware/requestValidation');
const {
  sanitizeInput,
  validateInput,
  preventSqlInjection,
  validateInputLength,
} = require('./middleware/xss');
const {
  handleAppError,
  handleNotFound,
  handleGlobalError,
  formatSuccessResponse,
  formatErrorResponse,
} = require('./middleware/errorHandler');
const { initializeSessionSecurity } = require('./middleware/sessionValidation');
const i18nMiddleware = require('./middleware/i18n');
const organizationBrandingMiddleware = require('./middleware/organizationBranding');

// Initialize express app
const app = express();
const PORT = process.env.PORT || config.port;
const SSL_PORT = process.env.SSL_PORT || 5443;

// Generate nonce for CSP

// Initialize Sentry
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Tracing.Integrations.Express({ app }),
    ],
    tracesSampleRate: 1.0,
  });

  // RequestHandler creates a separate execution context using domains, so that every
  // transaction/span/breadcrumb is attached to its own Hub instance
  app.use(Sentry.Handlers.requestHandler());
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());

  logger.info('Sentry initialized successfully');
} else {
  logger.warn('SENTRY_DSN not found. Sentry error tracking is disabled.');
}

// Log application start
logger.info('Starting AI Interview Assistant Backend');

// Enhanced rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health check endpoint
  skip: req => req.path === '/health' || req.path === '/ready',
});

// Apply rate limiting to all requests
app.use(limiter);

// Create Redis client
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || config.redis.host,
  port: process.env.REDIS_PORT || config.redis.port,
  password: process.env.REDIS_PASSWORD || config.redis.password,
});

redisClient.on('error', err => {
  logger.error('Redis error:', err);
});

// Session configuration with Redis store
app.use(
  session({
    secret: process.env.SESSION_SECRET || config.session.secret,
    resave: false,
    saveUninitialized: false,
    store: new RedisStore({
      client: redisClient,
      ttl: config.session.ttl, // 24 hours
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
    // Session validation
    rolling: true, // Reset session cookie on each request
  })
);

// CORS configuration with enhanced security for production
const corsOptions = {
  origin: (origin, callback) => {
    // Block requests with no origin unless there's a specific reason to allow them
    if (!origin) {
      logger.warn('CORS blocked request with no origin');
      return callback(new Error('Requests with no origin are not allowed'));
    }

    // Use environment-specific CORS configuration
    const allowedOrigins = config.cors.origin;

    // Check if origin is in the allowed list
    if (allowedOrigins.includes(origin) || allowedOrigins.length === 0) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request from origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200,
  credentials: config.cors.credentials,
};

// Middleware
app.use(cookieParser());
// Initialize session security
app.use(initializeSessionSecurity);
// Enhanced compression with custom settings
app.use(
  compression({
    level: 6, // Default compression level
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req, res) => {
      // Don't compress responses with this request header
      if (req.headers['x-no-compression']) {
        return false;
      }

      // Use compression filter function
      return compression.filter(req, res);
    },
  })
);

// CSP nonce middleware
app.use((req, res, next) => {
  // Generate a nonce for each request
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});

// Enhanced security headers with XSS protection
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: [
          "'self'",
          "'strict-dynamic'",
          (req, res) => `'nonce-${res.locals.nonce}'`, // Add nonce to script-src
        ],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: [],
        reportUri: '/api/v1/csp-report', // CSP violation reporting endpoint
      },
    },
    xssFilter: true, // Enable XSS filter
    noSniff: true, // Prevent MIME-type sniffing
    frameguard: {
      action: 'deny', // Prevent clickjacking
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: {
      policy: 'no-referrer',
    },
    permittedCrossDomainPolicies: {
      permittedPolicies: 'none',
    },
    expectCt: {
      enforce: true,
      maxAge: 30,
    },
  })
);

// CSP violation reporting endpoint
app.post('/api/v1/csp-report', express.json({ type: 'application/csp-report' }), (req, res) => {
  logger.warn('CSP Violation Report:', req.body);
  res.status(204).end();
});

app.use(cors(corsOptions));
app.use(express.json());
app.use(i18nMiddleware); // Add i18n middleware
app.use(organizationBrandingMiddleware); // Add organization branding middleware
app.use(validateRequest);
// Enhanced MongoDB sanitization with proper configuration
app.use(
  mongoSanitize({
    allowDots: false, // Prevent dots in keys which can be used for NoSQL injection
    replaceWith: '_', // Replace dangerous characters with underscores
    onSanitize: (req, key, value) => {
      logger.warn('MongoDB sanitization occurred', { key, value, ip: req.ip, url: req.url });
    },
  })
);

// Enhanced input sanitization and validation
app.use(preventSqlInjection); // SQL injection prevention first
app.use(sanitizeInput); // XSS sanitization
app.use(validateInput); // Input validation
app.use(validateInputLength); // Length validation

// File upload error handling middleware
// app.use(handleFileUploadError); // This is an error handler, not a regular middleware

// Request logging middleware
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// Routes
app.use('/api/v1/interview', interviewRoutes);
app.use('/api/v1/candidates', candidateRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/test', testRoutes);
app.use('/api/v1/api-keys', apiKeyRoutes);
app.use('/api/v1/privacy', privacyRoutes);
app.use('/api/v1/export', exportRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/legal', legalRoutes);
app.use('/api/v1/scheduling', schedulingRoutes);
app.use('/api/v1/organizations', organizationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  logger.info('Health check endpoint accessed');
  res
    .status(200)
    .json(formatSuccessResponse({ status: 'OK' }, 'AI Interview Assistant Backend is running'));
});

// Readiness check endpoint
app.get('/ready', async (req, res) => {
  try {
    // Check database connection
    const dbState = mongoose.connection.readyState;
    const isDbConnected = dbState === 1; // 1 = connected

    // Check Redis connection
    let isRedisConnected = false;
    try {
      await redisClient.ping();
      isRedisConnected = true;
    } catch (error) {
      logger.warn('Redis connection check failed:', error.message);
    }

    // Check if required services are ready
    const isReady = isDbConnected && isRedisConnected;

    if (isReady) {
      logger.info('Readiness check passed');
      res.status(200).json(
        formatSuccessResponse(
          {
            status: 'READY',
            database: isDbConnected ? 'CONNECTED' : 'DISCONNECTED',
            redis: isRedisConnected ? 'CONNECTED' : 'DISCONNECTED',
          },
          'AI Interview Assistant Backend is ready to serve requests'
        )
      );
    } else {
      logger.warn('Readiness check failed', {
        database: isDbConnected ? 'CONNECTED' : 'DISCONNECTED',
        redis: isRedisConnected ? 'CONNECTED' : 'DISCONNECTED',
      });
      res.status(503).json(
        formatErrorResponse({
          message: 'Service not ready',
          database: isDbConnected ? 'CONNECTED' : 'DISCONNECTED',
          redis: isRedisConnected ? 'CONNECTED' : 'DISCONNECTED',
        })
      );
    }
  } catch (error) {
    logger.error('Readiness check error:', error.message);
    res.status(503).json(
      formatErrorResponse({
        message: 'Readiness check failed',
        error: error.message,
      })
    );
  }
});

// Global error handling middleware
app.use((err, req, res, next) => {
  // Handle multer errors specifically
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      err.statusCode = 400;
      err.errorCode = 'FILE_002';
      err.message = 'File too large. Maximum file size is 10MB.';
    } else {
      err.statusCode = 400;
      err.errorCode = 'FILE_003';
      err.message = `Upload error: ${err.message}`;
    }
  }

  // Handle CORS errors
  if (err.message && err.message.includes('Not allowed by CORS')) {
    logger.warn('CORS violation attempt', {
      origin: req.get('Origin'),
      ip: req.ip,
      url: req.url,
    });
    return res.status(403).json({
      error: 'CORS violation: This origin is not allowed to access this resource',
    });
  }

  next(err);
});

// 404 handler
app.use(handleNotFound);

// Sentry error handler (must be before other error handlers)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

// Centralized error handler
app.use(handleAppError);

// Global unhandled error handler (should be last)
app.use(handleGlobalError);

// Connect to MongoDB with connection pooling and wait for Redis connection
mongoose
  .connect(process.env.MONGO_URI, config.mongo.options)
  .then(async () => {
    logger.info('Connected to MongoDB with connection pooling');

    // Wait for Redis connection to be established
    try {
      await redisClient.connect();
      logger.info('Connected to Redis successfully');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error.message);
      logger.info(
        'Please ensure Redis is running or update the Redis configuration in your .env file'
      );
      process.exit(1); // Exit if Redis connection fails
    }

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`HTTP Server is running on port ${PORT}`);
      logger.info(`Health check endpoint: http://localhost:${PORT}/health`);
      logger.info(`Readiness check endpoint: http://localhost:${PORT}/ready`);
    });

    // Start HTTPS server if SSL certificates are provided
    if (process.env.SSL_KEY && process.env.SSL_CERT) {
      const sslOptions = {
        key: fs.readFileSync(process.env.SSL_KEY),
        cert: fs.readFileSync(process.env.SSL_CERT),
      };

      const httpsServer = https.createServer(sslOptions, app);
      httpsServer.listen(SSL_PORT, () => {
        logger.info(`HTTPS Server is running on port ${SSL_PORT}`);
        logger.info(`Health check endpoint: https://localhost:${SSL_PORT}/health`);
        logger.info(`Readiness check endpoint: https://localhost:${SSL_PORT}/ready`);
      });
    }
  })
  .catch(error => {
    logger.error('Database connection error:', error.message);
    logger.info('Please ensure MongoDB is running or update the MONGO_URI in your .env file');
    process.exit(1); // Exit if database connection fails
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server and database connections');

  // Close Redis connection
  try {
    await redisClient.quit();
    logger.info('Redis connection closed');
  } catch (error) {
    logger.error('Error closing Redis connection:', error.message);
  }

  // Close MongoDB connection
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error.message);
  }

  // Exit process
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server and database connections');

  // Close Redis connection
  try {
    await redisClient.quit();
    logger.info('Redis connection closed');
  } catch (error) {
    logger.error('Error closing Redis connection:', error.message);
  }

  // Close MongoDB connection
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error.message);
  }

  // Exit process
  process.exit(0);
});
