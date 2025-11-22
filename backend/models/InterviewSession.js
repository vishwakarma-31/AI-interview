const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true
  },
  time: {
    type: Number,
    required: true
  },
  answer: {
    type: String,
    default: ''
  },
  draft: {
    type: String,
    default: ''
  },
  score: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    default: 'Technical'
  },
  tags: [{
    type: String
  }],
  isCustom: {
    type: Boolean,
    default: false
  },
  weight: {
    type: Number,
    default: 1.0
  },
  adjustments: [{
    originalScore: {
      type: Number,
      required: true
    },
    adjustedScore: {
      type: Number,
      required: true
    },
    reason: {
      type: String
    },
    adjustedBy: {
      id: String,
      name: String
    },
    adjustedAt: {
      type: Date,
      default: Date.now
    },
    isManualAdjustment: {
      type: Boolean,
      default: true
    }
  }]
});

const interviewSessionSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  organization: {
    type: String,
    ref: 'Organization',
    required: false
  },
  questions: [questionSchema],
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  score: {
    type: Number,
    default: 0
  },
  weightedScore: {
    type: Number,
    default: 0
  },
  scoreBreakdown: [{
    type: mongoose.Schema.Types.Mixed
  }],
  summary: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  tags: [{
    type: String
  }],
  pauseHistory: [{
    type: {
      type: String,
      enum: ['start', 'pause', 'resume', 'complete']
    },
    ts: {
      type: Date,
      default: Date.now
    },
    remainingMs: {
      type: Number
    }
  }],
  resumedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
});

// Generate UUID if not provided
interviewSessionSchema.pre('save', function(next) {
  if (!this._id) {
    this._id = uuidv4();
  }
  this.updatedAt = Date.now();
  next();
});

// Create indexes
interviewSessionSchema.index({ candidateId: 1 });
interviewSessionSchema.index({ createdAt: 1 });
interviewSessionSchema.index({ score: 1 });
interviewSessionSchema.index({ candidateId: 1, createdAt: -1 });
interviewSessionSchema.index({ organization: 1 });

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);
