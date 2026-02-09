const ActivityLog = require('../models/ActivityLog');

const LOG_ACTIONS = {
  // Auth actions
  LOGIN: 'login',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  PASSWORD_CHANGED: 'password_changed',
  PASSWORD_RESET_REQUESTED: 'password_reset_requested',

  // Topic actions
  TOPIC_CREATED: 'topic_created',
  TOPIC_UPDATED: 'topic_updated',
  TOPIC_PUBLISHED: 'topic_published',
  TOPIC_ARCHIVED: 'topic_archived',
  TOPIC_DELETED: 'topic_deleted',

  // Application actions
  APPLICATION_SUBMITTED: 'application_submitted',
  APPLICATION_WITHDRAWN: 'application_withdrawn',
  APPLICATION_APPROVED: 'application_approved',
  APPLICATION_REJECTED: 'application_rejected',

  // Submission actions
  SUBMISSION_CREATED: 'submission_created',
  DOCUMENT_SUBMITTED: 'document_submitted',
  DOCUMENT_DOWNLOADED: 'document_downloaded',
  SUBMISSION_DECLARED: 'submission_declared_not_needed',

  // Feedback actions
  FEEDBACK_ADDED: 'feedback_added',
  FEEDBACK_UPDATED: 'feedback_updated',
  FEEDBACK_DELETED: 'feedback_deleted',

  // Assignment actions
  ASSIGNMENT_CREATED: 'assignment_created',
  ASSIGNMENT_COMPLETED: 'assignment_completed',
};

/**
 * Log a single activity
 * Logging failures should not break functionality (fail silently)
 */
const logActivity = async (userId, action, entityType, entityId, options = {}) => {
  try {
    if (!userId || !action || !entityType) {
      console.warn('Missing required logging fields:', { userId, action, entityType });
      return null;
    }

    const log = new ActivityLog({
      user_id: userId,
      action,
      entityType,
      entityId,
      details: options.details || {},
      ipAddress: options.ipAddress,
    });

    await log.save();
    return log;
  } catch (error) {
    console.error('Error logging activity:', error.message);
    // Don't throw - logging should not break functionality
    return null;
  }
};

/**
 * Log multiple activities in batch
 * More efficient than individual calls for bulk operations
 */
const logBatchActivity = async (userId, actions, options = {}) => {
  try {
    if (!Array.isArray(actions) || actions.length === 0) {
      return [];
    }

    const logs = actions.map(action => ({
      user_id: userId,
      action: action.action,
      entityType: action.entityType,
      entityId: action.entityId,
      details: action.details || {},
      ipAddress: options.ipAddress,
      timestamp: new Date(),
    }));

    const result = await ActivityLog.insertMany(logs);
    return result;
  } catch (error) {
    console.error('Error batch logging activity:', error.message);
    return [];
  }
};

module.exports = {
  LOG_ACTIONS,
  logActivity,
  logBatchActivity,
};
