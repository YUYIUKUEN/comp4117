const mongoose = require('mongoose');

const cohortSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Cohort name required'],
    unique: true,
    trim: true,
    maxlength: 100,
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year required'],
    trim: true,
    maxlength: 20,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: Date,
  description: {
    type: String,
    maxlength: 1000,
  },
  status: {
    type: String,
    enum: ['Active', 'Archived', 'Planning'],
    default: 'Active',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

cohortSchema.index({ name: 1 }, { unique: true });
cohortSchema.index({ academicYear: 1 });
cohortSchema.index({ status: 1 });

module.exports = mongoose.model('Cohort', cohortSchema);
