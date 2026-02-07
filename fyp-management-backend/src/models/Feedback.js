const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  submission_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission',
    required: [true, 'Submission required'],
    index: true,
  },
  supervisor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Supervisor required'],
    index: true,
  },
  feedbackText: {
    type: String,
    required: [true, 'Feedback text required'],
    minlength: [10, 'Feedback must be at least 10 characters'],
    maxlength: [5000, 'Feedback max 5000 characters'],
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating max 5'],
  },
  isPrivate: {
    type: Boolean,
    default: false,
    index: true,
  },
  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date, default: Date.now },
});

// Composite index for querying feedback by submission
feedbackSchema.index({ submission_id: 1, isPrivate: 1 });
// Index for supervisor feedback queries
feedbackSchema.index({ supervisor_id: 1, createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
