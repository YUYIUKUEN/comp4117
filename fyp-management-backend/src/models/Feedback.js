const mongoose = require('mongoose');

const feedbackReplySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  replyText: { type: String, required: true, maxlength: 2000 },
  createdAt: { type: Date, default: Date.now },
});

const feedbackSchema = new mongoose.Schema({
  submission_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true },
  supervisor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  feedbackText: { type: String, required: true, maxlength: 5000 },
  isPrivate: { type: Boolean, default: false },
  // Grade fields — linked to grading standards set by admin
  grade: { type: String, default: null },           // e.g. "85", "A", "Approved"
  gradingSystem: { type: String, enum: ['point-range', 'letter-grade', 'custom', null], default: null },
  gradingStandard_id: { type: mongoose.Schema.Types.ObjectId, ref: 'GradingStandard', default: null },
  // Internal note — visible only to supervisors and admins, NOT to students
  internalNote: { type: String, default: '', maxlength: 5000 },
  replies: [feedbackReplySchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

feedbackSchema.index({ submission_id: 1 });
feedbackSchema.index({ supervisor_id: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
