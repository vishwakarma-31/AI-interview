const fs = require('fs');
const https = require('https');

const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

// Sentry integration
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');
const redisClient = require('./config/redisClient');
const logger = require('./services/logger');

// Load environment variables
dotenv.config();

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

// Import validation modules
const { validateEnvironment } = require('./utils/envValidator');

// Enhanced environment variable handling with decryption
const { decryptEnvVar } = require('./utils/encryption');
const {
  getDatabaseCredentials,
  getJWTSecrets,
  getOpenAIApiKey,
} = require('./utils/secretsManager');

// Load config
const config = require('./config');

// Get secrets from secrets manager or fallback to environment variables
async function initializeSecrets() {
  try {
    // Get database credentials
    const dbCredentials = await getDatabaseCredentials();
    const dbUri =
      dbCredentials.uri || process.env.MONGO_URI || 'mongodb://localhost:27017/ai-interview';
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
    const sessionSecret = process.env.SESSION_SECRET || 'dev-session-secret-change-in-production';
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

// Async function to start the server with proper sequencing
async function startServer() {
  try {
    // 1. Initialize secrets first
    await initializeSecrets();

    // Define PORT after config is loaded
    const PORT = process.env.PORT || config.port;

    // 3. Validate environment
    const envValidation = validateEnvironment();
    if (!envValidation.isValid) {
      throw new Error('Environment validation failed');
    }

    // 4. Connect to Redis (Shared client)
    await redisClient.connect();
    logger.info('Connected to Redis successfully');

    // 5. Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, config.mongo.options);
    logger.info('Connected to MongoDB');

    // 6. Start Server
    app.listen(PORT, () => {
      logger.info(`HTTP Server running on port ${PORT}`);
    });

    // Start HTTPS server if SSL certificates are provided
    const SSL_PORT = process.env.SSL_PORT || config.sslPort;
    if (process.env.SSL_KEY && process.env.SSL_CERT) {
      const sslOptions = {
        key: fs.readFileSync(process.env.SSL_KEY),
        cert: fs.readFileSync(process.env.SSL_CERT),
      };

      const httpsServer = https.createServer(sslOptions, app);
      httpsServer.listen(SSL_PORT, () => {
        logger.info(`HTTPS Server running on port ${SSL_PORT}`);
      });
    }
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

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
