const { AppError, formatSuccessResponse } = require('../middleware/errorHandler');

/**
 * A test endpoint that requires API key authentication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function testApiKeyAuth(req, res, next) {
  try {
    // This endpoint can only be accessed with a valid API key
    res.json(formatSuccessResponse({
      message: 'API key authentication successful!',
      apiKey: req.apiKey,
      timestamp: new Date().toISOString()
    }, 'Test endpoint accessed successfully'));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  testApiKeyAuth
};