const mongoose = require('mongoose');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const apiKeySchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  hashedKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  permissions: {
    type: [String],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: null
  },
  lastUsedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient lookups
apiKeySchema.index({ key: 1, isActive: 1 });
apiKeySchema.index({ hashedKey: 1, isActive: 1 });

// Generate a secure API key
apiKeySchema.statics.generateKey = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Hash the API key for storage
apiKeySchema.statics.hashKey = function(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
};

// Compare a key with the hashed version
apiKeySchema.statics.compareKey = function(key, hashedKey) {
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  return hash === hashedKey;
};

module.exports = mongoose.model('ApiKey', apiKeySchema);