// Integration tests for API endpoints
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const candidateRoutes = require('../../routes/candidateRoutes');
const interviewRoutes = require('../../routes/interviewRoutes');

// Mock the error handler middleware
jest.mock('../../middleware/errorHandler', () => ({
  AppError: jest.fn().mockImplementation((message, statusCode, errorCode) => {
    return new Error(message);
  }),
  formatSuccessResponse: jest.fn().mockImplementation((data, message, statusCode = 200) => {
    return { success: true, data, message, statusCode };
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

describe('API Integration Tests', () => {
  let mongoServer;
  let app;
  let server;

  beforeAll(async () => {
    // Create in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Create express app
    app = express();
    app.use(helmet());
    app.use(cors());
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Register routes
    app.use('/api/v1/candidates', candidateRoutes);
    app.use('/api/v1/interview', interviewRoutes);
    
    // Start server on a random port
    server = app.listen(0);
  });

  afterAll(async () => {
    // Close server and disconnect from database
    server.close();
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

  describe('Candidate API', () => {
    it('should get all candidates with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/candidates')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.candidates).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter candidates by status', async () => {
      const response = await request(app)
        .get('/api/v1/candidates?status=pending')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.candidates).toBeDefined();
    });

    it('should sort candidates by name', async () => {
      const response = await request(app)
        .get('/api/v1/candidates?sortBy=name&order=asc')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.candidates).toBeDefined();
    });
  });

  describe('Interview API', () => {
    it('should start a new interview session', async () => {
      const interviewData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        role: 'Frontend',
        gdprConsent: true
      };

      const response = await request(app)
        .post('/api/v1/interview/start')
        .send(interviewData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.candidate.name).toBe('John Doe');
      expect(response.body.data.session.questions).toHaveLength(2);
    });

    it('should submit an answer to an interview question', async () => {
      // First start an interview to get a session ID
      const interviewData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        role: 'Frontend',
        gdprConsent: true
      };

      const startResponse = await request(app)
        .post('/api/v1/interview/start')
        .send(interviewData);

      const sessionId = startResponse.body.data.session.id;
      const answerData = {
        answerText: 'This is a comprehensive answer to the interview question that exceeds the minimum character requirement.'
      };

      const response = await request(app)
        .post(`/api/v1/interview/${sessionId}/answer`)
        .send(answerData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nextQuestion).toBeDefined();
    });

    it('should finalize an interview session', async () => {
      // First start an interview to get a session ID
      const interviewData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        role: 'Frontend',
        gdprConsent: true
      };

      const startResponse = await request(app)
        .post('/api/v1/interview/start')
        .send(interviewData);

      const sessionId = startResponse.body.data.session.id;

      const response = await request(app)
        .patch(`/api/v1/interview/${sessionId}/finalize`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.session).toBeDefined();
    });

    it('should delete an interview session', async () => {
      // First start an interview to get a session ID
      const interviewData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        role: 'Frontend',
        gdprConsent: true
      };

      const startResponse = await request(app)
        .post('/api/v1/interview/start')
        .send(interviewData);

      const sessionId = startResponse.body.data.session.id;

      const response = await request(app)
        .delete(`/api/v1/interview/${sessionId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('API Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/v1/non-existent')
        .expect(404);

      // The response format depends on how the error handler is implemented
      // This test might need to be adjusted based on the actual implementation
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        name: '',
        email: 'invalid-email',
        phone: '123',
        role: 'InvalidRole'
      };

      const response = await request(app)
        .post('/api/v1/interview/start')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});