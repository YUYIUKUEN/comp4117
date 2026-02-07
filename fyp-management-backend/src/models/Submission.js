const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student required'],
  },
  topic_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: [true, 'Topic required'],
  },
  phase: {
    type: String,
    enum: ['Initial Statement', 'Progress Report 1', 'Progress Report 2', 'Final Dissertation'],
    required: [true, 'Phase required'],
    index: true,
  },
  status: {
    type: String,
    enum: ['Not Submitted', 'Submitted', 'Overdue', 'Declared Not Needed'],
    default: 'Not Submitted',
    index: true,
  },
  submittedAt: Date,
  files: [{
    _id: false,
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimetype: {
      type: String,
      enum: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      required: true,
    },
    size: {
      type: Number,
      required: true,
      max: [52428800, 'File size max 50MB'],
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    url: {
      type: String,
      required: true,
    },
  }],
  declarationReason: {
    type: String,
    maxlength: [1000, 'Declaration reason max 1000 characters'],
  },
  declaredAt: Date,
  dueDate: {
    type: Date,
    required: true,
  },
  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date, default: Date.now },
});

// Composite unique index: student can have one submission per phase
submissionSchema.index({ student_id: 1, phase: 1 }, { unique: true });
submissionSchema.index({ student_id: 1, status: 1 });
submissionSchema.index({ dueDate: 1, status: 1 });

// Check deadline status before save
submissionSchema.pre('save', function(next) {
  if (this.status === 'Not Submitted' && this.dueDate < new Date()) {
    this.status = 'Overdue';
  }
  next();
});

module.exports = mongoose.model('Submission', submissionSchema);
