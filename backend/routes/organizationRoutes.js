const express = require('express');
const router = express.Router();
const { 
  createOrganization,
  getAllOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  getOrganizationStats,
  getOrganizationBranding
} = require('../controllers/organizationController');
const { authenticateToken, requirePermission } = require('../middleware/auth');

// Create a new organization (admin only)
router.post('/', 
  authenticateToken, 
  requirePermission('organization:create'),
  createOrganization
);

// Get all organizations (admin only)
router.get('/', 
  authenticateToken, 
  requirePermission('organization:read'),
  getAllOrganizations
);

// Get organization by ID (admin or organization member)
router.get('/:id', 
  authenticateToken, 
  requirePermission('organization:read'),
  getOrganizationById
);

// Update organization (admin or organization admin)
router.put('/:id', 
  authenticateToken, 
  requirePermission('organization:update'),
  updateOrganization
);

// Delete organization (admin only)
router.delete('/:id', 
  authenticateToken, 
  requirePermission('organization:delete'),
  deleteOrganization
);

// Get organization statistics (admin or organization member)
router.get('/:id/stats', 
  authenticateToken, 
  requirePermission('organization:read'),
  getOrganizationStats
);

// Get organization branding (public endpoint)
router.get('/:id/branding', 
  getOrganizationBranding
);

module.exports = router;