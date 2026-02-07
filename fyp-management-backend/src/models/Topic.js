const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Topic title required'],
    minlength: [5, 'Title must be 5+ characters'],
    maxlength: [255, 'Title must be 255 characters or less'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description required'],
    minlength: [50, 'Description must be 50+ characters'],
    maxlength: [5000, 'Description must be 5000 characters or less'],
  },
  supervisor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Supervisor required'],
  },
  concentration: {
    type: String,
    required: [true, 'Concentration required'],
    enum: ['Software Engineering', 'Systems', 'AI/ML', 'Cybersecurity', 'Other'],
  },
  academicYear: {
    type: Number,
    min: [1, 'Academic year must be 1-6'],
    max: [6, 'Academic year must be 1-6'],
  },
  keywords: {
    type: [String],
    validate: {
      validator: (v) => v.length <= 10,
      message: 'Maximum 10 keywords',
    },
  },
  referenceDocuments: [
    {
      name: { type: String, maxlength: 255 },
      url: { type: String, match: [/^https?:\/\/.+/, 'Invalid URL'] },
    },
  ],
  status: {
    type: String,
    enum: ['Draft', 'Active', 'Archived'],
    default: 'Draft',
    index: true,
  },
  applicationDeadline: Date,
  maxApplications: { type: Number, min: 1, default: 5 },
  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date, default: Date.now },
  archivedAt: Date,
}, { timestamps: true });

// Indexes for query performance
topicSchema.index({ supervisor_id: 1, status: 1 });
topicSchema.index({ concentration: 1, status: 1 });
topicSchema.index({ status: 1, academicYear: 1 });
topicSchema.index({ keywords: 1 });
topicSchema.index({ title: 'text', description: 'text', keywords: 'text' });

module.exports = mongoose.model('Topic', topicSchema);
