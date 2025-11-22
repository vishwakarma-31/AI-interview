const Joi = require('joi');
const { isValidPhoneNumber } = require('libphonenumber-js');

// Validation schema for starting an interview
const startInterviewSchema = Joi.object({
  name: Joi.string().min(1).max(100).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 1 character long',
    'string.max': 'Name must be less than 100 characters long'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email must be a valid email address',
    'string.empty': 'Email is required'
  }),
  phone: Joi.string().required().custom((value, helpers) => {
    if (!isValidPhoneNumber(value, 'US')) { // Default to US, but can be changed based on requirements
      return helpers.error('any.invalid');
    }
    return value;
  }).messages({
    'string.empty': 'Phone number is required',
    'any.invalid': 'Phone number must be valid'
  }),
  role: Joi.string().valid('Frontend', 'Backend', 'Fullstack', 'DevOps', 'QA', 'Fullstack Developer', 'DevOps Engineer', 'Data Scientist', 'Product Manager', 'UI/UX Designer', 'Mobile Developer').required().messages({
    'any.only': 'Role must be one of: Frontend, Backend, Fullstack, DevOps, QA, Fullstack Developer, DevOps Engineer, Data Scientist, Product Manager, UI/UX Designer, Mobile Developer',
    'string.empty': 'Role is required'
  }),
  gdprConsent: Joi.boolean().valid(true).required().messages({
    'boolean.base': 'GDPR consent must be accepted',
    'any.only': 'You must accept the privacy policy and terms of service'
  })
});

// Validation schema for submitting an answer
const submitAnswerSchema = Joi.object({
  answerText: Joi.string().min(10).max(5000).required().messages({
    'string.empty': 'Answer text is required',
    'string.min': 'Answer must be at least 10 characters long',
    'string.max': 'Answer must be less than 5000 characters long'
  })
});

// Validation schema for finalizing an interview
const finalizeInterviewSchema = Joi.object({
  sessionId: Joi.string().required().messages({
    'string.empty': 'Session ID is required'
  })
});

// Validation schema for file uploads
const fileUploadSchema = Joi.object({
  fileSize: Joi.number().max(10 * 1024 * 1024).messages({ // 10MB in bytes
    'number.max': 'File size must be less than 10MB'
  }),
  fileType: Joi.string().valid('application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document').messages({
    'any.only': 'File type must be PDF or DOCX'
  })
});

// Validation schema for question time (30-300 seconds)
const questionTimeSchema = Joi.object({
  time: Joi.number().integer().min(30).max(300).required().messages({
    'number.base': 'Time must be a number',
    'number.integer': 'Time must be an integer',
    'number.min': 'Time must be at least 30 seconds',
    'number.max': 'Time must be no more than 300 seconds',
    'any.required': 'Time is required'
  })
});

// Validation schema for creating an API key
const createApiKeySchema = Joi.object({
  name: Joi.string().min(1).max(100).required().messages({
    'string.empty': 'API key name is required',
    'string.min': 'API key name must be at least 1 character long',
    'string.max': 'API key name must be less than 100 characters long'
  }),
  permissions: Joi.array().items(Joi.string()).optional().messages({
    'array.base': 'Permissions must be an array of strings'
  }),
  expiresAt: Joi.date().optional().messages({
    'date.base': 'Expiration date must be a valid date'
  })
});

// Validation schema for updating an API key
const updateApiKeySchema = Joi.object({
  name: Joi.string().min(1).max(100).optional().messages({
    'string.min': 'API key name must be at least 1 character long',
    'string.max': 'API key name must be less than 100 characters long'
  }),
  permissions: Joi.array().items(Joi.string()).optional().messages({
    'array.base': 'Permissions must be an array of strings'
  }),
  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive must be a boolean value'
  }),
  expiresAt: Joi.date().optional().messages({
    'date.base': 'Expiration date must be a valid date'
  })
}).min(1); // At least one field is required for update

// Validation schema for revoking an API key
const revokeApiKeySchema = Joi.object({
  apiKey: Joi.string().required().messages({
    'string.empty': 'API key is required'
  })
});

// Email validation function
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone number validation function (libphonenumber-js)
const validatePhoneNumber = (phone) => {
  try {
    return isValidPhoneNumber(phone, 'US'); // Default to US, but can be changed based on requirements
  } catch (error) {
    return false;
  }
};

// Validation schema for adjusting question scores
const adjustScoreSchema = Joi.object({
  questionId: Joi.string().required().messages({
    'string.empty': 'Question ID is required'
  }),
  newScore: Joi.number().integer().min(0).max(100).required().messages({
    'number.base': 'Score must be a number',
    'number.integer': 'Score must be an integer',
    'number.min': 'Score must be at least 0',
    'number.max': 'Score must be no more than 100',
    'any.required': 'Score is required'
  }),
  reason: Joi.string().max(500).optional().messages({
    'string.max': 'Reason must be less than 500 characters long'
  })
});

// Question time validation function (30-300 seconds)
const validateQuestionTime = (time) => {
  return Number.isInteger(time) && time >= 30 && time <= 300;
};

module.exports = {
  startInterviewSchema,
  submitAnswerSchema,
  finalizeInterviewSchema,
  fileUploadSchema,
  questionTimeSchema,
  createApiKeySchema,
  updateApiKeySchema,
  revokeApiKeySchema,
  adjustScoreSchema,
  validateEmail,
  validatePhoneNumber,
  validateQuestionTime
};