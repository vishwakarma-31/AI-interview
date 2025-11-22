const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const organizationSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4
  },
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: false
  },
  website: {
    type: String,
    required: false,
    trim: true
  },
  logoUrl: {
    type: String,
    required: false
  },
  branding: {
    primaryColor: {
      type: String,
      default: '#1890ff'
    },
    secondaryColor: {
      type: String,
      default: '#52c41a'
    },
    logoUrl: {
      type: String,
      required: false
    },
    faviconUrl: {
      type: String,
      required: false
    }
  },
  contact: {
    email: {
      type: String,
      required: false,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: false,
      trim: true
    },
    address: {
      street: {
        type: String,
        required: false
      },
      city: {
        type: String,
        required: false
      },
      state: {
        type: String,
        required: false
      },
      zipCode: {
        type: String,
        required: false
      },
      country: {
        type: String,
        required: false
      }
    }
  },
  settings: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    language: {
      type: String,
      default: 'en'
    },
    defaultRole: {
      type: String,
      default: 'interviewer'
    },
    allowedRoles: {
      type: [String],
      default: ['admin', 'interviewer', 'candidate']
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Create indexes
organizationSchema.index({ name: 1 });
organizationSchema.index({ slug: 1 });
organizationSchema.index({ createdAt: 1 });
organizationSchema.index({ isActive: 1 });

module.exports = mongoose.model('Organization', organizationSchema);
