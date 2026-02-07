const User = require('../models/User');
const Topic = require('../models/Topic');
const Application = require('../models/Application');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Feedback = require('../models/Feedback');

/**
 * Get system-wide statistics
 * Admin only - Returns counts for users, topics, applications, etc.
 */
const getSystemStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.userId);
    if (!user || user.role !== 'Admin') {
      return res.status(403).json({
        error: 'Only admins can view system stats',
        code: 'FORBIDDEN',
        status: 403,
      });
    }

    // User statistics
    const userStats = {
      total: await User.countDocuments(),
      students: await User.countDocuments({ role: 'Student' }),
      supervisors: await User.countDocuments({ role: 'Supervisor' }),
      admins: await User.countDocuments({ role: 'Admin' }),
      active: await User.countDocuments({ deactivatedAt: null }),
      deactivated: await User.countDocuments({ deactivatedAt: { $ne: null } }),
    };

    // Topic statistics
    const topicStats = {
      total: await Topic.countDocuments(),
      draft: await Topic.countDocuments({ status: 'Draft' }),
      active: await Topic.countDocuments({ status: 'Active' }),
      archived: await Topic.countDocuments({ status: 'Archived' }),
    };

    // Application statistics
    const applicationStats = {
      total: await Application.countDocuments(),
      pending: await Application.countDocuments({ status: 'Pending' }),
      approved: await Application.countDocuments({ status: 'Approved' }),
      rejected: await Application.countDocuments({ status: 'Rejected' }),
    };

    // Assignment statistics
    const assignmentStats = {
      active: await Assignment.countDocuments({ status: 'Active' }),
      completed: await Assignment.countDocuments({ status: 'Completed' }),
      changed: await Assignment.countDocuments({ status: 'Changed' }),
    };

    // Submission statistics
    const submissionStats = {
      total: await Submission.countDocuments(),
      submitted: await Submission.countDocuments({ status: 'Submitted' }),
      notSubmitted: await Submission.countDocuments({ status: 'Not Submitted' }),
      overdue: await Submission.countDocuments({ status: 'Overdue' }),
      declared: await Submission.countDocuments({ status: 'Declared Not Needed' }),
    };

    res.json({
      data: {
        timestamp: new Date(),
        users: userStats,
        topics: topicStats,
        applications: applicationStats,
        assignments: assignmentStats,
        submissions: submissionStats,
      },
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get topic statistics grouped by concentration
 * Admin only
 */
const getConcentrationStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.userId);
    if (!user || user.role !== 'Admin') {
      return res.status(403).json({
        error: 'Only admins can view stats',
        code: 'FORBIDDEN',
        status: 403,
      });
    }

    const stats = await Topic.aggregate([
      {
        $match: { status: 'Active' },
      },
      {
        $group: {
          _id: '$concentration',
          topicCount: { $sum: 1 },
        },
      },
      { $sort: { topicCount: -1 } },
    ]);

    res.json({
      data: {
        concentrations: stats,
      },
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get application statistics grouped by status
 * Admin only
 */
const getApplicationStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.userId);
    if (!user || user.role !== 'Admin') {
      return res.status(403).json({
        error: 'Only admins can view stats',
        code: 'FORBIDDEN',
        status: 403,
      });
    }

    const stats = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    stats.forEach(stat => {
      result[stat._id.toLowerCase()] = stat.count;
      result.total += stat.count;
    });

    res.json({
      data: result,
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get submission deadline statistics
 * Admin only
 */
const getSubmissionDeadlineStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.userId);
    if (!user || user.role !== 'Admin') {
      return res.status(403).json({
        error: 'Only admins can view stats',
        code: 'FORBIDDEN',
        status: 403,
      });
    }

    const now = new Date();

    const stats = {
      total: await Submission.countDocuments(),
      submitted: await Submission.countDocuments({ status: 'Submitted' }),
      pending: await Submission.countDocuments({ status: 'Not Submitted' }),
      overdue: await Submission.countDocuments({
        status: 'Not Submitted',
        dueDate: { $lt: now },
      }),
      dueSoon: await Submission.countDocuments({
        status: 'Not Submitted',
        dueDate: {
          $gte: now,
          $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    };

    res.json({
      data: stats,
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSystemStats,
  getConcentrationStats,
  getApplicationStats,
  getSubmissionDeadlineStats,
};
