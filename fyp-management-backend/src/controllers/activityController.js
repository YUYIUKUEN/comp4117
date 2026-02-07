const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Get all activity logs - Admin only
 * Supports filtering by action, entityType, userId, and date range
 */
const getActivityLogs = async (req, res, next) => {
  try {
    // Verify admin role
    const user = await User.findById(req.auth.userId);
    if (!user || user.role !== 'Admin') {
      return res.status(403).json({
        error: 'Only admins can view activity logs',
        code: 'ADMIN_ONLY',
        status: 403,
      });
    }

    const {
      action,
      entityType,
      userId,
      startDate,
      endDate,
      limit = 100,
      page = 1,
    } = req.query;

    const filter = {};

    if (action) {
      filter.action = action;
    }
    if (entityType) {
      filter.entityType = entityType;
    }
    if (userId) {
      filter.user_id = userId;
    }
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate);
      }
    }

    const skipAmount = (page - 1) * limit;

    const logs = await ActivityLog.find(filter)
      .populate('user_id', 'fullName email role')
      .sort({ timestamp: -1 })
      .skip(skipAmount)
      .limit(parseInt(limit));

    const total = await ActivityLog.countDocuments(filter);

    res.json({
      data: {
        logs,
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
 * Get activity logs for a specific user
 * Users can see their own logs, admins can see any user's logs
 */
const getUserActivityLog = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const requestingUser = await User.findById(req.auth.userId);

    // Users can view own activity, admins can view any
    if (requestingUser.role !== 'Admin' && requestingUser._id.toString() !== userId) {
      return res.status(403).json({
        error: 'Cannot view other users activity',
        code: 'FORBIDDEN',
        status: 403,
      });
    }

    const { limit = 50, page = 1 } = req.query;
    const skipAmount = (page - 1) * limit;

    const logs = await ActivityLog.find({ user_id: userId })
      .populate('user_id', 'fullName email role')
      .sort({ timestamp: -1 })
      .skip(skipAmount)
      .limit(parseInt(limit));

    const total = await ActivityLog.countDocuments({ user_id: userId });

    res.json({
      data: {
        logs,
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
 * Get activity logs for a specific entity
 * Shows all actions performed on an entity (topic, submission, feedback, etc.)
 */
const getEntityActivityLog = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;
    const { limit = 50, page = 1 } = req.query;

    const skipAmount = (page - 1) * limit;

    const logs = await ActivityLog.find({
      entityType,
      entityId,
    })
      .populate('user_id', 'fullName email role')
      .sort({ timestamp: -1 })
      .skip(skipAmount)
      .limit(parseInt(limit));

    const total = await ActivityLog.countDocuments({
      entityType,
      entityId,
    });

    res.json({
      data: {
        logs,
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
 * Get activity statistics - Admin only
 * Returns aggregated stats for specified period (default: last 7 days)
 */
const getActivityStats = async (req, res, next) => {
  try {
    // Verify admin role
    const user = await User.findById(req.auth.userId);
    if (!user || user.role !== 'Admin') {
      return res.status(403).json({
        error: 'Only admins can view activity stats',
        code: 'ADMIN_ONLY',
        status: 403,
      });
    }

    const { days = 7 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Actions in period
    const actionStats = await ActivityLog.aggregate([
      {
        $match: { timestamp: { $gte: startDate } },
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Top users in period
    const userStats = await ActivityLog.aggregate([
      {
        $match: { timestamp: { $gte: startDate } },
      },
      {
        $group: {
          _id: '$user_id',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
    ]);

    const totalLogs = await ActivityLog.countDocuments({
      timestamp: { $gte: startDate },
    });

    res.json({
      data: {
        period: `Last ${days} days`,
        totalLogs,
        actionStats,
        topUsers: userStats,
      },
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export activity logs in JSON or CSV format
 * Admin only
 */
const exportActivityLog = async (req, res, next) => {
  try {
    // Verify admin role
    const user = await User.findById(req.auth.userId);
    if (!user || user.role !== 'Admin') {
      return res.status(403).json({
        error: 'Only admins can export activity logs',
        code: 'ADMIN_ONLY',
        status: 403,
      });
    }

    const { format = 'json', startDate, endDate } = req.query;

    const filter = {};
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate);
      }
    }

    const logs = await ActivityLog.find(filter)
      .populate('user_id', 'fullName email role')
      .lean();

    if (format === 'csv') {
      const csv = convertToCSV(logs);
      res.header('Content-Type', 'text/csv');
      res.header('Content-Disposition', 'attachment; filename="activity-log.csv"');
      res.send(csv);
    } else {
      // JSON format (default)
      const jsonData = {
        exportedAt: new Date().toISOString(),
        count: logs.length,
        logs,
      };
      res.header('Content-Type', 'application/json');
      res.header('Content-Disposition', 'attachment; filename="activity-log.json"');
      res.json(jsonData);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Convert activity logs to CSV format
 */
const convertToCSV = (logs) => {
  const headers = ['timestamp', 'user', 'email', 'role', 'action', 'entityType', 'entityId', 'ipAddress'];

  const rows = logs.map(log => [
    log.timestamp ? log.timestamp.toISOString() : 'N/A',
    log.user_id?.fullName || 'Unknown',
    log.user_id?.email || 'Unknown',
    log.user_id?.role || 'Unknown',
    log.action || '',
    log.entityType || '',
    log.entityId || '',
    log.ipAddress || '',
  ]);

  const csv = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csv;
};

module.exports = {
  getActivityLogs,
  getUserActivityLog,
  getEntityActivityLog,
  getActivityStats,
  exportActivityLog,
};
