const OpenAI = require('openai');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const xss = require('xss');
const { questionQueue, gradingQueue, summaryQueue } = require('./queueService');

// Initialize OpenAI client with timeout and retry configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 seconds timeout
  maxRetries: 3, // Retry up to 3 times
});

// Cost tracking
let totalCost = 0;
const COST_PER_1K_TOKENS = {
  'gpt-3.5-turbo': 0.002, // $0.002 per 1K tokens
  'gpt-4': 0.03 // $0.03 per 1K tokens
};

function trackCost(model, promptTokens, completionTokens) {
  const costPer1K = COST_PER_1K_TOKENS[model] || 0.002;
  const totalTokens = promptTokens + completionTokens;
  const cost = (totalTokens / 1000) * costPer1K;
  totalCost += cost;
  
  console.log(`OpenAI API call cost: $${cost.toFixed(6)} (Model: ${model}, Tokens: ${totalTokens})`);
  console.log(`Total OpenAI cost: $${totalCost.toFixed(6)}`);
  
  return cost;
}

function getTotalCost() {
  return totalCost;
}

// Sanitize input to prevent injection
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  // Remove potentially dangerous characters and patterns
  let sanitized = input;
  
  // Remove script tags and other potentially dangerous HTML
  sanitized = xss(sanitized);
  
  // Remove common injection patterns
  sanitized = sanitized.replace(/\$\{.*?\}/g, ''); // Template literals
  sanitized = sanitized.replace(/\b(?:eval|exec|system|shell)\b/gi, ''); // Dangerous functions
  sanitized = sanitized.replace(/\b(?:drop|delete|update|insert|create)\b/gi, ''); // SQL keywords
  
  // Limit length
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000);
  }
  
  return sanitized;
}

// Retry function with exponential backoff
async function retryWithBackoff(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    
    // Wait for delay before retrying
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Retry with exponential backoff (double the delay each time)
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}

/**
 * Parse resume text from PDF file
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<string>} - Extracted text from PDF
 */
async function parsePDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    throw new Error('Failed to parse PDF file: ' + error.message);
  }
}

/**
 * Parse resume text from DOCX file
 * @param {Buffer} buffer - DOCX file buffer
 * @returns {Promise<string>} - Extracted text from DOCX
 */
async function parseDOCX(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    throw new Error('Failed to parse DOCX file: ' + error.message);
  }
}

/**
 * Generate interview questions based on resume text and job role
 * @param {string} resumeText - Parsed resume text
 * @param {string} role - Job role (Frontend, Backend, etc.)
 * @returns {Promise<Array>} - Array of generated questions
 */
async function generateQuestions(resumeText, role) {
  try {
    // Sanitize inputs
    const sanitizedResumeText = sanitizeInput(resumeText);
    const sanitizedRole = sanitizeInput(role);
    
    // Limit resume text to prevent token overflow
    const maxResumeLength = 3000;
    const limitedResumeText = sanitizedResumeText.length > maxResumeLength 
      ? sanitizedResumeText.substring(0, maxResumeLength) + '... [truncated]'
      : sanitizedResumeText;
    
    // Add job to queue
    const job = await questionQueue.add('generateQuestions', {
      resumeText: limitedResumeText,
      role: sanitizedRole
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      }
    });
    
    // Wait for job completion
    const result = await job.waitUntilFinished(questionQueue.events);
    
    // Shuffle questions to randomize order
    if (result.questions && Array.isArray(result.questions)) {
      return shuffleArray(result.questions);
    }
    
    return result.questions;
  } catch (error) {
    // Handle token limit errors
    if (error.message.includes('token') || error.message.includes('limit')) {
      console.error('Token limit error in generateQuestions:', error.message);
      throw new Error('The resume is too long to process. Please provide a shorter resume.');
    }
    throw new Error('Failed to generate questions: ' + error.message);
  }
}

/**
 * Grade candidate's answer and provide feedback
 * @param {string} question - Interview question
 * @param {string} answer - Candidate's answer
 * @returns {Promise<Object>} - Score and feedback
 */
async function gradeAnswer(question, answer) {
  try {
    // Sanitize inputs
    const sanitizedQuestion = sanitizeInput(question);
    const sanitizedAnswer = sanitizeInput(answer);
    
    // Limit answer length to prevent token overflow
    const maxAnswerLength = 2000;
    const limitedAnswer = sanitizedAnswer.length > maxAnswerLength 
      ? sanitizedAnswer.substring(0, maxAnswerLength) + '... [truncated]'
      : sanitizedAnswer;
    
    // Add job to queue
    const job = await gradingQueue.add('gradeAnswer', {
      question: sanitizedQuestion,
      answer: limitedAnswer
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      }
    });
    
    // Wait for job completion
    const result = await job.waitUntilFinished(gradingQueue.events);
    return result;
  } catch (error) {
    // Handle token limit errors
    if (error.message.includes('token') || error.message.includes('limit')) {
      console.error('Token limit error in gradeAnswer:', error.message);
      throw new Error('The answer is too long to process. Please provide a shorter answer.');
    }
    throw new Error('Failed to grade answer: ' + error.message);
  }
}

/**
 * Generate final interview summary
 * @param {Array} questions - Array of questions with answers and scores
 * @returns {Promise<string>} - Summary text
 */
async function generateSummary(questions) {
  try {
    // Sanitize questions
    const sanitizedQuestions = questions.map(q => ({
      text: sanitizeInput(q.text),
      answer: sanitizeInput(q.answer),
      score: q.score
    }));
    
    // Add job to queue
    const job = await summaryQueue.add('generateSummary', {
      questions: sanitizedQuestions
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      }
    });
    
    // Wait for job completion
    const result = await job.waitUntilFinished(summaryQueue.events);
    return result.summary;
  } catch (error) {
    // Handle token limit errors
    if (error.message.includes('token') || error.message.includes('limit')) {
      console.error('Token limit error in generateSummary:', error.message);
      throw new Error('The interview data is too long to process. Please try again with fewer questions.');
    }
    throw new Error('Failed to generate summary: ' + error.message);
  }
}

// Utility function to shuffle array
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Fallback functions for when OpenAI is unavailable
const fallbackQuestions = [
  { text: 'Tell me about yourself', difficulty: 'Easy', time: 60 },
  { text: 'What interests you about this role?', difficulty: 'Medium', time: 90 },
  { text: 'Where do you see yourself in 5 years?', difficulty: 'Hard', time: 120 }
];

// Shuffle fallback questions
const shuffledFallbackQuestions = shuffleArray(fallbackQuestions);

const fallbackGrade = { score: 30, feedback: 'Fallback grading due to service unavailability. Default score assigned.' };

const fallbackSummary = 'Fallback summary due to service unavailability';

module.exports = {
  parsePDF,
  parseDOCX,
  generateQuestions,
  gradeAnswer,
  generateSummary,
  fallbackQuestions: shuffledFallbackQuestions,
  fallbackGrade,
  fallbackSummary,
  getTotalCost,
  trackCost
};