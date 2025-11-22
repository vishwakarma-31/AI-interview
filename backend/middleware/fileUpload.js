const multer = require('multer');
const { AppError } = require('./errorHandler');
const path = require('path');
const crypto = require('crypto');
const logger = require('../services/logger');

// Configure multer for file uploads with enhanced security measures
const storage = multer.memoryStorage();

// Generate random filename to prevent path traversal
const generateRandomFilename = (originalname) => {
  const ext = path.extname(originalname);
  const randomName = crypto.randomBytes(16).toString('hex');
  return `${randomName}${ext}`;
};

// Enhanced file type validation with magic byte checking
const validateFileType = (buffer, mimetype, originalname) => {
  // Check magic bytes for PDF files
  if (mimetype === 'application/pdf') {
    // PDF magic bytes: %PDF
    if (buffer.length < 4 || buffer.toString('ascii', 0, 4) !== '%PDF') {
      return false;
    }
    return true;
  }
  
  // Check magic bytes for DOCX files
  if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    // DOCX files are ZIP archives, magic bytes: PK
    if (buffer.length < 2 || buffer.toString('ascii', 0, 2) !== 'PK') {
      return false;
    }
    return true;
  }
  
  return false;
};

// Enhanced file filter with additional security checks
const fileFilter = (req, file, cb) => {
  try {
    // Log file upload attempt
    logger.info('File upload attempt', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      userId: req.user ? req.user.id : 'anonymous',
      ip: req.ip
    });
    
    // Check file size (this is a secondary check in addition to multer's limit)
    if (file.size > 10 * 1024 * 1024) { // 10MB
      logger.warn('File upload rejected: File too large', {
        filename: file.originalname,
        size: file.size,
        userId: req.user ? req.user.id : 'anonymous',
        ip: req.ip
      });
      return cb(new AppError('File too large. Maximum file size is 10MB.', 400, 'FILE_002'), false);
    }
    
    // Allow only PDF and DOCX files
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      logger.warn('File upload rejected: Invalid file type', {
        filename: file.originalname,
        mimetype: file.mimetype,
        userId: req.user ? req.user.id : 'anonymous',
        ip: req.ip
      });
      return cb(new AppError('Invalid file type. Only PDF and DOCX files are allowed.', 400, 'FILE_001'), false);
    }
    
    // Check for suspicious filenames
    const suspiciousPatterns = [
      /\.\./, // Path traversal
      /^[~$]/, // Temporary files
      /[%<>:"|?*]/ // Invalid characters
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(file.originalname)) {
        logger.warn('File upload rejected: Suspicious filename detected', {
          filename: file.originalname,
          pattern: pattern.toString(),
          userId: req.user ? req.user.id : 'anonymous',
          ip: req.ip
        });
        return cb(new AppError('Invalid filename. Filename contains suspicious characters.', 400, 'FILE_003'), false);
      }
    }
    
    // Add secure filename
    file.originalname = generateRandomFilename(file.originalname);
    
    // Add file metadata
    file.uploadedAt = new Date();
    file.uploadedBy = req.user ? req.user.id : 'anonymous';
    
    cb(null, true);
  } catch (error) {
    logger.error('File filter error:', error);
    cb(new AppError('File upload processing failed', 500, 'FILE_004'), false);
  }
};

// Middleware to validate file content after upload
const validateFileContent = (req, res, next) => {
  try {
    if (req.file) {
      // Validate file content using magic bytes
      const isValid = validateFileType(req.file.buffer, req.file.mimetype, req.file.originalname);
      
      if (!isValid) {
        logger.warn('File content validation failed', {
          filename: req.file.originalname,
          mimetype: req.file.mimetype,
          userId: req.user ? req.user.id : 'anonymous',
          ip: req.ip
        });
        
        return next(new AppError('File content does not match declared type.', 400, 'FILE_009'));
      }
      
      logger.info('File content validation passed', {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        userId: req.user ? req.user.id : 'anonymous',
        ip: req.ip
      });
    }
    
    next();
  } catch (error) {
    logger.error('File content validation error:', error);
    return next(new AppError('File content validation failed', 500, 'FILE_010'));
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1, // Only allow one file at a time
    fieldSize: 2 * 1024 * 1024 // 2MB field size limit
  },
  fileFilter: fileFilter
});

// Middleware to handle file upload errors
const handleFileUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    logger.error('Multer error:', {
      code: err.code,
      message: err.message,
      field: err.field,
      userId: req.user ? req.user.id : 'anonymous',
      ip: req.ip
    });
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return next(new AppError('File too large. Maximum file size is 10MB.', 400, 'FILE_002'));
      case 'LIMIT_FILE_COUNT':
        return next(new AppError('Too many files uploaded. Only one file is allowed.', 400, 'FILE_005'));
      case 'LIMIT_FIELD_KEY':
      case 'LIMIT_FIELD_VALUE':
      case 'LIMIT_FIELD_COUNT':
        return next(new AppError('File upload field limit exceeded.', 400, 'FILE_006'));
      default:
        return next(new AppError(`File upload error: ${err.message}`, 400, 'FILE_007'));
    }
  }
  
  // Handle our custom AppError
  if (err instanceof AppError) {
    return next(err);
  }
  
  // Handle any other errors
  logger.error('Unexpected file upload error:', err);
  return next(new AppError('File upload failed due to server error', 500, 'FILE_008'));
};

module.exports = { 
  upload,
  handleFileUploadError,
  validateFileContent
};