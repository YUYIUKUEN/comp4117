const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  phase: { type: String, enum: ['Initial Statement', 'Progress Report 1', 'Progress Report 2', 'Final Dissertation'] },
  status: { type: String, enum: ['Not Submitted', 'Submitted', 'Overdue', 'Declared Not Needed'], default: 'Not Submitted' },
  submittedAt: Date,
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

submissionSchema.index({ student_id: 1, phase: 1 }, { unique: true });
submissionSchema.index({ status: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
