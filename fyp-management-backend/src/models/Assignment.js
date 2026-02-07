const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
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
    supervisor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assigned_at: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Changed'],
      default: 'Active',
      required: true,
    },
    replacedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique sparse constraint: max 1 active assignment per student
assignmentSchema.index({ student_id: 1, status: 1 }, { unique: true, sparse: true });

// Indexes for queries
assignmentSchema.index({ supervisor_id: 1, status: 1 });
assignmentSchema.index({ topic_id: 1, status: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
