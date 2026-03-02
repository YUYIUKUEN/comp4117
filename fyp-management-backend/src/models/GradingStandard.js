const mongoose = require('mongoose');

const gradingStandardSchema = new mongoose.Schema({
  submissionType: {
    type: String,
    required: [true, 'Submission type required'],
    trim: true,
    maxlength: 100,
  },
  gradingSystem: {
    type: String,
    required: [true, 'Grading system required'],
    enum: ['point-range', 'letter-grade', 'custom'],
  },
  pointRange: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
  },
  letterGrades: [String],
  customOptions: [String],
  description: { type: String, maxlength: 500, default: '' },
  dueDate: { type: Date, default: null },
  enabled: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date, default: Date.now },
});

gradingStandardSchema.index({ submissionType: 1, enabled: 1 });

module.exports = mongoose.model('GradingStandard', gradingStandardSchema);
