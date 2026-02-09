const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { comparePassword, hashPassword, validatePasswordStrength } = require('../utils/password');
const { generateTokens } = require('../utils/jwt');
const crypto = require('crypto');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password required',
        code: 'INVALID_INPUT',
        status: 400,
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists (security best practice)
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'AUTH_FAILED',
        status: 401,
      });
    }

    // Check deactivation status
    if (user.deactivatedAt) {
      return res.status(403).json({
        error: 'Account deactivated',
        code: 'ACCOUNT_DEACTIVATED',
        status: 403,
      });
    }

    // Verify password
    const passwordMatch = await comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
      // Log failed attempt
      await ActivityLog.create({
        user_id: user._id,
        action: 'login_failed',
        entityType: 'User',
        entityId: user._id,
        details: { reason: 'invalid_password' },
        ipAddress: req.ip,
      });

      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'AUTH_FAILED',
        status: 401,
      });
    }

    // Generate tokens
    const { token, expiresIn, expiresAt } = generateTokens(user._id, user.role);

    // Log successful login
    await ActivityLog.create({
      user_id: user._id,
      action: 'login',
      entityType: 'User',
      entityId: user._id,
      ipAddress: req.ip,
    });

    return res.json({
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
        expiresIn,
        expiresAt,
      },
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const userId = req.auth.userId;

    // Log logout
    await ActivityLog.create({
      user_id: userId,
      action: 'logout',
      entityType: 'User',
      entityId: userId,
      ipAddress: req.ip,
    });

    res.json({
      data: { message: 'Logged out successfully' },
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const user = await User.findById(userId);

    if (!user || user.deactivatedAt) {
      return res.status(401).json({
        error: 'User not found or deactivated',
        code: 'USER_NOT_FOUND',
        status: 401,
      });
    }

    const { token, expiresIn, expiresAt } = generateTokens(userId, user.role);

    res.json({
      data: {
        token,
        expiresIn,
        expiresAt,
      },
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email required',
        code: 'INVALID_INPUT',
        status: 400,
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if user exists (security)
      return res.json({
        data: { message: 'If account exists, reset email sent' },
        status: 200,
      });
    }

    // Generate reset token (24 hours)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Store reset token (would send in email in production)
    // For now, just log it
    console.log(`Password reset token for ${email}: ${resetToken}`);

    await ActivityLog.create({
      user_id: user._id,
      action: 'password_reset_requested',
      entityType: 'User',
      entityId: user._id,
      details: { expiresAt },
    });

    return res.json({
      data: { message: 'If account exists, reset email sent' },
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const userId = req.auth.userId;

    if (!newPassword) {
      return res.status(400).json({
        error: 'New password required',
        code: 'INVALID_INPUT',
        status: 400,
      });
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return res.status(400).json({
        error: `Password must have: ${strength.errors.join(', ')}`,
        code: 'WEAK_PASSWORD',
        status: 400,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND',
        status: 404,
      });
    }

    user.passwordHash = await hashPassword(newPassword);
    user.updatedAt = new Date();
    await user.save();

    await ActivityLog.create({
      user_id: userId,
      action: 'password_changed',
      entityType: 'User',
      entityId: userId,
    });

    return res.json({
      data: { message: 'Password changed successfully' },
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, logout, refresh, requestPasswordReset, resetPassword };
