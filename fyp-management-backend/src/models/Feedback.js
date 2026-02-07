const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  submission_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true },
  supervisor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  feedbackText: { type: String, required: true, maxlength: 5000 },
  isPrivate: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

feedbackSchema.index({ submission_id: 1 });
feedbackSchema.index({ supervisor_id: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
