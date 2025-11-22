const express = require('express');
const router = express.Router();

// Import controllers
const { 
  createApiKey, 
  getApiKeys, 
  getApiKeyById, 
  updateApiKey, 
  deleteApiKey 
} = require('../controllers/apiKeyController');

// Import middleware
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { 
  validateCreateApiKey, 
  validateUpdateApiKey 
} = require('../middleware/validation');

// All routes require authentication
router.use(authenticateToken);

// Apply role-based access control - only admins and interviewers can manage API keys
router.use(requireRole(['admin', 'interviewer']));

// Routes
router.post('/', validateCreateApiKey, createApiKey);

/**
 * GET /api/v1/api-keys
 * @query {number} [page=1] - Page number (default: 1)
 * @query {number} [limit=10] - Number of API keys per page (default: 10, max: 100)
 */
router.get('/', getApiKeys);
router.get('/:id', getApiKeyById);
router.put('/:id', validateUpdateApiKey, updateApiKey);
router.delete('/:id', deleteApiKey);

module.exports = router;