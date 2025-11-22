// Organization branding middleware
const Organization = require('../models/Organization');

const organizationBrandingMiddleware = async (req, res, next) => {
  try {
    // Check if organization ID is provided in headers or query params
    const orgId = req.headers['x-organization-id'] || req.query.orgId;
    
    if (orgId) {
      // Find organization by ID (excluding soft-deleted and inactive)
      const organization = await Organization.findOne({
        _id: orgId,
        isDeleted: { $ne: true },
        isActive: true
      });
      
      if (organization) {
        // Attach organization branding to request
        req.organization = {
          id: organization._id,
          name: organization.name,
          branding: organization.branding
        };
        
        // Set branding in response headers
        res.set('X-Organization-Name', organization.name);
        res.set('X-Organization-Branding-Primary-Color', organization.branding.primaryColor || '#1890ff');
        res.set('X-Organization-Branding-Secondary-Color', organization.branding.secondaryColor || '#52c41a');
        
        if (organization.branding.logoUrl) {
          res.set('X-Organization-Branding-Logo-Url', organization.branding.logoUrl);
        }
        
        if (organization.branding.faviconUrl) {
          res.set('X-Organization-Branding-Favicon-Url', organization.branding.faviconUrl);
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('Error in organization branding middleware:', error);
    next();
  }
};

module.exports = organizationBrandingMiddleware;
