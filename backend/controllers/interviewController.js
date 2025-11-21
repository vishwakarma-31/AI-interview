const Candidate = require('../models/Candidate');
const InterviewSession = require('../models/InterviewSession');
const { parsePDF, parseDOCX, generateQuestions, gradeAnswer, generateSummary } = require('../services/aiService');
const path = require('path');
const { setInMemoryStorage } = require('./candidateController');
const mongoose = require('mongoose');

// In-memory storage for demonstration purposes when MongoDB is not available
let inMemoryCandidates = [];
let inMemorySessions = [];
let nextId = 1;

// Set the in-memory storage in candidate controller
setInMemoryStorage(inMemoryCandidates, inMemorySessions);

function generateId() {
  return `id_${nextId++}`;
}

/**
 * Start a new interview session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function startInterview(req, res) {
  try {
    const { name, email, phone, role } = req.body;
    
    // Validate required fields
    if (!name || !email || !phone || !role) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, email, phone, role' 
      });
    }
    
    let resumeText = '';
    
    // Process resume if uploaded
    if (req.file) {
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      
      if (fileExtension === '.pdf') {
        resumeText = await parsePDF(req.file.buffer);
      } else if (fileExtension === '.docx') {
        resumeText = await parseDOCX(req.file.buffer);
      } else {
        return res.status(400).json({ 
          error: 'Invalid file format. Only PDF and DOCX files are supported.' 
        });
      }
    }
    
    // Check if database is connected
    const isDatabaseConnected = mongoose.connection.readyState === 1;
    
    let candidate, interviewSession;
    
    if (isDatabaseConnected) {
      // Use MongoDB
      candidate = new Candidate({
        name,
        email,
        phone,
        resumeText,
        role,
        status: 'in-progress'
      });
      
      await candidate.save();
      
      // Generate questions using AI
      let questions = [];
      if (resumeText) {
        questions = await generateQuestions(resumeText, role);
      }
      
      // If AI failed or no resume, use default questions
      if (!questions || questions.length === 0) {
        questions = [
          { text: 'Tell me about yourself', difficulty: 'Easy', time: 60 },
          { text: 'What interests you about this role?', difficulty: 'Medium', time: 90 },
          { text: 'Where do you see yourself in 5 years?', difficulty: 'Hard', time: 120 }
        ];
      }
      
      // Create interview session
      interviewSession = new InterviewSession({
        candidateId: candidate._id,
        questions: questions.map(q => ({
          ...q,
          answer: '',
          draft: '',
          score: 0
        })),
        currentQuestionIndex: 0
      });
      
      await interviewSession.save();
      
      // Populate candidate data for response
      await interviewSession.populate('candidateId');
    } else {
      // Use in-memory storage
      const candidateId = generateId();
      candidate = {
        _id: candidateId,
        name,
        email,
        phone,
        resumeText,
        role,
        status: 'in-progress',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      inMemoryCandidates.push(candidate);
      
      // Generate questions using AI
      let questions = [];
      if (resumeText) {
        try {
          questions = await generateQuestions(resumeText, role);
        } catch (error) {
          console.error('Error generating questions:', error);
        }
      }
      
      // If AI failed or no resume, use default questions
      if (!questions || questions.length === 0) {
        questions = [
          { text: 'Tell me about yourself', difficulty: 'Easy', time: 60 },
          { text: 'What interests you about this role?', difficulty: 'Medium', time: 90 },
          { text: 'Where do you see yourself in 5 years?', difficulty: 'Hard', time: 120 }
        ];
      }
      
      const sessionId = generateId();
      interviewSession = {
        _id: sessionId,
        candidateId,
        questions: questions.map(q => ({
          ...q,
          answer: '',
          draft: '',
          score: 0
        })),
        currentQuestionIndex: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      inMemorySessions.push(interviewSession);
    }
    
    res.status(201).json({
      message: 'Interview started successfully',
      candidate: candidate,
      session: {
        id: interviewSession._id,
        questions: interviewSession.questions,
        currentQuestionIndex: interviewSession.currentQuestionIndex
      }
    });
  } catch (error) {
    console.error('Error starting interview:', error);
    res.status(500).json({ 
      error: 'Failed to start interview',
      details: error.message 
    });
  }
}

/**
 * Submit an answer and get the next question
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function submitAnswer(req, res) {
  try {
    const { sessionId, answerText } = req.body;
    
    if (!sessionId || answerText === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: sessionId, answerText' 
      });
    }
    
    // Check if database is connected
    const isDatabaseConnected = mongoose.connection.readyState === 1;
    
    let interviewSession;
    
    if (isDatabaseConnected) {
      // Use MongoDB
      interviewSession = await InterviewSession.findById(sessionId);
      if (!interviewSession) {
        return res.status(404).json({ error: 'Interview session not found' });
      }
      
      // Check if interview is already completed
      const candidate = await Candidate.findById(interviewSession.candidateId);
      if (candidate && candidate.status === 'completed') {
        return res.status(400).json({ error: 'Interview already completed' });
      }
    } else {
      // Use in-memory storage
      interviewSession = inMemorySessions.find(s => s._id === sessionId);
      if (!interviewSession) {
        return res.status(404).json({ error: 'Interview session not found' });
      }
      
      const candidate = inMemoryCandidates.find(c => c._id === interviewSession.candidateId);
      if (candidate && candidate.status === 'completed') {
        return res.status(400).json({ error: 'Interview already completed' });
      }
    }
    
    const currentIndex = interviewSession.currentQuestionIndex;
    const currentQuestion = interviewSession.questions[currentIndex];
    
    if (!currentQuestion) {
      return res.status(400).json({ error: 'Invalid question index' });
    }
    
    // Save the answer
    currentQuestion.answer = answerText;
    
    // Get AI grading if answer is not empty
    if (answerText.trim()) {
      try {
        const grading = await gradeAnswer(currentQuestion.text, answerText);
        currentQuestion.score = grading.score;
      } catch (gradingError) {
        console.error('Error grading answer:', gradingError);
        // Continue with default score of 0 if grading fails
      }
    }
    
    // Move to next question or complete interview
    if (currentIndex < interviewSession.questions.length - 1) {
      // Move to next question
      interviewSession.currentQuestionIndex += 1;
      
      // Save session (if using MongoDB)
      if (isDatabaseConnected) {
        await interviewSession.save();
      }
      
      // Get next question
      const nextQuestion = interviewSession.questions[interviewSession.currentQuestionIndex];
      
      res.json({
        message: 'Answer submitted successfully',
        nextQuestion: {
          index: interviewSession.currentQuestionIndex,
          question: nextQuestion
        }
      });
    } else {
      // Complete interview
      if (isDatabaseConnected) {
        // Using MongoDB
        const candidate = await Candidate.findById(interviewSession.candidateId);
        if (candidate) {
          candidate.status = 'completed';
          await candidate.save();
        }
        
        // Calculate overall score
        const totalScore = interviewSession.questions.reduce((sum, q) => sum + q.score, 0);
        const averageScore = interviewSession.questions.length > 0 ? 
          Math.round(totalScore / interviewSession.questions.length) : 0;
        
        interviewSession.score = averageScore;
        
        // Generate summary using AI
        try {
          interviewSession.summary = await generateSummary(interviewSession.questions);
        } catch (summaryError) {
          console.error('Error generating summary:', summaryError);
          interviewSession.summary = 'Interview completed';
        }
        
        await interviewSession.save();
      } else {
        // Using in-memory storage
        const candidate = inMemoryCandidates.find(c => c._id === interviewSession.candidateId);
        if (candidate) {
          candidate.status = 'completed';
        }
        
        // Calculate overall score
        const totalScore = interviewSession.questions.reduce((sum, q) => sum + q.score, 0);
        const averageScore = interviewSession.questions.length > 0 ? 
          Math.round(totalScore / interviewSession.questions.length) : 0;
        
        interviewSession.score = averageScore;
        
        // Generate summary using AI
        try {
          interviewSession.summary = await generateSummary(interviewSession.questions);
        } catch (summaryError) {
          console.error('Error generating summary:', summaryError);
          interviewSession.summary = 'Interview completed';
        }
      }
      
      res.json({
        message: 'Interview completed',
        finalScore: interviewSession.score,
        summary: interviewSession.summary,
        questions: interviewSession.questions
      });
    }
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ 
      error: 'Failed to submit answer',
      details: error.message 
    });
  }
}

/**
 * Finalize the interview (if needed for additional processing)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function finalizeInterview(req, res) {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing required field: sessionId' });
    }
    
    // Check if database is connected
    const isDatabaseConnected = mongoose.connection.readyState === 1;
    
    let interviewSession;
    
    if (isDatabaseConnected) {
      // Use MongoDB
      interviewSession = await InterviewSession.findById(sessionId);
      if (!interviewSession) {
        return res.status(404).json({ error: 'Interview session not found' });
      }
      
      // Mark candidate as completed if not already
      const candidate = await Candidate.findById(interviewSession.candidateId);
      if (candidate && candidate.status !== 'completed') {
        candidate.status = 'completed';
        await candidate.save();
      }
    } else {
      // Use in-memory storage
      interviewSession = inMemorySessions.find(s => s._id === sessionId);
      if (!interviewSession) {
        return res.status(404).json({ error: 'Interview session not found' });
      }
      
      const candidate = inMemoryCandidates.find(c => c._id === interviewSession.candidateId);
      if (candidate && candidate.status !== 'completed') {
        candidate.status = 'completed';
      }
    }
    
    res.json({
      message: 'Interview finalized',
      session: interviewSession
    });
  } catch (error) {
    console.error('Error finalizing interview:', error);
    res.status(500).json({ 
      error: 'Failed to finalize interview',
      details: error.message 
    });
  }
}

module.exports = {
  startInterview,
  submitAnswer,
  finalizeInterview
};