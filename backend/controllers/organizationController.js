const Organization = require('../models/Organization');
const User = require('../models/User');
const Candidate = require('../models/Candidate');
const mongoose = require('mongoose');
const { AppError, formatSuccessResponse } = require('../middleware/errorHandler');
const { logAuditEvent } = require('../utils/auditLogger');

/**
 * Create a new organization
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function createOrganization(req, res, next) {
  try {
    const {
      name,
      slug,
      description,
      website,
      logoUrl,
      branding,
      contact,
      settings
    } = req.body;

    // Check if database is connected
    const isDatabaseConnected = mongoose.connection.readyState === 1;
    
    // If database is not connected, return error
    if (!isDatabaseConnected) {
      throw new AppError('Database connection failed. Please try again later.', 500, 'DB_001');
    }

    // Check if organization with this name or slug already exists
    const existingOrg = await Organization.findOne({
      $or: [
        { name: name },
        { slug: slug }
      ]
    });

    if (existingOrg) {
      throw new AppError('Organization with this name or slug already exists', 409, 'ORG_001');
    }

    // Create new organization
    const organization = new Organization({
      name,
      slug,
      description,
      website,
      logoUrl,
      branding,
      contact,
      settings
    });

    await organization.save();

    // Log audit event
    await logAuditEvent('organization_create', req.user ? req.user._id : null, 'Organization created', {
      organizationId: organization._id,
      name: organization.name
    });

    res.status(201).json(formatSuccessResponse(organization, 'Organization created successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Get all organizations
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getAllOrganizations(req, res, next) {
  try {
    // Get pagination parameters from query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get filter parameters from query
    const isActive = req.query.isActive;
    
    // Get sorting parameters from query
    const sortBy = req.query.sortBy || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1; // Default to descending
    
    // Validate pagination parameters
    if (page < 1) {
      throw new AppError('Page must be greater than 0', 400, 'VALID_001');
    }
    
    if (limit < 1 || limit > 100) {
      throw new AppError('Limit must be between 1 and 100', 400, 'VALID_001');
    }
    
    // Validate sorting parameters
    const validSortFields = ['createdAt', 'name', 'slug'];
    if (!validSortFields.includes(sortBy)) {
      throw new AppError(`Invalid sortBy field. Must be one of: ${validSortFields.join(', ')}`, 400, 'VALID_001');
    }
    
    const validOrders = ['asc', 'desc'];
    if (!validOrders.includes(req.query.order)) {
      throw new AppError(`Invalid order. Must be 'asc' or 'desc'`, 400, 'VALID_001');
    }
    
    // Build filter object
    const filter = { isDeleted: { $ne: true } };
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = order;
    
    // Check if database is connected
    const isDatabaseConnected = mongoose.connection.readyState === 1;
    
    // If database is not connected, return error
    if (!isDatabaseConnected) {
      throw new AppError('Database connection failed. Please try again later.', 500, 'DB_001');
    }
    
    // Use MongoDB with pagination, filtering, and sorting
    const totalOrganizations = await Organization.countDocuments(filter);
    const organizations = await Organization.find(filter).sort(sort).skip(skip).limit(limit);
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalOrganizations / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    // Send standardized success response with pagination, filter, and sort info
    res.json(formatSuccessResponse({
      organizations,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalOrganizations: totalOrganizations,
        hasNextPage: hasNextPage,
        hasPrevPage: hasPrevPage,
        limit: limit
      },
      filter: {
        isActive: isActive || null
      },
      sort: {
        sortBy: sortBy,
        order: req.query.order || 'desc'
      }
    }, 'Organizations retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Get organization by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getOrganizationById(req, res, next) {
  try {
    const { id } = req.params;
    
    // Check if database is connected
    const isDatabaseConnected = mongoose.connection.readyState === 1;
    
    // If database is not connected, return error
    if (!isDatabaseConnected) {
      throw new AppError('Database connection failed. Please try again later.', 500, 'DB_001');
    }
    
    // Find organization by ID (excluding soft-deleted)
    const organization = await Organization.findOne({
      _id: id,
      isDeleted: { $ne: true }
    });
    
    if (!organization) {
      throw new AppError('Organization not found', 404, 'ORG_002');
    }
    
    res.json(formatSuccessResponse(organization, 'Organization retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Update organization
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function updateOrganization(req, res, next) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Check if database is connected
    const isDatabaseConnected = mongoose.connection.readyState === 1;
    
    // If database is not connected, return error
    if (!isDatabaseConnected) {
      throw new AppError('Database connection failed. Please try again later.', 500, 'DB_001');
    }
    
    // Find organization by ID (excluding soft-deleted)
    const organization = await Organization.findOne({
      _id: id,
      isDeleted: { $ne: true }
    });
    
    if (!organization) {
      throw new AppError('Organization not found', 404, 'ORG_002');
    }
    
    // Update organization fields
    Object.keys(updateData).forEach(key => {
      // Handle nested branding updates
      if (key === 'branding' && typeof updateData[key] === 'object') {
        // Merge branding properties
        organization.branding = {
          ...organization.branding,
          ...updateData[key]
        };
      } else if (key !== '_id' && key !== 'createdAt' && key !== 'updatedAt') {
        organization[key] = updateData[key];
      }
    });
    
    await organization.save();
    
    // Log audit event
    await logAuditEvent('organization_update', req.user ? req.user._id : null, 'Organization updated', {
      organizationId: organization._id,
      name: organization.name
    });
    
    res.json(formatSuccessResponse(organization, 'Organization updated successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Delete organization (soft delete)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function deleteOrganization(req, res, next) {
  try {
    const { id } = req.params;
    
    // Check if database is connected
    const isDatabaseConnected = mongoose.connection.readyState === 1;
    
    // If database is not connected, return error
    if (!isDatabaseConnected) {
      throw new AppError('Database connection failed. Please try again later.', 500, 'DB_001');
    }
    
    // Find organization by ID (excluding already soft-deleted)
    const organization = await Organization.findOne({
      _id: id,
      isDeleted: { $ne: true }
    });
    
    if (!organization) {
      throw new AppError('Organization not found', 404, 'ORG_002');
    }
    
    // Soft delete organization
    organization.isDeleted = true;
    organization.deletedAt = new Date();
    await organization.save();
    
    // Log audit event
    await logAuditEvent('organization_delete', req.user ? req.user._id : null, 'Organization deleted', {
      organizationId: organization._id,
      name: organization.name
    });
    
    res.json(formatSuccessResponse(null, 'Organization deleted successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Get organization statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getOrganizationStats(req, res, next) {
  try {
    const { id } = req.params;
    
    // Check if database is connected
    const isDatabaseConnected = mongoose.connection.readyState === 1;
    
    // If database is not connected, return error
    if (!isDatabaseConnected) {
      throw new AppError('Database connection failed. Please try again later.', 500, 'DB_001');
    }
    
    // Find organization by ID (excluding soft-deleted)
    const organization = await Organization.findOne({
      _id: id,
      isDeleted: { $ne: true }
    });
    
    if (!organization) {
      throw new AppError('Organization not found', 404, 'ORG_002');
    }
    
    // Get statistics for this organization
    const userCount = await User.countDocuments({ organization: id });
    const candidateCount = await Candidate.countDocuments({ organization: id });
    
    const stats = {
      organization: {
        id: organization._id,
        name: organization.name
      },
      users: userCount,
      candidates: candidateCount
    };
    
    res.json(formatSuccessResponse(stats, 'Organization statistics retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Get organization branding
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getOrganizationBranding(req, res, next) {
  try {
    const { id } = req.params;
    
    // Check if database is connected
    const isDatabaseConnected = mongoose.connection.readyState === 1;
    
    // If database is not connected, return error
    if (!isDatabaseConnected) {
      throw new AppError('Database connection failed. Please try again later.', 500, 'DB_001');
    }
    
    // Find organization by ID (excluding soft-deleted)
    const organization = await Organization.findOne({
      _id: id,
      isDeleted: { $ne: true }
    });
    
    if (!organization) {
      throw new AppError('Organization not found', 404, 'ORG_002');
    }
    
    res.json(formatSuccessResponse({
      id: organization._id,
      name: organization.name,
      branding: organization.branding
    }, 'Organization branding retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createOrganization,
  getAllOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  getOrganizationStats,
  getOrganizationBranding
};




