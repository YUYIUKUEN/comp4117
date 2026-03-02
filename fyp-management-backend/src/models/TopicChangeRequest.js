const mongoose = require('mongoose');

const topicChangeRequestSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  current_topic_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: true,
  },
  proposed_topic_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: false, // Can be empty if requesting a new topic
  },
  proposed_topic_title: {
    type: String,
    required: false, // For free-text topic proposals
  },
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  supervisor_notes: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('TopicChangeRequest', topicChangeRequestSchema);
