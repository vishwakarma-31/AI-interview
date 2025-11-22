// Test fixtures for interview-related tests
const validInterviewStart = {
  name: 'Test User',
  email: 'test@example.com',
  phone: '+1234567890',
  role: 'Frontend',
  gdprConsent: true
};

const validAnswerSubmission = {
  answerText: 'This is a sample answer to the interview question.'
};

const invalidAnswerSubmission = {
  answerText: 'Short' // Less than 10 characters
};

const validInterviewSession = {
  questions: [
    { text: 'Tell me about yourself', difficulty: 'Easy', time: 60 },
    { text: 'What is your experience with React?', difficulty: 'Medium', time: 90 }
  ],
  currentQuestionIndex: 0
};

module.exports = {
  validInterviewStart,
  validAnswerSubmission,
  invalidAnswerSubmission,
  validInterviewSession
};