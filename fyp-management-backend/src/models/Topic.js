const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 255 },
  description: { type: String, required: true, maxlength: 5000 },
  supervisor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  concentration: { type: String, required: true },
  academicYear: { type: Number, min: 1, max: 6 },
  keywords: [String],
  referenceDocuments: [{ name: String, url: String }],
  status: { type: String, enum: ['Draft', 'Active', 'Archived'], default: 'Active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

topicSchema.index({ supervisor_id: 1 });
topicSchema.index({ concentration: 1 });
topicSchema.index({ status: 1 });

module.exports = mongoose.model('Topic', topicSchema);
