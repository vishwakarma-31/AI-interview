const { interview } = require('../config');

/**
 * Scoring Service
 * Handles scoring algorithms, partial credit, and weighted scoring
 */

/**
 * Calculate weighted score based on question difficulty and weight
 * @param {number} baseScore - Base score from AI grading
 * @param {string} difficulty - Question difficulty (Easy, Medium, Hard)
 * @param {number} weight - Question weight multiplier
 * @returns {number} - Weighted score
 */
function calculateWeightedScore(baseScore, difficulty, weight = 1.0) {
  // Get weight multiplier from config
  const weights = interview.scoring.weightedScoring;
  
  let difficultyMultiplier = 1.0;
  switch (difficulty.toLowerCase()) {
    case 'easy':
      difficultyMultiplier = weights.easy;
      break;
    case 'medium':
      difficultyMultiplier = weights.medium;
      break;
    case 'hard':
      difficultyMultiplier = weights.hard;
      break;
  }
  
  // Apply both difficulty and custom weight multipliers
  const weightedScore = baseScore * difficultyMultiplier * weight;
  
  // Ensure score is within bounds
  return Math.max(
    interview.scoring.minScorePerQuestion,
    Math.min(weightedScore, interview.scoring.maxScorePerQuestion)
  );
}

/**
 * Apply partial credit to a score based on answer completeness
 * @param {number} baseScore - Base score from AI grading
 * @param {string} answer - Candidate's answer
 * @param {string} question - Interview question
 * @returns {number} - Score with partial credit applied
 */
function applyPartialCredit(baseScore, answer, question) {
  if (!interview.scoring.partialCreditEnabled) {
    return baseScore;
  }
  
  // Calculate answer completeness based on length and content
  const answerLength = answer.trim().length;
  const minExpectedLength = 50; // Minimum expected answer length
  const maxExpectedLength = 500; // Maximum expected answer length
  
  // Calculate completeness ratio
  let completeness = 1.0;
  if (answerLength < minExpectedLength) {
    // If answer is too short, reduce score proportionally
    completeness = Math.max(0.1, answerLength / minExpectedLength);
  } else if (answerLength > maxExpectedLength) {
    // If answer is too long, it might be rambling - reduce score slightly
    completeness = Math.min(1.0, maxExpectedLength / answerLength * 1.1);
  }
  
  // Apply partial credit
  return Math.round(baseScore * completeness);
}

/**
 * Calculate final interview score with weighted scoring
 * @param {Array} questions - Array of questions with scores
 * @returns {Object} - Object containing total score, average score, and breakdown
 */
function calculateFinalScore(questions) {
  if (!questions || questions.length === 0) {
    return {
      totalScore: 0,
      averageScore: 0,
      weightedTotal: 0,
      weightedAverage: 0,
      breakdown: []
    };
  }
  
  // Calculate scores for each question
  const breakdown = questions.map(question => {
    const baseScore = question.score || 0;
    const weightedScore = calculateWeightedScore(
      baseScore, 
      question.difficulty, 
      question.weight
    );
    
    return {
      questionId: question._id,
      baseScore,
      weightedScore,
      difficulty: question.difficulty,
      weight: question.weight,
      category: question.category
    };
  });
  
  // Calculate totals
  const totalBaseScore = breakdown.reduce((sum, item) => sum + item.baseScore, 0);
  const totalWeightedScore = breakdown.reduce((sum, item) => sum + item.weightedScore, 0);
  
  // Calculate averages
  const averageBaseScore = Math.round(totalBaseScore / questions.length);
  const averageWeightedScore = Math.round(totalWeightedScore / questions.length);
  
  return {
    totalScore: totalBaseScore,
    averageScore: averageBaseScore,
    weightedTotal: totalWeightedScore,
    weightedAverage: averageWeightedScore,
    breakdown
  };
}

/**
 * Adjust score manually with audit trail
 * @param {number} currentScore - Current score
 * @param {number} newScore - New score to set
 * @param {string} reason - Reason for adjustment
 * @param {Object} user - User making the adjustment
 * @returns {Object} - Adjusted score with metadata
 */
function adjustScoreManually(currentScore, newScore, reason, user) {
  // Validate score bounds
  const validatedScore = Math.max(
    interview.scoring.minScorePerQuestion,
    Math.min(newScore, interview.scoring.maxScorePerQuestion)
  );
  
  return {
    originalScore: currentScore,
    adjustedScore: validatedScore,
    reason: reason,
    adjustedBy: user,
    adjustedAt: new Date(),
    isManualAdjustment: true
  };
}

/**
 * Generate scoring rubric explanation
 * @param {number} score - Score to explain
 * @param {string} difficulty - Question difficulty
 * @returns {string} - Explanation of scoring
 */
function generateScoringRubric(score, difficulty) {
  const maxScore = interview.scoring.maxScorePerQuestion;
  const minScore = interview.scoring.minScorePerQuestion;
  
  let explanation = '';
  
  if (score >= maxScore * 0.9) {
    explanation = 'Excellent response with comprehensive coverage of the topic';
  } else if (score >= maxScore * 0.7) {
    explanation = 'Good response with minor gaps in coverage';
  } else if (score >= maxScore * 0.5) {
    explanation = 'Adequate response with several gaps';
  } else if (score >= maxScore * 0.3) {
    explanation = 'Poor response with significant gaps';
  } else {
    explanation = 'Insufficient response with minimal relevant content';
  }
  
  // Add difficulty context
  explanation += ` (${difficulty} difficulty question)`;
  
  return explanation;
}

module.exports = {
  calculateWeightedScore,
  applyPartialCredit,
  calculateFinalScore,
  adjustScoreManually,
  generateScoringRubric
};