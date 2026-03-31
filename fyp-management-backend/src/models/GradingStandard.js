const mongoose = require('mongoose');

const rubricItemSchema = new mongoose.Schema({
  _id: false,
  title: { type: String, maxlength: 200 },
  description: { type: String, maxlength: 500 },
  minScore: { type: Number, default: 0 }, // min score for this rubric item
  maxScore: { type: Number, default: 10 }, // max score
  levels: [{ // performance levels (name and description only - no points)
    _id: false,
    name: { type: String },
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
  // Pathway-specific rubric templates (consolidates research & solution in one record)
  rubricTemplatesByPathway: {
    'Research-Based': { type: mongoose.Schema.Types.ObjectId, ref: 'RubricTemplate', default: null },
    'Solution-Based': { type: mongoose.Schema.Types.ObjectId, ref: 'RubricTemplate', default: null },
  },
  gradingSystem: {
    type: String,
    required: [true, 'Grading system required'],
    enum: ['point-range'],
  },
  // Point Range - admin sets the maximum points for supervisors
  pointRange: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 20 }, // maximum points supervisors can award
    step: { type: Number, default: 1 }, // supervisors enter points directly
  },
  // Template and Rubric (for reference/documentation only)
  templateName: { type: String, maxlength: 200, default: null }, // "Define from Scratch" or template name
  rubricItems: [rubricItemSchema], // array of rubric items for reference
  description: { type: String, maxlength: 500, default: '' },
  dueDate: { type: Date, default: null },
  enabled: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date, default: Date.now },
});

gradingStandardSchema.index({ submissionType: 1, enabled: 1 });

module.exports = mongoose.model('GradingStandard', gradingStandardSchema);
