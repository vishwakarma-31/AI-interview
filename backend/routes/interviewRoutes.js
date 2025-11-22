const express = require('express');
const router = express.Router();
const { startInterview, submitAnswer, finalizeInterview, getInterviewById, deleteInterviewById, patchInterviewById, adjustQuestionScore } = require('../controllers/interviewController');
const upload = require('../middleware/fileUpload');
const { validate, validateFile } = require('../middleware/validation');
const { startInterviewSchema, submitAnswerSchema, finalizeInterviewSchema, adjustScoreSchema } = require('../validation/interviewValidation');

/**
 * POST /api/v1/interview/start
 * Start a new interview session
 * @body {string} name - Candidate name
 * @body {string} email - Candidate email
 * @body {string} phone - Candidate phone number
 * @body {string} role - Job role
 * @body {file} [resume] - Candidate resume (PDF or DOCX)
 */
router.post('/start', upload.single('resume'), validateFile, validate(startInterviewSchema), startInterview);

/**
 * PATCH /api/v1/interview/:id
 * Submit an answer and get the next question
 * @param {string} id - Interview session ID
 * @body {string} answerText - Candidate's answer
 */
router.patch('/:id', validate(submitAnswerSchema), submitAnswer);

/**
 * GET /api/v1/interview/:id
 * Get interview session by ID
 * @param {string} id - Interview session ID
 */
router.get('/:id', getInterviewById);

/**
 * PATCH /api/v1/interview/:id/finalize
 * Finalize interview session by ID
 * @param {string} id - Interview session ID
 */
router.patch('/:id/finalize', patchInterviewById);

/**
 * PATCH /api/v1/interview/:id/question/:questionId/score
 * Adjust question score manually
 * @param {string} id - Interview session ID
 * @param {string} questionId - Question ID
 * @body {number} newScore - New score for the question
 * @body {string} [reason] - Reason for score adjustment
 */
router.patch('/:id/question/:questionId/score', validate(adjustScoreSchema), adjustQuestionScore);

/**
 * DELETE /api/v1/interview/:id
 * Delete interview session by ID
 * @param {string} id - Interview session ID
 */
router.delete('/:id', deleteInterviewById);

module.exports = router;