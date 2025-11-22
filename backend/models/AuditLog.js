const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'CREATE_CANDIDATE',
      'UPDATE_CANDIDATE',
      'DELETE_CANDIDATE',
      'CREATE_INTERVIEW',
      'UPDATE_INTERVIEW',
      'DELETE_INTERVIEW',
      'SUBMIT_ANSWER',
      'FINALIZE_INTERVIEW',
      'EXPORT_DATA',
      'DELETE_DATA',
      'LOGIN',
      'LOGOUT',
      'API_KEY_CREATED',
      'API_KEY_REVOKED'
    ]
  },
  entityType: {
    type: String,
    required: true,
    enum: ['Candidate', 'InterviewSession', 'User', 'ApiKey']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  changes: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Generate UUID if not provided
auditLogSchema.pre('save', function(next) {
  if (!this._id) {
    this._id = uuidv4();
  }
  next();
});

// Create indexes
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ entityType: 1 });
auditLogSchema.index({ entityId: 1 });
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);