const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Import controllers
const interviewController = require('../controllers/interviewController');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|docx/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype || extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'));
    }
  }
});

// Route to start a new interview session
router.post('/start', upload.single('resume'), interviewController.startInterview);

// Route to submit an answer and get the next question
router.post('/answer', interviewController.submitAnswer);

// Route to finalize the interview
router.post('/submit', interviewController.finalizeInterview);

module.exports = router;