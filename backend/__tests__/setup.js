// Setup file for Jest tests
const mongoose = require('mongoose');

// Set environment variables for testing
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://localhost:27017/ai-interview-test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.OPENAI_API_KEY = 'test-openai-key';

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Close MongoDB connection after all tests
afterAll(async () => {
  await mongoose.connection.close();
});