const Candidate = require('../models/Candidate');
const mongoose = require('mongoose');
const { AppError, formatSuccessResponse } = require('../middleware/errorHandler');
const { logAuditEvent } = require('../utils/auditLogger');
const { convertToTimezone, formatInTimezone } = require('../utils/timezoneUtils');

/**
 * Schedule an interview for a candidate
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function scheduleInterview(req, res, next) {
  try {
    const { candidateId, scheduledAt, duration, timezone } = req.body;
    
    // Validate candidate ID format
    if (!mongoose.Types.ObjectId.isValid(candidateId)) {
      throw new AppError('Invalid candidate ID format', 400, 'VALID_001');
    }
    
    // Check if database is connected
    const isDatabaseConnected = mongoose.connection.readyState === 1;
    
    // If database is not connected, return error
    if (!isDatabaseConnected) {
      throw new AppError('Database connection failed. Please try again later.', 500, 'DB_001');
    }
    
    // Find the candidate
    const candidate = await Candidate.findOne({ _id: candidateId, isDeleted: { $ne: true } });
    if (!candidate) {
      throw new AppError('Candidate not found', 404, 'DB_002');
    }
    
    // Convert scheduledAt to the specified timezone
    const scheduledAtInTimezone = convertToTimezone(new Date(scheduledAt), timezone);
    
    // Update candidate with scheduling information
    candidate.status = 'scheduled';
    candidate.scheduledAt = scheduledAtInTimezone;
    candidate.scheduledDuration = duration;
    candidate.timezone = timezone || 'UTC';
    candidate.updatedAt = new Date();
    
    await candidate.save();
    
    // Log audit event
    await logAuditEvent('SCHEDULE_INTERVIEW', 'Candidate', candidate._id, {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      changes: {
        status: 'scheduled',
        scheduledAt: candidate.scheduledAt,
        scheduledDuration: duration,
        timezone: candidate.timezone
      }
    });
    
    // Send standardized success response
    res.status(201).json(formatSuccessResponse({
      candidate: candidate
    }, 'Interview scheduled successfully', 201));
  } catch (error) {
    next(error);
  }
}

/**
 * Get upcoming scheduled interviews
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getUpcomingInterviews(req, res, next) {
  try {
    const { candidateId, status, from, to, timezone } = req.query;
    
    // Get current time in the specified timezone
    const currentTimeInTimezone = convertToTimezone(new Date(), timezone);
    
    // Build filter object
    const filter = { 
      status: 'scheduled',
      scheduledAt: { $gte: currentTimeInTimezone },
      isDeleted: { $ne: true }
    };
    
    // Add candidate ID filter if provided
    if (candidateId) {
      if (!mongoose.Types.ObjectId.isValid(candidateId)) {
        throw new AppError('Invalid candidate ID format', 400, 'VALID_001');
      }
      filter._id = candidateId;
    }
    
    // Add status filter if provided
    if (status) {
      filter.status = status;
    }
    
    // Add date range filters if provided
    if (from) {
      filter.scheduledAt.$gte = convertToTimezone(new Date(from), timezone);
    }
    
    if (to) {
      filter.scheduledAt.$lte = convertToTimezone(new Date(to), timezone);
    }
    
    // Check if database is connected
    const isDatabaseConnected = mongoose.connection.readyState === 1;
    
    // If database is not connected, return error
    if (!isDatabaseConnected) {
      throw new AppError('Database connection failed. Please try again later.', 500, 'DB_001');
    }
    
    // Get candidates with scheduling information
    const candidates = await Candidate.find(filter).sort({ scheduledAt: 1 });
    
    // Send standardized success response
    res.json(formatSuccessResponse({
      candidates: candidates,
      count: candidates.length
    }, 'Upcoming interviews retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Cancel a scheduled interview
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function cancelInterview(req, res, next) {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid candidate ID format', 400, 'VALID_001');
    }
    
    // Check if database is connected
    const isDatabaseConnected = mongoose.connection.readyState === 1;
    
    // If database is not connected, return error
    if (!isDatabaseConnected) {
      throw new AppError('Database connection failed. Please try again later.', 500, 'DB_001');
    }
    
    // Find the candidate
    const candidate = await Candidate.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!candidate) {
      throw new AppError('Candidate not found', 404, 'DB_002');
    }
    
    // Check if candidate has a scheduled interview
    if (candidate.status !== 'scheduled') {
      throw new AppError('Candidate does not have a scheduled interview', 400, 'SCHED_002');
    }
    
    // Update candidate status to pending
    const previousStatus = candidate.status;
    candidate.status = 'pending';
    candidate.scheduledAt = null;
    candidate.scheduledDuration = null;
    candidate.updatedAt = new Date();
    
    await candidate.save();
    
    // Log audit event
    await logAuditEvent('CANCEL_INTERVIEW', 'Candidate', candidate._id, {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      changes: {
        status: { from: previousStatus, to: 'pending' },
        scheduledAt: null,
        scheduledDuration: null
      }
    });
    
    // Send standardized success response
    res.json(formatSuccessResponse({
      candidate: candidate
    }, 'Interview cancelled successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Reschedule an interview
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function rescheduleInterview(req, res, next) {
  try {
    const { id } = req.params;
    const { scheduledAt, duration, timezone } = req.body;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid candidate ID format', 400, 'VALID_001');
    }
    
    // Check if database is connected
    const isDatabaseConnected = mongoose.connection.readyState === 1;
    
    // If database is not connected, return error
    if (!isDatabaseConnected) {
      throw new AppError('Database connection failed. Please try again later.', 500, 'DB_001');
    }
    
    // Find the candidate
    const candidate = await Candidate.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!candidate) {
      throw new AppError('Candidate not found', 404, 'DB_002');
    }
    
    // Check if candidate has a scheduled interview
    if (candidate.status !== 'scheduled') {
      throw new AppError('Candidate does not have a scheduled interview', 400, 'SCHED_002');
    }
    
    // Convert scheduledAt to the specified timezone
    const scheduledAtInTimezone = convertToTimezone(new Date(scheduledAt), timezone);
    
    // Update candidate with new scheduling information
    const previousScheduledAt = candidate.scheduledAt;
    const previousDuration = candidate.scheduledDuration;
    const previousTimezone = candidate.timezone;
    
    candidate.scheduledAt = scheduledAtInTimezone;
    candidate.scheduledDuration = duration;
    candidate.timezone = timezone || candidate.timezone || 'UTC';
    candidate.updatedAt = new Date();
    
    await candidate.save();
    
    // Log audit event
    await logAuditEvent('RESCHEDULE_INTERVIEW', 'Candidate', candidate._id, {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      changes: {
        scheduledAt: { from: previousScheduledAt, to: candidate.scheduledAt },
        scheduledDuration: { from: previousDuration, to: duration },
        timezone: { from: previousTimezone, to: candidate.timezone }
      }
    });
    
    // Send standardized success response
    res.json(formatSuccessResponse({
      candidate: candidate
    }, 'Interview rescheduled successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Get supported timezones
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getSupportedTimezones(req, res, next) {
  try {
    const { getSupportedTimezones } = require('../utils/timezoneUtils');
    
    // Get supported timezones
    const timezones = getSupportedTimezones();
    
    // Send standardized success response
    res.json(formatSuccessResponse({
      timezones: timezones,
      count: timezones.length
    }, 'Supported timezones retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  scheduleInterview,
  getUpcomingInterviews,
  cancelInterview,
  rescheduleInterview,
  getSupportedTimezones
};








