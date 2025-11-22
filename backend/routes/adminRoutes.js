const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { authenticateApiKey } = require('../middleware/apiKeyAuth');
const { requireRole } = require('../middleware/rbac');
const { generateNewApiKey, getAllApiKeys, revokeApiKey } = require('../controllers/adminController');
const { validateRevokeApiKey } = require('../middleware/validation');

// Apply authentication middleware to all routes
// Routes can be accessed either with JWT token OR API key
router.use((req, res, next) => {
  // Check if request has API key
  if (req.headers['x-api-key']) {
    return authenticateApiKey(req, res, next);
  }
  
  // Otherwise, use JWT token authentication
  authenticateToken(req, res, next);
});

// Apply role-based access control - only admins can access these routes
router.use(requireRole(['admin']));

/**
 * POST /api/v1/admin/api-keys
 * Generate a new API key
 */
router.post('/api-keys', generateNewApiKey);

/**
 * GET /api/v1/admin/api-keys
 * Get all API keys
 */
router.get('/api-keys', getAllApiKeys);

/**
 * DELETE /api/v1/admin/api-keys
 * Revoke an API key
 */
router.delete('/api-keys', validateRevokeApiKey, revokeApiKey);

module.exports = router;