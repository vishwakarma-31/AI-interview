const Candidate = require('../models/Candidate');
const InterviewSession = require('../models/InterviewSession');
const { parsePDF, parseDOCX, generateQuestions, gradeAnswer, generateSummary, fallbackQuestions, fallbackGrade, fallbackSummary } = require('../services/aiService');
const { generateConfigurableQuestions, addCustomQuestions } = require('../services/questionService');
const { calculateFinalScore, applyPartialCredit, adjustScoreManually } = require('../services/scoringService');
const path = require('path');
const mongoose = require('mongoose');
const { AppError, formatSuccessResponse } = require('../middleware/errorHandler');
const crypto = require('crypto');
const { logAuditEvent } = require('../utils/auditLogger');

/**
 * Start a new interview session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function startInterview(req, res, next) {
  let session; // Declare session outside try block for use in catch
  try {
    const { name, email, phone, role, gdprConsent, questionCount, customQuestions } = req.body;
    
    // Validate required fields
    if (!name || !email || !phone || !role) {
      throw new AppError('Missing required fields: name, email, phone, role', 400, 'VALID_004');
    }
    
    let resumeText = '';
    
    // Process resume if uploaded
    if (req.file) {
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      
      // Additional security check for file extension
      if (fileExtension !== '.pdf' && fileExtension !== '.docx') {
        throw new AppError('Invalid file format. Only PDF and DOCX files are supported.', 400, 'FILE_001');
      }
      
      if (fileExtension === '.pdf') {
        resumeText = await parsePDF(req.file.buffer);
      } else if (fileExtension === '.docx') {
        resumeText = await parseDOCX(req.file.buffer);
      }
    }
    
    // Check if database is connected
    const isDatabaseConnected = mongoose.connection.readyState === 1;
    
    // If database is not connected, return error
    if (!isDatabaseConnected) {
      throw new AppError('Database connection failed. Please try again later.', 500, 'DB_001');
    }
    
    // Check if candidate already has an active session
    const existingSession = await InterviewSession.findOne({
      'candidateId.email': email,
      'candidateId.status': { $in: ['pending', 'in-progress'] },
      isDeleted: { $ne: true }
    });
    
    if (existingSession) {
      throw new AppError('Candidate already has an active interview session', 409, 'DB_003');
    }
    
    // Use MongoDB transaction for atomic operations
    session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Create candidate within transaction
      const candidate = new Candidate({
        name,
        email,
        phone,
        resumeText,
        role,
        gdprConsent: gdprConsent || false,
        status: 'in-progress'
      });
      
      await candidate.save({ session });
      
      // Generate configurable questions
      let questions = [];
      try {
        // Use custom questions if provided, otherwise generate questions
        if (customQuestions && Array.isArray(customQuestions) && customQuestions.length > 0) {
          // Add custom questions
          questions = addCustomQuestions([], customQuestions);
          
          // Generate additional questions if needed
          if (questionCount && questions.length < questionCount) {
            const remainingCount = questionCount - questions.length;
            const additionalQuestions = await generateConfigurableQuestions(resumeText, role, remainingCount);
            questions = questions.concat(additionalQuestions);
          }
        } else {
          // Generate questions based on resume and role
          questions = await generateConfigurableQuestions(resumeText, role, questionCount, customQuestions);
        }
      } catch (error) {
        console.error('Error generating configurable questions, using fallback:', error);
        questions = fallbackQuestions;
      }
      
      // If no questions generated, use fallback questions
      if (!questions || questions.length === 0) {
        questions = fallbackQuestions;
      }
      
      // Create interview session within transaction
      const interviewSession = new InterviewSession({
        candidateId: candidate._id,
        questions: questions.map(q => ({
          ...q,
          answer: '',
          draft: '',
          score: 0
        })),
        currentQuestionIndex: 0
      });
      
      await interviewSession.save({ session });
      
      // Commit transaction
      await session.commitTransaction();
      session.endSession();
      
      // Populate candidate data for response
      await interviewSession.populate('candidateId');
      
      // Log audit event
      await logAuditEvent('CREATE_CANDIDATE', 'Candidate', candidate._id, {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      await logAuditEvent('CREATE_INTERVIEW', 'InterviewSession', interviewSession._id, {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    
      // Send standardized success response
      res.status(201).json(formatSuccessResponse({
        candidate: candidate,
        session: {
          id: interviewSession._id,
          questions: interviewSession.questions,
          currentQuestionIndex: interviewSession.currentQuestionIndex
        }
      }, 'Interview started successfully', 201));
    } catch (transactionError) {
      // Abort transaction if any error occurs
      if (session && session.inTransaction()) {
        await session.abortTransaction();
        session.endSession();
      }
      throw transactionError;
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Submit an answer and get the next question
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function submitAnswer(req, res, next) {
  try {
    const { id } = req.params; // Get session ID from URL parameter
    const { answerText } = req.body;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid interview session ID format', 400, 'VALID_001');
    }
    
    if (answerText === undefined) {
      throw new AppError('Answer text is required', 400, 'VALID_004');
    }
    
    // Check if database is connected
    const isDatabaseConnected = mongoose.connection.readyState === 1;
    
    // If database is not connected, return error
    if (!isDatabaseConnected) {
      throw new AppError('Database connection failed. Please try again later.', 500, 'DB_001');
    }
    
    // Use MongoDB (excluding soft-deleted)
    const interviewSession = await InterviewSession.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!interviewSession) {
      throw new AppError('Interview session not found', 404, 'INT_001');
    }
    
    // Check if interview is already completed
    const candidate = await Candidate.findById(interviewSession.candidateId);
    if (candidate && candidate.status === 'completed') {
      throw new AppError('Interview already completed', 400, 'INT_002');
    }
    
    const currentIndex = interviewSession.currentQuestionIndex;
    const currentQuestion = interviewSession.questions[currentIndex];
    
    if (!currentQuestion) {
      throw new AppError('Invalid question index', 400, 'INT_003');
    }
    
    // Save the answer
    currentQuestion.answer = answerText;
    
    // Get AI grading if answer is not empty
    if (answerText.trim()) {
      try {
        const grading = await gradeAnswer(currentQuestion.text, answerText);
        let baseScore = grading.score;
              
        // Apply partial credit if enabled
        baseScore = applyPartialCredit(baseScore, answerText, currentQuestion.text);
              
        // Store base score
        currentQuestion.score = baseScore;
      } catch (gradingError) {
        console.error('Error grading answer with AI, using fallback:', gradingError);
        // Use fallback grading
        currentQuestion.score = fallbackGrade.score;
      }
    }
    
    // Move to next question or complete interview
    if (currentIndex < interviewSession.questions.length - 1) {
      // Move to next question
      interviewSession.currentQuestionIndex += 1;
      
      // Save session
      await interviewSession.save();
      
      // Log audit event
      await logAuditEvent('SUBMIT_ANSWER', 'InterviewSession', interviewSession._id, {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        changes: {
          questionIndex: currentIndex,
          answerLength: answerText.length
        }
      });
      
      // Get next question
      const nextQuestion = interviewSession.questions[interviewSession.currentQuestionIndex];
      
      // Send standardized success response
      res.json(formatSuccessResponse({
        nextQuestion: {
          index: interviewSession.currentQuestionIndex,
          question: nextQuestion
        }
      }, 'Answer submitted successfully'));
    } else {
      // Complete interview using MongoDB transaction for atomicity
      const session = await mongoose.startSession();
      session.startTransaction();
      
      try {
        // Update candidate status within transaction
        const candidate = await Candidate.findById(interviewSession.candidateId).session(session);
        if (candidate) {
          candidate.status = 'completed';
          await candidate.save({ session });
        }
        
        // Commit transaction
        await session.commitTransaction();
        session.endSession();
      } catch (transactionError) {
        // Abort transaction if any error occurs
        await session.abortTransaction();
        session.endSession();
        throw transactionError;
      }
      
      // Calculate overall score with weighted scoring
      const scoreResult = calculateFinalScore(interviewSession.questions);
      
      // Store both base and weighted scores
      interviewSession.score = scoreResult.averageScore;
      interviewSession.weightedScore = scoreResult.weightedAverage;
      interviewSession.scoreBreakdown = scoreResult.breakdown;
      
      // Generate summary using AI
      try {
        interviewSession.summary = await generateSummary(interviewSession.questions);
      } catch (summaryError) {
        console.error('Error generating summary with AI, using fallback:', summaryError);
        interviewSession.summary = fallbackSummary;
      }
      
      await interviewSession.save();
      
      // Send standardized success response
      res.json(formatSuccessResponse({
        finalScore: interviewSession.score,
        summary: interviewSession.summary,
        questions: interviewSession.questions
      }, 'Interview completed'));
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Finalize the interview (if needed for additional processing)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function finalizeInterview(req, res, next) {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      throw new AppError('Missing required field: sessionId', 400, 'VALID_004');
    }
    
    // Check if database is connected
    const isDatabaseConnected = mongoose.connection.readyState === 1;
    
    // If database is not connected, return error
    if (!isDatabaseConnected) {
      throw new AppError('Database connection failed. Please try again later.', 500, 'DB_001');
    }
    
    // Use MongoDB transaction for atomic operations
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Find interview session within transaction (excluding soft-deleted)
      const interviewSession = await InterviewSession.findOne({ _id: sessionId, isDeleted: { $ne: true } }).session(session);
      if (!interviewSession) {
        throw new AppError('Interview session not found', 404, 'INT_001');
      }
      
      // Mark candidate as completed if not already
      const candidate = await Candidate.findById(interviewSession.candidateId).session(session);
      if (candidate && candidate.status !== 'completed') {
        candidate.status = 'completed';
        await candidate.save({ session });
      }
      
      // Commit transaction
      await session.commitTransaction();
      session.endSession();
      
      // Log audit event
      await logAuditEvent('FINALIZE_INTERVIEW', 'InterviewSession', interviewSession._id, {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // Send standardized success response
      res.json(formatSuccessResponse({
        session: interviewSession
      }, 'Interview finalized'));
    } catch (transactionError) {
      // Abort transaction if any error occurs
      await session.abortTransaction();
      session.endSession();
      throw transactionError;
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Get interview session by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getInterviewById(req, res, next) {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid interview session ID format', 400, 'VALID_001');
    }
    
    // Check if database is connected
    const isDatabaseConnected = mongoose.connection.readyState === 1;
    
    // If database is not connected, return error
    if (!isDatabaseConnected) {
      throw new AppError('Database connection failed. Please try again later.', 500, 'DB_001');
    }
    
    // Use MongoDB to find interview session by ID (excluding soft-deleted)
    const interviewSession = await InterviewSession.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!interviewSession) {
      throw new AppError('Interview session not found', 404, 'INT_001');
    }
    
    // Populate candidate data
    await interviewSession.populate('candidateId');
    
    // Send standardized success response
    res.json(formatSuccessResponse({
      session: interviewSession
    }, 'Interview session retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Delete interview session by ID (soft delete)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function deleteInterviewById(req, res, next) {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid interview session ID format', 400, 'VALID_001');
    }
    
    // Check if database is connected
    const isDatabaseConnected = mongoose.connection.readyState === 1;
    
    // If database is not connected, return error
    if (!isDatabaseConnected) {
      throw new AppError('Database connection failed. Please try again later.', 500, 'DB_001');
    }
    
    // Use MongoDB transaction for atomic operations
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Find interview session within transaction (excluding soft-deleted)
      const interviewSession = await InterviewSession.findOne({ _id: id, isDeleted: { $ne: true } }).session(session);
      if (!interviewSession) {
        throw new AppError('Interview session not found', 404, 'INT_001');
      }
      
      // Soft delete the interview session
      interviewSession.isDeleted = true;
      interviewSession.deletedAt = new Date();
      await interviewSession.save({ session });
      
      // Also soft delete the associated candidate
      const candidate = await Candidate.findById(interviewSession.candidateId).session(session);
      if (candidate) {
        candidate.isDeleted = true;
        candidate.deletedAt = new Date();
        await candidate.save({ session });
      }
      
      // Commit transaction
      await session.commitTransaction();
      session.endSession();
      
      // Log audit event
      await logAuditEvent('DELETE_INTERVIEW', 'InterviewSession', interviewSession._id, {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // Send standardized success response
      res.json(formatSuccessResponse(null, 'Interview session deleted successfully'));
    } catch (transactionError) {
      // Abort transaction if any error occurs
      await session.abortTransaction();
      session.endSession();
      throw transactionError;
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Finalize interview session by ID (PATCH /interview/:id/finalize)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function patchInterviewById(req, res, next) {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid interview session ID format', 400, 'VALID_001');
    }
    
    // Check if database is connected
    const isDatabaseConnected = mongoose.connection.readyState === 1;
    
    // If database is not connected, return error
    if (!isDatabaseConnected) {
      throw new AppError('Database connection failed. Please try again later.', 500, 'DB_001');
    }
    
    // Use MongoDB transaction for atomic operations
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Find interview session within transaction (excluding soft-deleted)
      const interviewSession = await InterviewSession.findOne({ _id: id, isDeleted: { $ne: true } }).session(session);
      if (!interviewSession) {
        throw new AppError('Interview session not found', 404, 'INT_001');
      }
      
      // Mark candidate as completed if not already
      const candidate = await Candidate.findById(interviewSession.candidateId).session(session);
      if (candidate && candidate.status !== 'completed') {
        candidate.status = 'completed';
        await candidate.save({ session });
      }
      
      // Commit transaction
      await session.commitTransaction();
      session.endSession();
      
      // Send standardized success response
      res.json(formatSuccessResponse({
        session: interviewSession
      }, 'Interview finalized successfully'));
    } catch (transactionError) {
      // Abort transaction if any error occurs
      await session.abortTransaction();
      session.endSession();
      throw transactionError;
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Adjust a question score manually
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function adjustQuestionScore(req, res, next) {
  try {
    const { id } = req.params; // Get session ID from URL parameter
    const { questionId, newScore, reason } = req.body;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid interview session ID format', 400, 'VALID_001');
    }
    
    // Check if database is connected
    const isDatabaseConnected = mongoose.connection.readyState === 1;
    
    // If database is not connected, return error
    if (!isDatabaseConnected) {
      throw new AppError('Database connection failed. Please try again later.', 500, 'DB_001');
    }
    
    // Use MongoDB (excluding soft-deleted)
    const interviewSession = await InterviewSession.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!interviewSession) {
      throw new AppError('Interview session not found', 404, 'INT_001');
    }
    
    // Find the question by ID
    const questionIndex = interviewSession.questions.findIndex(q => q._id.toString() === questionId);
    if (questionIndex === -1) {
      throw new AppError('Question not found', 404, 'INT_004');
    }
    
    const currentQuestion = interviewSession.questions[questionIndex];
    const currentScore = currentQuestion.score;
    
    // Adjust the score manually
    const adjustedScore = adjustScoreManually(currentScore, newScore, reason, {
      id: req.user ? req.user.id : 'system',
      name: req.user ? req.user.name : 'System'
    });
    
    // Update the question score
    currentQuestion.score = adjustedScore.adjustedScore;
    
    // Add adjustment metadata to the question
    if (!currentQuestion.adjustments) {
      currentQuestion.adjustments = [];
    }
    
    currentQuestion.adjustments.push({
      originalScore: adjustedScore.originalScore,
      adjustedScore: adjustedScore.adjustedScore,
      reason: adjustedScore.reason,
      adjustedBy: adjustedScore.adjustedBy,
      adjustedAt: adjustedScore.adjustedAt,
      isManualAdjustment: adjustedScore.isManualAdjustment
    });
    
    // Recalculate overall score
    const scoreResult = calculateFinalScore(interviewSession.questions);
    interviewSession.score = scoreResult.averageScore;
    interviewSession.weightedScore = scoreResult.weightedAverage;
    interviewSession.scoreBreakdown = scoreResult.breakdown;
    
    // Save the updated session
    await interviewSession.save();
    
    // Log audit event
    await logAuditEvent('ADJUST_SCORE', 'InterviewSession', interviewSession._id, {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      changes: {
        questionId,
        originalScore: currentScore,
        newScore: adjustedScore.adjustedScore,
        reason
      }
    });
    
    // Send standardized success response
    res.json(formatSuccessResponse({
      question: currentQuestion,
      sessionScore: interviewSession.score,
      sessionWeightedScore: interviewSession.weightedScore
    }, 'Question score adjusted successfully'));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  startInterview,
  submitAnswer,
  finalizeInterview,
  getInterviewById,
  deleteInterviewById,
  patchInterviewById,
  adjustQuestionScore
};



