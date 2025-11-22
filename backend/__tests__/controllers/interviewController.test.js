// Unit tests for interview controller
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const interviewController = require('../../controllers/interviewController');
const Candidate = require('../../models/Candidate');
const InterviewSession = require('../../models/InterviewSession');

// Mock the error handler middleware
jest.mock('../../middleware/errorHandler', () => ({
  AppError: jest.fn().mockImplementation((message, statusCode, errorCode) => {
    return new Error(message);
  }),
  formatSuccessResponse: jest.fn().mockImplementation((data, message) => {
    return { success: true, data, message };
  })
}));

// Mock the AI service
jest.mock('../../services/aiService', () => ({
  parsePDF: jest.fn().mockResolvedValue('Parsed PDF content'),
  parseDOCX: jest.fn().mockResolvedValue('Parsed DOCX content'),
  generateQuestions: jest.fn().mockResolvedValue([
    { text: 'Question 1', difficulty: 'Easy', time: 60 },
    { text: 'Question 2', difficulty: 'Medium', time: 90 }
  ]),
  gradeAnswer: jest.fn().mockResolvedValue({ score: 80, feedback: 'Good answer' }),
  generateSummary: jest.fn().mockResolvedValue('Summary of the interview'),
  fallbackQuestions: [
    { text: 'Fallback Question 1', difficulty: 'Easy', time: 60 },
    { text: 'Fallback Question 2', difficulty: 'Medium', time: 90 }
  ],
  fallbackGrade: { score: 50, feedback: 'Fallback grading' },
  fallbackSummary: 'Fallback summary'
}));

// Mock the audit logger
jest.mock('../../utils/auditLogger', () => ({
  logAuditEvent: jest.fn().mockResolvedValue()
}));

describe('Interview Controller', () => {
  let mongoServer;
  let app;

  beforeAll(async () => {
    // Create in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Create express app for testing
    app = express();
    app.use(express.json());
    
    // Mock routes
    app.post('/interview/start', interviewController.startInterview);
    app.post('/interview/:id/answer', interviewController.submitAnswer);
    app.patch('/interview/:id/finalize', interviewController.patchInterviewById);
    app.delete('/interview/:id', interviewController.deleteInterviewById);
  });

  afterAll(async () => {
    // Disconnect and stop the in-memory server
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear database before each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  describe('startInterview', () => {
    it('should start a new interview session', async () => {
      const interviewData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        role: 'Frontend',
        gdprConsent: true
      };

      const response = await request(app)
        .post('/interview/start')
        .send(interviewData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.candidate.name).toBe('John Doe');
      expect(response.body.data.session.questions).toHaveLength(2);
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        name: '',
        email: 'invalid-email',
        phone: '123',
        role: 'InvalidRole'
      };

      const response = await request(app)
        .post('/interview/start')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('submitAnswer', () => {
    it('should submit an answer and move to the next question', async () => {
      // First create a candidate and session
      const candidate = new Candidate({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        role: 'Frontend',
        status: 'in-progress',
        gdprConsent: true
      });
      await candidate.save();

      const session = new InterviewSession({
        candidateId: candidate._id,
        questions: [
          {
            text: 'Question 1',
            difficulty: 'Easy',
            time: 60
          },
          {
            text: 'Question 2',
            difficulty: 'Medium',
            time: 90
          }
        ],
        currentQuestionIndex: 0
      });
      await session.save();

      const answerData = {
        answerText: 'This is a comprehensive answer to the interview question that exceeds the minimum character requirement.'
      };

      const response = await request(app)
        .post(`/interview/${session._id}/answer`)
        .send(answerData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nextQuestion.index).toBe(1);
    });

    it('should handle invalid answer length', async () => {
      // First create a candidate and session
      const candidate = new Candidate({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        role: 'Frontend',
        status: 'in-progress',
        gdprConsent: true
      });
      await candidate.save();

      const session = new InterviewSession({
        candidateId: candidate._id,
        questions: [
          {
            text: 'Question 1',
            difficulty: 'Easy',
            time: 60
          }
        ],
        currentQuestionIndex: 0
      });
      await session.save();

      const answerData = {
        answerText: 'Short'
      };

      const response = await request(app)
        .post(`/interview/${session._id}/answer`)
        .send(answerData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('patchInterviewById', () => {
    it('should finalize an interview session', async () => {
      // First create a candidate and session
      const candidate = new Candidate({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        role: 'Frontend',
        status: 'in-progress',
        gdprConsent: true
      });
      await candidate.save();

      const session = new InterviewSession({
        candidateId: candidate._id,
        questions: [
          {
            text: 'Question 1',
            difficulty: 'Easy',
            time: 60,
            answer: 'This is my answer',
            score: 80
          }
        ],
        currentQuestionIndex: 1,
        status: 'in-progress'
      });
      await session.save();

      const response = await request(app)
        .patch(`/interview/${session._id}/finalize`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.session.status).toBe('completed');
    });
  });

  describe('deleteInterviewById', () => {
    it('should delete an interview session', async () => {
      // First create a candidate and session
      const candidate = new Candidate({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        role: 'Frontend',
        status: 'in-progress',
        gdprConsent: true
      });
      await candidate.save();

      const session = new InterviewSession({
        candidateId: candidate._id,
        questions: [
          {
            text: 'Question 1',
            difficulty: 'Easy',
            time: 60
          }
        ],
        currentQuestionIndex: 0
      });
      await session.save();

      const response = await request(app)
        .delete(`/interview/${session._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Verify the session is soft deleted
      const deletedSession = await InterviewSession.findById(session._id);
      expect(deletedSession.isDeleted).toBe(true);
    });
  });
});