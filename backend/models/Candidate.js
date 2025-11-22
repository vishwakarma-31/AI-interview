const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { encrypt, decrypt } = require('../utils/encryption');

const candidateSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  resumeText: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'scheduled', 'in-progress', 'completed', 'abandoned'],
    default: 'pending'
  },
  role: {
    type: String,
    enum: ['Frontend', 'Backend', 'Fullstack Developer', 'DevOps Engineer', 'Data Scientist', 'Product Manager', 'UI/UX Designer', 'QA Engineer', 'Mobile Developer'],
    default: 'Frontend'
  },
  organization: {
    type: String,
    ref: 'Organization',
    required: false
  },
  gdprConsent: {
    type: Boolean,
    required: true,
    default: false
  },
  scheduledAt: {
    type: Date,
    required: false
  },
  scheduledDuration: {
    type: Number, // Duration in minutes
    required: false
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate UUID if not provided
candidateSchema.pre('save', function(next) {
  if (!this._id) {
    this._id = uuidv4();
  }
  this.updatedAt = Date.now();
  next();
});

// Encrypt sensitive data before saving
candidateSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.name = encrypt(this.name);
  }
  if (this.isModified('email')) {
    this.email = encrypt(this.email);
  }
  if (this.isModified('phone')) {
    this.phone = encrypt(this.phone);
  }
  if (this.isModified('resumeText') && this.resumeText) {
    this.resumeText = encrypt(this.resumeText);
  }
  next();
});

// Decrypt sensitive data when retrieving
candidateSchema.post('findOne', function(result) {
  if (result) {
    if (result.name) result.name = decrypt(result.name);
    if (result.email) result.email = decrypt(result.email);
    if (result.phone) result.phone = decrypt(result.phone);
    if (result.resumeText) result.resumeText = decrypt(result.resumeText);
  }
});

candidateSchema.post('find', function(results) {
  results.forEach(result => {
    if (result.name) result.name = decrypt(result.name);
    if (result.email) result.email = decrypt(result.email);
    if (result.phone) result.phone = decrypt(result.phone);
    if (result.resumeText) result.resumeText = decrypt(result.resumeText);
  });
});

// Create indexes
candidateSchema.index({ email: 1 });
candidateSchema.index({ createdAt: 1 });
candidateSchema.index({ status: 1 });
candidateSchema.index({ role: 1 });
candidateSchema.index({ email: 1, status: 1 });
candidateSchema.index({ organization: 1 });

module.exports = mongoose.model('Candidate', candidateSchema);
