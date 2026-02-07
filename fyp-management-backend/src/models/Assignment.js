const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  supervisor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assigned_at: { type: Date, default: Date.now },
  status: { type: String, enum: ['Active', 'Completed', 'Changed'], default: 'Active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

assignmentSchema.index({ student_id: 1 });
assignmentSchema.index({ supervisor_id: 1 });
assignmentSchema.index({ status: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
