const Joi = require('joi');

// Validation schema for scheduling an interview
const scheduleInterviewSchema = Joi.object({
  candidateId: Joi.string().required().messages({
    'any.required': 'Candidate ID is required',
    'string.empty': 'Candidate ID cannot be empty'
  }),
  scheduledAt: Joi.date().iso().min('now').required().messages({
    'any.required': 'Scheduled date and time is required',
    'date.base': 'Scheduled date and time must be a valid date',
    'date.isoDate': 'Scheduled date and time must be in ISO 8601 format',
    'date.min': 'Scheduled date and time must be in the future'
  }),
  duration: Joi.number().integer().min(15).max(120).required().messages({
    'any.required': 'Duration is required',
    'number.base': 'Duration must be a number',
    'number.integer': 'Duration must be an integer',
    'number.min': 'Duration must be at least 15 minutes',
    'number.max': 'Duration cannot exceed 120 minutes'
  }),
  timezone: Joi.string().optional().messages({
    'string.base': 'Timezone must be a string'
  })
});

// Validation schema for rescheduling an interview
const rescheduleInterviewSchema = Joi.object({
  scheduledAt: Joi.date().iso().min('now').required().messages({
    'any.required': 'Scheduled date and time is required',
    'date.base': 'Scheduled date and time must be a valid date',
    'date.isoDate': 'Scheduled date and time must be in ISO 8601 format',
    'date.min': 'Scheduled date and time must be in the future'
  }),
  duration: Joi.number().integer().min(15).max(120).required().messages({
    'any.required': 'Duration is required',
    'number.base': 'Duration must be a number',
    'number.integer': 'Duration must be an integer',
    'number.min': 'Duration must be at least 15 minutes',
    'number.max': 'Duration cannot exceed 120 minutes'
  }),
  timezone: Joi.string().optional().messages({
    'string.base': 'Timezone must be a string'
  })
});

module.exports = {
  scheduleInterviewSchema,
  rescheduleInterviewSchema
};