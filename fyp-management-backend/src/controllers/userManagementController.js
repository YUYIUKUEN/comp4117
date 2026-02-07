const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

/**
 * Get all users with filtering and pagination
 * Admin only
 */
const getAllUsers = async (req, res, next) => {
  try {
    const admin = await User.findById(req.auth.userId);
    if (!admin || admin.role !== 'Admin') {
      return res.status(403).json({
        error: 'Only admins can view users',
        code: 'FORBIDDEN',
        status: 403,
      });
    }

    const { role, status = 'active', limit = 50, page = 1 } = req.query;

    const filter = {};
    if (role) {
      filter.role = role;
    }
    if (status === 'active') {
      filter.deactivatedAt = null;
    } else if (status === 'deactivated') {
      filter.deactivatedAt = { $ne: null };
    }

    const skipAmount = (page - 1) * limit;

    const users = await User.find(filter)
      .select('-passwordHash')
      .skip(skipAmount)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.json({
      data: {
        users,
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
 * Get a specific user by ID
 * Admin only
 */
const getUserById = async (req, res, next) => {
  try {
    const admin = await User.findById(req.auth.userId);
    if (!admin || admin.role !== 'Admin') {
      return res.status(403).json({
        error: 'Only admins can view user details',
        code: 'FORBIDDEN',
        status: 403,
      });
    }

    const user = await User.findById(req.params.userId).select('-passwordHash');

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'NOT_FOUND',
        status: 404,
      });
    }

    res.json({
      data: user,
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate a user
 * Admin only - Cannot deactivate self
 */
const deactivateUser = async (req, res, next) => {
  try {
    const admin = await User.findById(req.auth.userId);
    if (!admin || admin.role !== 'Admin') {
      return res.status(403).json({
        error: 'Only admins can deactivate users',
        code: 'FORBIDDEN',
        status: 403,
      });
    }

    const { userId } = req.params;
    const { reason } = req.body;

    // Prevent self-deactivation
    if (userId === admin._id.toString()) {
      return res.status(400).json({
        error: 'Cannot deactivate yourself',
        code: 'INVALID_OPERATION',
        status: 400,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'NOT_FOUND',
        status: 404,
      });
    }

    // Skip if already deactivated
    if (user.deactivatedAt) {
      return res.status(400).json({
        error: 'User is already deactivated',
        code: 'INVALID_OPERATION',
        status: 400,
      });
    }

    user.deactivatedAt = new Date();
    await user.save();

    // Log activity
    await ActivityLog.create({
      user_id: admin._id,
      action: 'user_deactivated',
      entityType: 'User',
      entityId: userId,
      details: { reason: reason || 'No reason provided' },
    });

    res.json({
      data: user,
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reactivate a user
 * Admin only
 */
const reactivateUser = async (req, res, next) => {
  try {
    const admin = await User.findById(req.auth.userId);
    if (!admin || admin.role !== 'Admin') {
      return res.status(403).json({
        error: 'Only admins can reactivate users',
        code: 'FORBIDDEN',
        status: 403,
      });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'NOT_FOUND',
        status: 404,
      });
    }

    // Skip if already active
    if (!user.deactivatedAt) {
      return res.status(400).json({
        error: 'User is already active',
        code: 'INVALID_OPERATION',
        status: 400,
      });
    }

    user.deactivatedAt = null;
    await user.save();

    // Log activity
    await ActivityLog.create({
      user_id: admin._id,
      action: 'user_reactivated',
      entityType: 'User',
      entityId: user._id.toString(),
      details: { reason: 'User reactivated by admin' },
    });

    res.json({
      data: user,
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  deactivateUser,
  reactivateUser,
};
