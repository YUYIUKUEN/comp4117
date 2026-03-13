const mongoose = require('mongoose');

const rubricItemSchema = new mongoose.Schema({
  _id: false,
  title: { type: String, required: true, maxlength: 200 },
  description: { type: String, maxlength: 500 },
  minScore: { type: Number, default: 0 }, // min score for this rubric item
  maxScore: { type: Number, default: 10 }, // max score
  levels: [{ // for letter grades or custom options
    name: { type: String, required: true },
    description: { type: String, maxlength: 300 },
  }],
}, { _id: false });

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
  // Point Range with decimal support (step 0.5)
  pointRange: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    step: { type: Number, default: 0.5 }, // allows 0.5 increments
  },
  // Letter grades - HKBU system
  letterGrades: [String],
  hkbuGradingScale: {
    type: String,
    enum: ['hkbu-standard', 'hkbu-honors', 'custom', null],
    default: null,
  },
  gradeRangeMapping: [{ // maps letter grades to point ranges
    _id: false,
    grade: String,
    minPoints: Number,
    maxPoints: Number,
  }],
  customOptions: [String],
  // Template and Rubric
  templateName: { type: String, maxlength: 200, default: null }, // "Define from Scratch" or template name
  rubricItems: [rubricItemSchema], // array of rubric items that supervisors check
  description: { type: String, maxlength: 500, default: '' },
  dueDate: { type: Date, default: null },
  enabled: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date, default: Date.now },
});

gradingStandardSchema.index({ submissionType: 1, enabled: 1 });

module.exports = mongoose.model('GradingStandard', gradingStandardSchema);
