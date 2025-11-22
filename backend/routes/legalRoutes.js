const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;

/**
 * GET /api/v1/legal/privacy-policy
 * Get the privacy policy
 */
router.get('/privacy-policy', async (req, res, next) => {
  try {
    const privacyPolicyPath = path.join(__dirname, '../docs/privacy-policy.md');
    const privacyPolicy = await fs.readFile(privacyPolicyPath, 'utf8');
    res.type('text/markdown').send(privacyPolicy);
  } catch (error) {
    next(new Error('Privacy policy not found'));
  }
});

/**
 * GET /api/v1/legal/terms-of-service
 * Get the terms of service
 */
router.get('/terms-of-service', async (req, res, next) => {
  try {
    const termsPath = path.join(__dirname, '../docs/terms-of-service.md');
    const terms = await fs.readFile(termsPath, 'utf8');
    res.type('text/markdown').send(terms);
  } catch (error) {
    next(new Error('Terms of service not found'));
  }
});

module.exports = router;