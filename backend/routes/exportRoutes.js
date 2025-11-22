const express = require('express');
const router = express.Router();
const { exportData } = require('../controllers/candidateController');

/**
 * GET /api/v1/export/candidates
 * Export candidate data in JSON format
 */
router.get('/candidates', exportData);

/**
 * GET /api/v1/export/candidates/csv
 * Export candidate data in CSV format
 */
router.get('/candidates/csv', exportData);

module.exports = router;