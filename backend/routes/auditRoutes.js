const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/adminController');

/**
 * GET /api/v1/audit/logs
 * Get audit logs with filtering and pagination
 */
router.get('/logs', getAuditLogs);

module.exports = router;