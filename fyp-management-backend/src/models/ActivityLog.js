const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true, maxlength: 100 },
  entityType: { type: String, required: true },
  entityId: { type: mongoose.Schema.Types.Mixed }, // Can be ObjectId or string
  details: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now, immutable: true },
  ipAddress: String,
});

activityLogSchema.index({ user_id: 1, timestamp: -1 });
activityLogSchema.index({ entityType: 1, entityId: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
