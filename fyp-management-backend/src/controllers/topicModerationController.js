const Topic = require('../models/Topic');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');

/**
 * Flag a topic for moderation
 * Admin only
 */
const flagTopic = async (req, res, next) => {
  try {
    const admin = await User.findById(req.auth.userId);
    if (!admin || admin.role !== 'Admin') {
      return res.status(403).json({
        error: 'Only admins can flag topics',
        code: 'FORBIDDEN',
        status: 403,
      });
    }

    const { topicId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        error: 'Reason is required',
        code: 'INVALID_REQUEST',
        status: 400,
      });
    }

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({
        error: 'Topic not found',
        code: 'NOT_FOUND',
        status: 404,
      });
    }

    // Add flag to topic
    if (!topic.flags) {
      topic.flags = [];
    }
    topic.flags.push({
      reason,
      flaggedBy: admin._id,
      flaggedAt: new Date(),
    });

    await topic.save();

    // Log activity
    await ActivityLog.create({
      user_id: admin._id,
      action: 'topic_flagged',
      entityType: 'Topic',
      entityId: topicId,
      details: { reason },
    });

    res.json({
      data: topic,
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get flagged topics
 * Admin only
 */
const getFlaggedTopics = async (req, res, next) => {
  try {
    const admin = await User.findById(req.auth.userId);
    if (!admin || admin.role !== 'Admin') {
      return res.status(403).json({
        error: 'Only admins can view flagged topics',
        code: 'FORBIDDEN',
        status: 403,
      });
    }

    const { limit = 50, page = 1 } = req.query;
    const skipAmount = (page - 1) * limit;

    const topics = await Topic.find({ flags: { $exists: true, $ne: [] } })
      .skip(skipAmount)
      .limit(parseInt(limit))
      .sort({ 'flags.0.flaggedAt': -1 });

    const total = await Topic.countDocuments({ flags: { $exists: true, $ne: [] } });

    res.json({
      data: {
        topics,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear flags from a topic
 * Admin only - Marks topic as reviewed
 */
const clearTopicFlags = async (req, res, next) => {
  try {
    const admin = await User.findById(req.auth.userId);
    if (!admin || admin.role !== 'Admin') {
      return res.status(403).json({
        error: 'Only admins can clear topic flags',
        code: 'FORBIDDEN',
        status: 403,
      });
    }

    const { topicId } = req.params;
    const { reason } = req.body;

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({
        error: 'Topic not found',
        code: 'NOT_FOUND',
        status: 404,
      });
    }

    topic.flags = [];
    await topic.save();

    // Log activity
    await ActivityLog.create({
      user_id: admin._id,
      action: 'topic_flags_cleared',
      entityType: 'Topic',
      entityId: topicId,
      details: { reason: reason || 'Flags cleared by admin' },
    });

    res.json({
      data: topic,
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Archive a topic
 * Admin only
 */
const archiveTopic = async (req, res, next) => {
  try {
    const admin = await User.findById(req.auth.userId);
    if (!admin || admin.role !== 'Admin') {
      return res.status(403).json({
        error: 'Only admins can archive topics',
        code: 'FORBIDDEN',
        status: 403,
      });
    }

    const { topicId } = req.params;
    const { reason } = req.body;

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({
        error: 'Topic not found',
        code: 'NOT_FOUND',
        status: 404,
      });
    }

    if (topic.status === 'Archived') {
      return res.status(400).json({
        error: 'Topic is already archived',
        code: 'INVALID_OPERATION',
        status: 400,
      });
    }

    topic.status = 'Archived';
    await topic.save();

    // Log activity
    await ActivityLog.create({
      user_id: admin._id,
      action: 'topic_archived',
      entityType: 'Topic',
      entityId: topicId,
      details: { previousStatus: topic.status, reason: reason || 'Archived by admin' },
    });

    res.json({
      data: topic,
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  flagTopic,
  getFlaggedTopics,
  clearTopicFlags,
  archiveTopic,
};
