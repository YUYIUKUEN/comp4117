const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  assignment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' },
  phase: { type: String, enum: ['Initial Statement', 'Progress Report 1', 'Progress Report 2', 'Final Dissertation'] },
  status: { type: String, enum: ['Not Submitted', 'Submitted', 'Overdue', 'Declared Not Needed'], default: 'Not Submitted' },
  submittedAt: Date,
  submittedDate: Date,
  files: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now },
    url: String,
  }],
  declarationReason: { type: String, maxlength: 1000 },
  declaredAt: Date,
  dueDate: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Pre-save hook to update status to Overdue if dueDate is in the past
submissionSchema.pre('save', function(next) {
  if (this.dueDate && this.dueDate < new Date() && this.status === 'Not Submitted') {
    this.status = 'Overdue';
  }
  next();
});

// Validate file sizes (max 50MB per file)
submissionSchema.pre('save', function(next) {
  const maxFileSize = 50 * 1024 * 1024; // 50MB
  for (const file of this.files) {
    if (file.size > maxFileSize) {
      return next(new Error(`File size exceeds 50MB limit: ${file.originalName}`));
    }
  }
  next();
});

submissionSchema.index({ student_id: 1, phase: 1 }, { unique: true });
submissionSchema.index({ status: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
