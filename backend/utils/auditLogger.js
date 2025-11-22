const AuditLog = require('../models/AuditLog');

/**
 * Log an audit event
 * @param {string} action - The action performed
 * @param {string} entityType - The type of entity (Candidate, InterviewSession, etc.)
 * @param {string} entityId - The ID of the entity
 * @param {Object} options - Additional options
 * @param {string} options.userId - The user ID (if applicable)
 * @param {string} options.ipAddress - The IP address of the request
 * @param {string} options.userAgent - The user agent of the request
 * @param {Object} options.changes - The changes made (for update actions)
 */
async function logAuditEvent(action, entityType, entityId, options = {}) {
  try {
    const auditLog = new AuditLog({
      action,
      entityType,
      entityId,
      userId: options.userId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      changes: options.changes
    });
    
    await auditLog.save();
    console.log(`Audit log created: ${action} on ${entityType} ${entityId}`);
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error as audit logging shouldn't break the main functionality
  }
}

module.exports = { logAuditEvent };