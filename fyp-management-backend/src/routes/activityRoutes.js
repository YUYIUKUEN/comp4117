const express = require('express');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const {
  getActivityLogs,
  getUserActivityLog,
  getEntityActivityLog,
  getActivityStats,
  exportActivityLog,
} = require('../controllers/activityController');

const router = express.Router();

// System-wide activity logs - Admin only
router.get('/', authenticate, requireRole('Admin'), getActivityLogs);

// Activity statistics - Admin only
router.get('/stats', authenticate, requireRole('Admin'), getActivityStats);

// Export activity logs - Admin only
router.get('/export', authenticate, requireRole('Admin'), exportActivityLog);

// User-specific activity logs - User can view own, admin can view any
router.get('/user/:userId', authenticate, getUserActivityLog);

// Entity-specific activity logs - Track all actions on specific entity
router.get('/:entityType/:entityId', authenticate, getEntityActivityLog);

module.exports = router;
