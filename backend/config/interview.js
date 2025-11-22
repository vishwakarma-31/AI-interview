// Interview configuration settings
module.exports = {
  // Default question count per interview
  defaultQuestionCount: parseInt(process.env.DEFAULT_QUESTION_COUNT) || 5,
  
  // Maximum question count allowed
  maxQuestionCount: parseInt(process.env.MAX_QUESTION_COUNT) || 20,
  
  // Minimum question count allowed
  minQuestionCount: parseInt(process.env.MIN_QUESTION_COUNT) || 1,
  
  // Question difficulty distribution (percentages)
  difficultyDistribution: {
    easy: parseInt(process.env.EASY_QUESTION_PERCENTAGE) || 30,
    medium: parseInt(process.env.MEDIUM_QUESTION_PERCENTAGE) || 50,
    hard: parseInt(process.env.HARD_QUESTION_PERCENTAGE) || 20
  },
  
  // Default time limits for questions (in seconds)
  defaultTimeLimits: {
    easy: parseInt(process.env.EASY_QUESTION_TIME) || 60,
    medium: parseInt(process.env.MEDIUM_QUESTION_TIME) || 120,
    hard: parseInt(process.env.HARD_QUESTION_TIME) || 180
  },
  
  // Scoring settings
  scoring: {
    // Maximum score per question
    maxScorePerQuestion: parseInt(process.env.MAX_SCORE_PER_QUESTION) || 100,
    
    // Minimum score per question
    minScorePerQuestion: parseInt(process.env.MIN_SCORE_PER_QUESTION) || 0,
    
    // Partial credit settings
    partialCreditEnabled: process.env.PARTIAL_CREDIT_ENABLED === 'true' || false,
    
    // Weighted scoring by difficulty
    weightedScoring: {
      easy: parseFloat(process.env.EASY_QUESTION_WEIGHT) || 1.0,
      medium: parseFloat(process.env.MEDIUM_QUESTION_WEIGHT) || 1.2,
      hard: parseFloat(process.env.HARD_QUESTION_WEIGHT) || 1.5
    }
  },
  
  // Question categories/tags
  defaultCategories: [
    'Technical',
    'Behavioral',
    'Problem Solving',
    'Communication',
    'Leadership'
  ],
  
  // Roles beyond Frontend/Backend
  additionalRoles: [
    'Fullstack Developer',
    'DevOps Engineer',
    'Data Scientist',
    'Product Manager',
    'UI/UX Designer',
    'QA Engineer',
    'Mobile Developer'
  ],
  
  // Timezone settings
  defaultTimezone: process.env.DEFAULT_TIMEZONE || 'UTC',
  
  // Multi-language support
  supportedLanguages: process.env.SUPPORTED_LANGUAGES ? 
    process.env.SUPPORTED_LANGUAGES.split(',') : 
    ['en', 'es', 'fr', 'de', 'zh']
};