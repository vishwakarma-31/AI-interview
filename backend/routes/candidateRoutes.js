const express = require('express');
const router = express.Router();

// Import controllers
const candidateController = require('../controllers/candidateController');

// Route to get all candidates
router.get('/', candidateController.getAllCandidates);

module.exports = router;