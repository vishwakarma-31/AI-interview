const express = require('express');
const router = express.Router();

// Import controllers
const { register, login, refreshToken, logout, getCurrentUser } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validation');

// Public routes
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.post('/refresh-token', refreshToken);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);
router.post('/logout', authenticateToken, logout);

module.exports = router;