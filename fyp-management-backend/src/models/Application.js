const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    topic_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      required: true,
    },
    preference_rank: {
      type: Number,
      required: true,
      enum: [1, 2, 3, 4, 5],
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
      required: true,
    },
    supervisorNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    decidedAt: {
      type: Date,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique constraint: student can apply to each topic only once
applicationSchema.index({ student_id: 1, topic_id: 1 }, { unique: true });

// Indexes for queries
applicationSchema.index({ student_id: 1, status: 1 });
applicationSchema.index({ topic_id: 1, status: 1 });
applicationSchema.index({ status: 1, appliedAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);
