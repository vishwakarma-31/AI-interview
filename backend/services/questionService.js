const { interview } = require('../config');
const { generateQuestions } = require('./aiService');

/**
 * Question Service
 * Handles question generation, templates, and configuration
 */

// Custom question templates by role
const customQuestionTemplates = {
  'Frontend Developer': [
    {
      text: "Explain the concept of React hooks and their advantages.",
      difficulty: "Medium",
      time: 120,
      category: "Technical",
      tags: ["React", "Frontend", "JavaScript"]
    },
    {
      text: "How would you optimize the performance of a React application?",
      difficulty: "Hard",
      time: 180,
      category: "Technical",
      tags: ["React", "Performance", "Optimization"]
    },
    {
      text: "Describe the difference between state and props in React.",
      difficulty: "Easy",
      time: 90,
      category: "Technical",
      tags: ["React", "Frontend", "Basics"]
    }
  ],
  'Backend Developer': [
    {
      text: "Explain the differences between SQL and NoSQL databases.",
      difficulty: "Medium",
      time: 150,
      category: "Technical",
      tags: ["Database", "Backend", "Architecture"]
    },
    {
      text: "How would you design a scalable REST API?",
      difficulty: "Hard",
      time: 180,
      category: "Technical",
      tags: ["API", "Backend", "Architecture"]
    },
    {
      text: "What is database indexing and when should you use it?",
      difficulty: "Medium",
      time: 120,
      category: "Technical",
      tags: ["Database", "Backend", "Performance"]
    }
  ],
  'Fullstack Developer': [
    {
      text: "How would you implement authentication in a fullstack application?",
      difficulty: "Medium",
      time: 150,
      category: "Technical",
      tags: ["Authentication", "Fullstack", "Security"]
    },
    {
      text: "Explain the concept of microservices and their trade-offs.",
      difficulty: "Hard",
      time: 180,
      category: "Technical",
      tags: ["Architecture", "Microservices", "System Design"]
    }
  ]
};

// Default question templates
const defaultQuestionTemplates = [
  {
    text: "Tell me about a challenging project you worked on.",
    difficulty: "Medium",
    time: 120,
    category: "Behavioral",
    tags: ["Experience", "Problem Solving"]
  },
  {
    text: "How do you approach debugging a complex issue?",
    difficulty: "Medium",
    time: 120,
    category: "Problem Solving",
    tags: ["Debugging", "Problem Solving", "Methodology"]
  },
  {
    text: "Describe a time when you had to work with a difficult team member.",
    difficulty: "Medium",
    time: 120,
    category: "Behavioral",
    tags: ["Teamwork", "Communication", "Conflict Resolution"]
  }
];

/**
 * Generate questions with configurable count and templates
 * @param {string} resumeText - Candidate's resume text
 * @param {string} role - Job role
 * @param {number} questionCount - Number of questions to generate
 * @param {Array} customQuestions - Custom questions to include
 * @returns {Promise<Array>} - Array of generated questions
 */
async function generateConfigurableQuestions(resumeText, role, questionCount, customQuestions = []) {
  try {
    // Use default question count if not specified
    const count = questionCount || interview.defaultQuestionCount;
    
    // Ensure count is within bounds
    const boundedCount = Math.max(
      interview.minQuestionCount,
      Math.min(count, interview.maxQuestionCount)
    );
    
    // Start with custom questions if provided
    let questions = [...customQuestions];
    
    // If we need more questions, generate them using AI
    const remainingCount = boundedCount - questions.length;
    if (remainingCount > 0 && resumeText) {
      // Get role-specific templates or default templates
      const roleTemplates = customQuestionTemplates[role] || defaultQuestionTemplates;
      
      // If we have templates, use them to guide AI generation
      if (roleTemplates.length > 0) {
        // Mix templates with AI-generated questions
        const aiQuestions = await generateQuestions(resumeText, role);
        
        // Combine templates with AI questions
        const templateCount = Math.min(roleTemplates.length, Math.floor(remainingCount / 2));
        const aiCount = remainingCount - templateCount;
        
        // Add template questions
        questions = questions.concat(roleTemplates.slice(0, templateCount));
        
        // Add AI-generated questions
        if (aiCount > 0 && aiQuestions.length > 0) {
          questions = questions.concat(
            aiQuestions.slice(0, Math.min(aiCount, aiQuestions.length))
          );
        }
      } else {
        // Generate all questions using AI
        const aiQuestions = await generateQuestions(resumeText, role);
        questions = questions.concat(
          aiQuestions.slice(0, Math.min(remainingCount, aiQuestions.length))
        );
      }
    }
    
    // Ensure we have the right number of questions
    if (questions.length > boundedCount) {
      questions = questions.slice(0, boundedCount);
    }
    
    // Apply difficulty calibration and categorization
    questions = questions.map(question => ({
      ...question,
      category: question.category || 'Technical',
      tags: question.tags || [],
      isCustom: question.isCustom || false,
      weight: calculateQuestionWeight(question.difficulty)
    }));
    
    return questions;
  } catch (error) {
    throw new Error(`Failed to generate configurable questions: ${error.message}`);
  }
}

/**
 * Calculate question weight based on difficulty
 * @param {string} difficulty - Question difficulty
 * @returns {number} - Weight multiplier
 */
function calculateQuestionWeight(difficulty) {
  const weights = interview.scoring.weightedScoring;
  
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return weights.easy;
    case 'medium':
      return weights.medium;
    case 'hard':
      return weights.hard;
    default:
      return 1.0;
  }
}

/**
 * Apply difficulty calibration to questions
 * @param {Array} questions - Array of questions
 * @returns {Array} - Calibrated questions
 */
function calibrateDifficulty(questions) {
  // Apply difficulty distribution if needed
  const distribution = interview.difficultyDistribution;
  
  // For now, we'll just ensure questions have proper time limits based on difficulty
  return questions.map(question => {
    if (!question.time) {
      const timeLimits = interview.defaultTimeLimits;
      switch (question.difficulty.toLowerCase()) {
        case 'easy':
          question.time = timeLimits.easy;
          break;
        case 'medium':
          question.time = timeLimits.medium;
          break;
        case 'hard':
          question.time = timeLimits.hard;
          break;
        default:
          question.time = timeLimits.medium;
      }
    }
    return question;
  });
}

/**
 * Add custom questions to an interview
 * @param {Array} existingQuestions - Existing questions
 * @param {Array} newCustomQuestions - New custom questions to add
 * @returns {Array} - Combined questions with custom flags
 */
function addCustomQuestions(existingQuestions, newCustomQuestions) {
  // Mark new questions as custom
  const markedCustomQuestions = newCustomQuestions.map(q => ({
    ...q,
    isCustom: true
  }));
  
  return [...existingQuestions, ...markedCustomQuestions];
}

module.exports = {
  generateConfigurableQuestions,
  calibrateDifficulty,
  addCustomQuestions,
  customQuestionTemplates,
  defaultQuestionTemplates
};