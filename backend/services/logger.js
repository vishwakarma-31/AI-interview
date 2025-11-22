const winston = require('winston');
const path = require('path');

// Define custom log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};

// Define custom colors for log levels
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'grey'
};

// Add colors to Winston
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define log format for console
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Create transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
  }),
  // File transport for errors
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/error.log'),
    level: 'error',
    format: format,
  }),
  // File transport for all logs
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/all.log'),
    format: format,
  }),
];

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  transports,
});

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

module.exports = logger;