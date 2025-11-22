// Test data for seeding database in tests
const testCandidates = [
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    resumeText: 'Experienced software developer with 5 years of experience in React and Node.js',
    role: 'Frontend',
    status: 'pending',
    gdprConsent: true
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+1987654321',
    resumeText: 'Backend developer specializing in Python and Django',
    role: 'Backend',
    status: 'in-progress',
    gdprConsent: true
  }
];

const testQuestions = [
  {
    text: 'Tell me about yourself',
    difficulty: 'Easy',
    time: 60
  },
  {
    text: 'What is your experience with React?',
    difficulty: 'Medium',
    time: 90
  },
  {
    text: 'How do you handle complex state management?',
    difficulty: 'Hard',
    time: 120
  }
];

module.exports = {
  testCandidates,
  testQuestions
};