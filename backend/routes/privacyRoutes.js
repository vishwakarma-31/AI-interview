const express = require('express');
const router = express.Router();
const { deleteMyData } = require('../controllers/candidateController');

/**
 * DELETE /api/v1/privacy/me
 * Delete candidate's own data (right to deletion)
 */
router.delete('/me', deleteMyData);

module.exports = router;