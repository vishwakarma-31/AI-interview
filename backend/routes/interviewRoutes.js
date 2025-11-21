const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Import controllers
const interviewController = require('../controllers/interviewController');

// Route to start a new interview session
router.post('/start', upload.single('resume'), interviewController.startInterview);

// Route to submit an answer and get the next question
router.post('/answer', interviewController.submitAnswer);

// Route to finalize the interview
router.post('/submit', interviewController.finalizeInterview);

module.exports = router;