const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

/**
 * Get all users with filtering and pagination
 * Admin only
 */
const getAllUsers = async (req, res, next) => {
  try {
    // Role check is handled by requireRole('Admin') middleware on the route
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
    // Role check is handled by requireRole('Admin') middleware on the route
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
    // Role check is handled by requireRole('Admin') middleware on the route
    const { userId } = req.params;
    const { reason } = req.body;

    // Prevent self-deactivation
    if (userId === req.auth.userId) {
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
      user_id: req.auth.userId,
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
    // Role check is handled by requireRole('Admin') middleware on the route
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
      user_id: req.auth.userId,
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

/**
 * Create a new user
 * Admin only
 */
const createUser = async (req, res, next) => {
  try {
    // Role check is handled by requireRole('Admin') middleware on the route
    const { email, fullName, role, concentration, phone, password } = req.body;

    // Validate required fields
    if (!email || !fullName || !role) {
      return res.status(400).json({
        error: 'Email, fullName, and role are required',
        code: 'VALIDATION_ERROR',
        status: 400,
      });
    }

    // Validate role
    if (!['Student', 'Supervisor', 'Admin'].includes(role)) {
      return res.status(400).json({
        error: 'Role must be Student, Supervisor, or Admin',
        code: 'VALIDATION_ERROR',
        status: 400,
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        error: 'A user with this email already exists',
        code: 'DUPLICATE_EMAIL',
        status: 409,
      });
    }

    const bcrypt = require('bcryptjs');
    const defaultPassword = password || 'changeme123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      fullName,
      role,
      concentration: concentration || undefined,
      phone: phone || undefined,
    });

    // Log activity
    await ActivityLog.create({
      user_id: req.auth.userId,
      action: 'user_created',
      entityType: 'User',
      entityId: user._id.toString(),
      details: { role, email },
    });

    // Return user without passwordHash
    const userObj = user.toObject();
    delete userObj.passwordHash;

    res.status(201).json({
      data: userObj,
      status: 201,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  deactivateUser,
  reactivateUser,
};
