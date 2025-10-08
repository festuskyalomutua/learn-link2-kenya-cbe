Backend
server/models/Assessment.js:

const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  subject: {
    type: String,
    required: true
  },
  grade: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['formative', 'summative', 'diagnostic', 'performance'],
    required: true
  },
  competencies: [{
    name: String,
    weight: Number,
    criteria: [{
      level: Number,
      description: String
    }]
  }],
  questions: [{
    question: String,
    type: {
      type: String,
      enum: ['multiple-choice', 'short-answer', 'essay', 'performance-task']
    },
    options: [String],
    correctAnswer: String,
    points: Number,
    competencyMapping: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  submissions: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    answers: [{
      questionId: String,
      answer: String,
      score: Number
    }],
    competencyScores: [{
      competency: String,
      score: Number,
      level: Number
    }],
    totalScore: Number,
    submittedAt: Date,
    gradedAt: Date,
    feedback: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Assessment', assessmentSchema);

