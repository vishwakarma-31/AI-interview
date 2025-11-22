const { AppError } = require('./errorHandler');
const { validateEmail, validatePhoneNumber, validateQuestionTime } = require('../validation/interviewValidation');
const Joi = require('joi');

// Validation middleware function
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return next(new AppError(errorMessage, 400, 'VALID_001'));
    }
    
    // Update req.body with validated values
    req.body = value;
    next();
  };
};

// File validation middleware
const validateFile = (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No file uploaded', 400, 'FILE_001'));
  }
  
  // Check file size (10MB limit)
  if (req.file.size > 10 * 1024 * 1024) {
    return next(new AppError('File too large. Maximum file size is 10MB.', 400, 'FILE_002'));
  }
  
  // Check file type
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (!allowedTypes.includes(req.file.mimetype)) {
    return next(new AppError('Invalid file type. Only PDF and DOCX files are allowed.', 400, 'FILE_001'));
  }
  
  next();
};

// Email validation middleware
const validateEmailFormat = (req, res, next) => {
  const { email } = req.body;
  
  if (email && !validateEmail(email)) {
    return next(new AppError('Invalid email format', 400, 'VALID_005'));
  }
  
  next();
};

// Phone number validation middleware (E.164 format)
const validatePhoneFormat = (req, res, next) => {
  const { phone } = req.body;
  
  if (phone && !validatePhoneNumber(phone)) {
    return next(new AppError('Invalid phone number format. Must be E.164 format.', 400, 'VALID_006'));
  }
  
  next();
};

// Question time validation middleware (30-300 seconds)
const validateQuestionTimeRange = (req, res, next) => {
  const { time } = req.body;
  
  if (time && !validateQuestionTime(time)) {
    return next(new AppError('Invalid question time. Must be between 30 and 300 seconds.', 400, 'VALID_007'));
  }
  
  next();
};

// Validation schema for user registration
const registrationSchema = Joi.object({
  username: Joi.string().min(3).max(30).required().messages({
    'string.empty': 'Username is required',
    'string.min': 'Username must be at least 3 characters long',
    'string.max': 'Username must be less than 30 characters long'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email must be a valid email address',
    'string.empty': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters long'
  }),
  role: Joi.string().valid('admin', 'interviewer', 'candidate').optional().messages({
    'any.only': 'Role must be one of: admin, interviewer, candidate'
  })
});

// Validation schema for user login
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email must be a valid email address',
    'string.empty': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required'
  })
});

// Import additional schemas
const { 
  createApiKeySchema, 
  updateApiKeySchema, 
  revokeApiKeySchema,
  questionTimeSchema
} = require('../validation/interviewValidation');

// Validation middleware for registration
const validateRegistration = validate(registrationSchema);

// Validation middleware for login
const validateLogin = validate(loginSchema);

// Validation middleware for API key operations
const validateCreateApiKey = validate(createApiKeySchema);
const validateUpdateApiKey = validate(updateApiKeySchema);
const validateRevokeApiKey = validate(revokeApiKeySchema);

// Validation middleware for question time
const validateQuestionTime = validate(questionTimeSchema);

module.exports = {
  validate,
  validateFile,
  validateEmailFormat,
  validatePhoneFormat,
  validateQuestionTimeRange,
  validateQuestionTime,
  validateRegistration,
  validateLogin,
  validateCreateApiKey,
  validateUpdateApiKey,
  validateRevokeApiKey
};