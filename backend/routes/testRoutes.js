const express = require('express');
const router = express.Router();
const { authenticateApiKey } = require('../middleware/apiKeyAuth');
const { testApiKeyAuth } = require('../controllers/testController');

/**
 * GET /api/v1/test/api-key
 * A test endpoint that requires API key authentication
 */
router.get('/api-key', authenticateApiKey, testApiKeyAuth);

module.exports = router;