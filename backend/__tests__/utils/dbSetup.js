// Database setup and teardown utilities for tests
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Candidate = require('../../models/Candidate');
const InterviewSession = require('../../models/InterviewSession');
const { testCandidates, testQuestions } = require('./testData');

let mongoServer;

// Connect to in-memory MongoDB for testing
async function connect() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

// Disconnect from MongoDB
async function disconnect() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
}

// Clear database collections
async function clearDatabase() {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
}

// Seed database with test data
async function seedDatabase() {
  // Clear existing data
  await clearDatabase();
  
  // Insert test candidates
  const candidates = await Candidate.insertMany(testCandidates);
  
  // Create interview sessions for candidates
  const sessions = [];
  for (const candidate of candidates) {
    const session = new InterviewSession({
      candidateId: candidate._id,
      questions: testQuestions.map(q => ({
        ...q,
        answer: '',
        draft: '',
        score: 0
      })),
      currentQuestionIndex: 0
    });
    await session.save();
    sessions.push(session);
  }
  
  return { candidates, sessions };
}

module.exports = {
  connect,
  disconnect,
  clearDatabase,
  seedDatabase
};