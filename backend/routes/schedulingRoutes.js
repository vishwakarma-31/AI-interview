const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const schedulingController = require('../controllers/schedulingController');
const { validate } = require('../middleware/validation');
const { scheduleInterviewSchema, rescheduleInterviewSchema } = require('../validation/schedulingValidation');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Apply role-based access control - candidates can schedule their own interviews
// admins and interviewers can schedule for candidates
router.use(requireRole(['admin', 'interviewer', 'candidate']));

/**
 * POST /api/v1/scheduling/schedule
 * Schedule an interview for a candidate
 * @body {string} candidateId - Candidate ID
 * @body {string} scheduledAt - Scheduled date and time (ISO 8601 format)
 * @body {number} duration - Interview duration in minutes
 * @body {string} [timezone] - Timezone for the scheduled interview
 */
router.post('/schedule', validate(scheduleInterviewSchema), schedulingController.scheduleInterview);

/**
 * GET /api/v1/scheduling/upcoming
 * Get upcoming scheduled interviews
 * @query {string} [candidateId] - Filter by candidate ID
 * @query {string} [status] - Filter by status (scheduled, completed, cancelled)
 * @query {date} [from] - Filter from date (ISO 8601 format)
 * @query {date} [to] - Filter to date (ISO 8601 format)
 * @query {string} [timezone] - Timezone for date filtering
 */
router.get('/upcoming', schedulingController.getUpcomingInterviews);

/**
 * GET /api/v1/scheduling/timezones
 * Get supported timezones
 */
router.get('/timezones', schedulingController.getSupportedTimezones);

/**
 * PATCH /api/v1/scheduling/:id/cancel
 * Cancel a scheduled interview
 * @param {string} id - Schedule ID
 */
router.patch('/:id/cancel', schedulingController.cancelInterview);

/**
 * PATCH /api/v1/scheduling/:id/reschedule
 * Reschedule an interview
 * @param {string} id - Schedule ID
 * @body {string} scheduledAt - New scheduled date and time (ISO 8601 format)
 * @body {number} duration - New interview duration in minutes
 * @body {string} [timezone] - Timezone for the rescheduled interview
 */
router.patch('/:id/reschedule', validate(rescheduleInterviewSchema), schedulingController.rescheduleInterview);

module.exports = router;