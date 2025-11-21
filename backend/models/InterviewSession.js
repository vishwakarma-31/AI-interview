const mongoose = require('mongoose');

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
  }
});

const interviewSessionSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
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
  }
});

// Update the updatedAt field before saving
interviewSessionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);