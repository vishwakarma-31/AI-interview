const { AppError } = require('./errorHandler');
const InterviewSession = require('../models/InterviewSession');

// Middleware to prevent concurrent sessions per candidate
const preventConcurrentSessions = async (req, res, next) => {
  try {
    // Get candidate ID from request (this would be set by authentication middleware)
    const candidateId = req.user?.id;
    
    if (!candidateId) {
      return next();
    }
    
    // Check if candidate already has an active session
    const existingSession = await InterviewSession.findOne({
      'candidateId': candidateId,
      'status': { $in: ['pending', 'in-progress'] }
    });
    
    if (existingSession) {
      return next(new AppError(
        'You already have an active interview session. Please complete or abandon the current session before starting a new one.',
        409,
        'SESSION_001'
      ));
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { preventConcurrentSessions };