const Candidate = require('../models/Candidate');
const InterviewSession = require('../models/InterviewSession');
const mongoose = require('mongoose');
const { AppError, formatSuccessResponse } = require('../middleware/errorHandler');
const { logAuditEvent } = require('../utils/auditLogger');

/**
 * Get all candidates with their interview sessions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getAllCandidates(req, res, next) {
  try {
    // Get pagination parameters from query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get filter parameters from query
    const status = req.query.status;
    const role = req.query.role;
    
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
    const validSortFields = ['createdAt', 'name', 'email', 'role', 'status', 'score'];
    if (!validSortFields.includes(sortBy)) {
      throw new AppError(`Invalid sortBy field. Must be one of: ${validSortFields.join(', ')}`, 400, 'VALID_001');
    }
    
    const validOrders = ['asc', 'desc'];
    if (!validOrders.includes(req.query.order)) {
      throw new AppError(`Invalid order. Must be 'asc' or 'desc'`, 400, 'VALID_001');
    }
    
    // Build filter object
    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (role) {
      filter.role = role;
    }
    
    // Check if database is connected
    const isDatabaseConnected = mongoose.connection.readyState === 1;
    
    // If database is not connected, return error
    if (!isDatabaseConnected) {
      throw new AppError('Database connection failed. Please try again later.', 500, 'DB_001');
    }
    
    // Handle sorting by score specially since it's in the InterviewSession model
    if (sortBy === 'score') {
      // First get all candidates with filtering (excluding soft-deleted)
      const allCandidates = await Candidate.find({ ...filter, isDeleted: { $ne: true } });
      
      // Get interview sessions for each candidate and calculate scores
      const candidatesWithScores = await Promise.all(allCandidates.map(async (candidate) => {
        const session = await InterviewSession.findOne({ candidateId: candidate._id });
        const score = session && session.score ? session.score : 0;
        return {
          ...candidate.toObject(),
          session: session ? session.toObject() : null,
          interviewScore: score
        };
      }));
      
      // Sort by score
      candidatesWithScores.sort((a, b) => {
        return order === 1 ? a.interviewScore - b.interviewScore : b.interviewScore - a.interviewScore;
      });
      
      // Apply pagination
      const totalCandidates = candidatesWithScores.length;
      const paginatedCandidates = candidatesWithScores.slice(skip, skip + limit);
      
      // Calculate pagination info
      const totalPages = Math.ceil(totalCandidates / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;
      
      // Send standardized success response with pagination, filter, and sort info
      res.json(formatSuccessResponse({
        candidates: paginatedCandidates,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalCandidates: totalCandidates,
          hasNextPage: hasNextPage,
          hasPrevPage: hasPrevPage,
          limit: limit
        },
        filter: {
          status: status || null,
          role: role || null
        },
        sort: {
          sortBy: sortBy,
          order: req.query.order || 'desc'
        }
      }, req.t('candidate.list_success') || 'Candidates retrieved successfully'));
    } else {
      // Build sort object for regular fields
      const sort = {};
      sort[sortBy] = order;
      
      // Use MongoDB with pagination, filtering, and sorting (excluding soft-deleted)
      const filterWithDeleted = { ...filter, isDeleted: { $ne: true } };
      const totalCandidates = await Candidate.countDocuments(filterWithDeleted);
      const candidates = await Candidate.find(filterWithDeleted).sort(sort).skip(skip).limit(limit);
      
      // Get interview sessions for each candidate
      const candidatesWithSessions = await Promise.all(candidates.map(async (candidate) => {
        const session = await InterviewSession.findOne({ candidateId: candidate._id });
        return {
          ...candidate.toObject(),
          session: session ? session.toObject() : null
        };
      }));
      
      // Calculate pagination info
      const totalPages = Math.ceil(totalCandidates / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;
      
      // Send standardized success response with pagination, filter, and sort info
      res.json(formatSuccessResponse({
        candidates: candidatesWithSessions,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalCandidates: totalCandidates,
          hasNextPage: hasNextPage,
          hasPrevPage: hasPrevPage,
          limit: limit
        },
        filter: {
          status: status || null,
          role: role || null
        },
        sort: {
          sortBy: sortBy,
          order: req.query.order || 'desc'
        }
      }, req.t('candidate.list_success') || 'Candidates retrieved successfully'));
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Delete candidate's own data (right to deletion)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function deleteMyData(req, res, next) {
  try {
    // In a real implementation, you would verify the candidate's identity
    // For now, we'll implement the basic functionality
    // This would typically require authentication/authorization
    
    // Check if database is connected
    const isDatabaseConnected = mongoose.connection.readyState === 1;
    
    // If database is not connected, return error
    if (!isDatabaseConnected) {
      throw new AppError('Database connection failed. Please try again later.', 500, 'DB_001');
    }
    
    // In a real implementation, you would:
    // 1. Verify the candidate's identity (e.g., through authentication token)
    // 2. Delete the candidate's data
    // 3. Delete associated interview sessions
    // 4. Handle any legal requirements for data retention
    
    // For demonstration purposes, we'll return a success response
    res.json(formatSuccessResponse(null, 'Data deletion request received. Your data will be deleted according to our retention policy.'));
  } catch (error) {
    next(error);
  }
}

/**
 * Export candidate data in JSON or CSV format
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function exportData(req, res, next) {
  try {
    // Check if database is connected
    const isDatabaseConnected = mongoose.connection.readyState === 1;
    
    // If database is not connected, return error
    if (!isDatabaseConnected) {
      throw new AppError('Database connection failed. Please try again later.', 500, 'DB_001');
    }
    
    // Get filter parameters from query
    const status = req.query.status;
    const role = req.query.role;
    
    // Build filter object
    const filter = { isDeleted: { $ne: true } }; // Exclude soft-deleted records
    if (status) {
      filter.status = status;
    }
    if (role) {
      filter.role = role;
    }
    
    // Get candidates with interview sessions
    const candidates = await Candidate.find(filter);
    
    // Get interview sessions for each candidate
    const candidatesWithSessions = await Promise.all(candidates.map(async (candidate) => {
      const session = await InterviewSession.findOne({ 
        candidateId: candidate._id,
        isDeleted: { $ne: true }
      });
      return {
        ...candidate.toObject(),
        session: session ? session.toObject() : null
      };
    }));
    
    // Check if CSV format is requested
    if (req.path.includes('/csv')) {
      // Generate CSV format
      const csvHeaders = [
        'ID',
        'Name',
        'Email',
        'Phone',
        'Role',
        'Status',
        'Created At',
        'Score',
        'Questions Answered'
      ];
      
      const csvRows = candidatesWithSessions.map(candidate => {
        const score = candidate.session && candidate.session.score ? candidate.session.score : 'N/A';
        const questionsAnswered = candidate.session && candidate.session.questions ? 
          candidate.session.questions.filter(q => q.answer).length : 0;
          
        return [
          candidate._id,
          `"${candidate.name}"`,
          candidate.email,
          `"${candidate.phone}"`,
          candidate.role,
          candidate.status,
          candidate.createdAt.toISOString(),
          score,
          questionsAnswered
        ].join(',');
      });
      
      const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
      
      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="candidates.csv"');
      
      // Log audit event
      await logAuditEvent('EXPORT_DATA', 'Candidate', 'multiple', {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        changes: {
          format: 'CSV',
          count: candidatesWithSessions.length
        }
      });
      
      return res.send(csvContent);
    } else {
      // Generate JSON format
      const exportData = {
        exportedAt: new Date().toISOString(),
        totalCount: candidatesWithSessions.length,
        candidates: candidatesWithSessions.map(candidate => ({
          id: candidate._id,
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone,
          role: candidate.role,
          status: candidate.status,
          createdAt: candidate.createdAt,
          score: candidate.session && candidate.session.score ? candidate.session.score : null,
          questionsAnswered: candidate.session && candidate.session.questions ? 
            candidate.session.questions.filter(q => q.answer).length : 0
        }))
      };
      
      // Set headers for JSON download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="candidates.json"');
      
      // Log audit event
      await logAuditEvent('EXPORT_DATA', 'Candidate', 'multiple', {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        changes: {
          format: 'JSON',
          count: candidatesWithSessions.length
        }
      });
      
      return res.json(exportData);
    }
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllCandidates,
  deleteMyData,
  exportData
};



