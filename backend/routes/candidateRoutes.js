const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Import controllers
const candidateController = require('../controllers/candidateController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Apply role-based access control for sensitive operations
// For now, only admins and interviewers can access candidate data
router.use(requireRole(['admin', 'interviewer']));

/**
 * GET /api/v1/candidates
 * @query {number} [page=1] - Page number (default: 1)
 * @query {number} [limit=10] - Number of candidates per page (default: 10, max: 100)
 * @query {string} [status] - Filter by candidate status (e.g., 'completed', 'in-progress')
 * @query {string} [role] - Filter by candidate role (e.g., 'Frontend', 'Backend')
 * @query {string} [sortBy=createdAt] - Sort by field (createdAt, name, email, role, status)
 * @query {string} [order=desc] - Sort order (asc or desc)
 */
router.get('/', candidateController.getAllCandidates);

module.exports = router;