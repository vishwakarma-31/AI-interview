// Mock for OpenAI API calls in tests
const mockQuestions = [
  { text: 'What is your experience with JavaScript?', difficulty: 'Medium', time: 90 },
  { text: 'How do you optimize React components?', difficulty: 'Hard', time: 120 },
  { text: 'Describe a challenging project you worked on', difficulty: 'Medium', time: 150 }
];

const mockGrade = {
  score: 85,
  feedback: 'Good answer with clear examples and relevant experience.'
};

const mockSummary = 'Candidate demonstrated strong technical skills and communication abilities.';

// Mock OpenAI service functions
const mockOpenAIService = {
  generateQuestions: jest.fn().mockResolvedValue(mockQuestions),
  gradeAnswer: jest.fn().mockResolvedValue(mockGrade),
  generateSummary: jest.fn().mockResolvedValue(mockSummary)
};

// Mock OpenAI client
const mockOpenAIClient = {
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify(mockQuestions)
          }
        }]
      })
    }
  }
};

module.exports = {
  mockOpenAIService,
  mockOpenAIClient,
  mockQuestions,
  mockGrade,
  mockSummary
};