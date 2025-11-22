const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email address']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'interviewer', 'candidate'],
    default: 'interviewer'
  },
  organization: {
    type: String,
    ref: 'Organization',
    required: false
  },
  permissions: {
    type: [String],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Set default permissions based on role
userSchema.pre('save', function(next) {
  // Set default permissions based on role if permissions array is empty
  if (this.isNew && (!this.permissions || this.permissions.length === 0)) {
    switch (this.role) {
      case 'admin':
        this.permissions = [
          'user:create', 'user:read', 'user:update', 'user:delete',
          'interview:create', 'interview:read', 'interview:update', 'interview:delete',
          'candidate:create', 'candidate:read', 'candidate:update', 'candidate:delete',
          'api-key:create', 'api-key:read', 'api-key:update', 'api-key:delete'
        ];
        break;
      case 'interviewer':
        this.permissions = [
          'interview:create', 'interview:read', 'interview:update',
          'candidate:read', 'candidate:update'
        ];
        break;
      case 'candidate':
        this.permissions = [
          'interview:read'
        ];
        break;
    }
  }
  next();
});

// Create indexes
userSchema.index({ email: 1 });
userSchema.index({ createdAt: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ email: 1, role: 1 });
userSchema.index({ organization: 1 });

module.exports = mongoose.model('User', userSchema);