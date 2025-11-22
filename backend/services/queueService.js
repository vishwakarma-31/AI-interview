const { Queue, Worker } = require('bullmq');
const redis = require('redis');
const { generateQuestions, gradeAnswer, generateSummary } = require('./aiService');

// Create Redis connection configuration for BullMQ
// This configuration is used to connect to Redis for queue persistence
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || null
};

// Create separate queues for different AI operations to enable parallel processing
// Each queue handles a specific type of AI task to prevent blocking
const questionQueue = new Queue('questions', { connection: redisConnection }); // Queue for generating interview questions
const gradingQueue = new Queue('grading', { connection: redisConnection });     // Queue for grading candidate answers
const summaryQueue = new Queue('summary', { connection: redisConnection });     // Queue for generating interview summaries

// Create workers that process jobs from their respective queues
// Workers run asynchronously and can process multiple jobs concurrently

// Worker for generating interview questions based on resume and role
const questionWorker = new Worker('questions', async (job) => {
  const { resumeText, role } = job.data;
  try {
    // Call the AI service to generate questions
    const questions = await generateQuestions(resumeText, role);
    return { questions };
  } catch (error) {
    // Propagate error to mark job as failed
    throw new Error(`Failed to generate questions: ${error.message}`);
  }
}, { connection: redisConnection });

// Worker for grading candidate answers
const gradingWorker = new Worker('grading', async (job) => {
  const { question, answer } = job.data;
  try {
    // Call the AI service to grade the answer
    const grading = await gradeAnswer(question, answer);
    return grading;
  } catch (error) {
    // Propagate error to mark job as failed
    throw new Error(`Failed to grade answer: ${error.message}`);
  }
}, { connection: redisConnection });

// Worker for generating interview summaries
const summaryWorker = new Worker('summary', async (job) => {
  const { questions } = job.data;
  try {
    // Call the AI service to generate a summary
    const summary = await generateSummary(questions);
    return { summary };
  } catch (error) {
    // Propagate error to mark job as failed
    throw new Error(`Failed to generate summary: ${error.message}`);
  }
}, { connection: redisConnection });

// Handle worker errors for debugging and monitoring
// These event handlers log failed jobs to help with troubleshooting
questionWorker.on('failed', (job, err) => {
  console.error(`Question job ${job.id} failed:`, err);
});

gradingWorker.on('failed', (job, err) => {
  console.error(`Grading job ${job.id} failed:`, err);
});

summaryWorker.on('failed', (job, err) => {
  console.error(`Summary job ${job.id} failed:`, err);
});

// Handle worker completion for monitoring
// These event handlers log successful job completion for tracking purposes
questionWorker.on('completed', (job, result) => {
  console.log(`Question job ${job.id} completed`);
});

gradingWorker.on('completed', (job, result) => {
  console.log(`Grading job ${job.id} completed`);
});

summaryWorker.on('completed', (job, result) => {
  console.log(`Summary job ${job.id} completed`);
});

module.exports = {
  questionQueue,
  gradingQueue,
  summaryQueue,
  questionWorker,
  gradingWorker,
  summaryWorker
};