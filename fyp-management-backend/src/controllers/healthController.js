const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Get system health status
 * Admin only
 */
const getSystemHealth = async (req, res, next) => {
  try {
    const admin = await User.findById(req.auth.userId);
    if (!admin || admin.role !== 'Admin') {
      return res.status(403).json({
        error: 'Only admins can view health status',
        code: 'FORBIDDEN',
        status: 403,
      });
    }

    const memoryUsage = process.memoryUsage();
    const dbConnected = mongoose.connection.readyState === 1;

    const health = {
      timestamp: new Date(),
      status: dbConnected ? 'healthy' : 'degraded',
      database: {
        connected: dbConnected,
        readyState: mongoose.connection.readyState,
        message: dbConnected ? 'Database connection successful' : 'Database connection failed',
      },
      memory: {
        heapUsed: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
        heapTotal: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
        rss: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
        external: Math.round((memoryUsage.external / 1024 / 1024) * 100) / 100,
      },
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
    };

    res.json({
      data: health,
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get database statistics
 * Admin only
 */
const getDatabaseStats = async (req, res, next) => {
  try {
    const admin = await User.findById(req.auth.userId);
    if (!admin || admin.role !== 'Admin') {
      return res.status(403).json({
        error: 'Only admins can view database stats',
        code: 'FORBIDDEN',
        status: 403,
      });
    }

    // Get database stats from admin command
    const admin_db = mongoose.connection.db.admin();
    const dbStats = await admin_db.serverStatus();

    res.json({
      data: {
        timestamp: new Date(),
        connections: dbStats.connections,
        memory: dbStats.mem,
        operations: dbStats.opcounters,
        uptime: dbStats.uptime,
      },
      status: 200,
    });
  } catch (error) {
    // If unable to get full stats, return simplified version
    res.json({
      data: {
        timestamp: new Date(),
        message: 'Partial health data available',
        status: 'partial',
      },
      status: 200,
    });
  }
};

/**
 * Simple health check endpoint (no auth required)
 * Used for load balancers and monitors
 */
const healthCheck = async (req, res, next) => {
  try {
    const dbConnected = mongoose.connection.readyState === 1;

    res.json({
      status: dbConnected ? 'ok' : 'degraded',
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: error.message,
    });
  }
};

module.exports = {
  getSystemHealth,
  getDatabaseStats,
  healthCheck,
};
