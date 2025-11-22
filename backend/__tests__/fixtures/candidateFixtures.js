// Test fixtures for candidate-related tests
const validCandidate = {
  name: 'Test User',
  email: 'test@example.com',
  phone: '+1234567890',
  role: 'Frontend',
  gdprConsent: true
};

const invalidCandidate = {
  name: '',
  email: 'invalid-email',
  phone: '123',
  role: 'InvalidRole',
  gdprConsent: false
};

const candidateWithResume = {
  ...validCandidate,
  resumeText: 'Experienced developer with 5 years in React and Node.js'
};

const candidateWithoutResume = {
  ...validCandidate,
  resumeText: ''
};

module.exports = {
  validCandidate,
  invalidCandidate,
  candidateWithResume,
  candidateWithoutResume
};