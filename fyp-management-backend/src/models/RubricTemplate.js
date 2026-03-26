const mongoose = require('mongoose');

const rubricItemSchema = new mongoose.Schema({
  _id: false,
  title: { type: String, maxlength: 200 },
  description: { type: String, maxlength: 500 },
  minScore: { type: Number, default: 0 },
  maxScore: { type: Number, default: 10 },
  levels: [{ 
    _id: false,
    name: { type: String },
    description: { type: String, maxlength: 300 },
  }],
}, { _id: false });

const rubricTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Template name required'],
    trim: true,
    maxlength: 200,
    unique: true,
  },
  description: {
    type: String,
    maxlength: 500,
    default: '',
  },
  rubricItems: [rubricItemSchema],
  isDefault: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

rubricTemplateSchema.index({ name: 1 });

module.exports = mongoose.model('RubricTemplate', rubricTemplateSchema);
