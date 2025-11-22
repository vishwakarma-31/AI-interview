// Unit tests for candidate controller
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const candidateController = require('../../controllers/candidateController');
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

// Mock the audit logger
jest.mock('../../utils/auditLogger', () => ({
  logAuditEvent: jest.fn().mockResolvedValue()
}));

describe('Candidate Controller', () => {
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
    app.get('/candidates', candidateController.getAllCandidates);
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

  describe('getAllCandidates', () => {
    it('should return empty array when no candidates exist', async () => {
      const response = await request(app)
        .get('/candidates')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.candidates).toEqual([]);
      expect(response.body.data.pagination.totalCandidates).toBe(0);
    });

    it('should return candidates when they exist', async () => {
      // Create test candidates
      const candidate1 = new Candidate({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        role: 'Frontend',
        status: 'pending',
        gdprConsent: true
      });
      await candidate1.save();

      const candidate2 = new Candidate({
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1987654321',
        role: 'Backend',
        status: 'in-progress',
        gdprConsent: true
      });
      await candidate2.save();

      const response = await request(app)
        .get('/candidates')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.candidates).toHaveLength(2);
      expect(response.body.data.pagination.totalCandidates).toBe(2);
    });

    it('should filter candidates by status', async () => {
      // Create test candidates with different statuses
      const candidate1 = new Candidate({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        role: 'Frontend',
        status: 'pending',
        gdprConsent: true
      });
      await candidate1.save();

      const candidate2 = new Candidate({
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1987654321',
        role: 'Backend',
        status: 'in-progress',
        gdprConsent: true
      });
      await candidate2.save();

      const response = await request(app)
        .get('/candidates?status=pending')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.candidates).toHaveLength(1);
      expect(response.body.data.candidates[0].name).toBe('John Doe');
    });
  });
});