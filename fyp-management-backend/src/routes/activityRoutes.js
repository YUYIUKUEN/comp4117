const express = require('express');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const {
  getActivityLogs,
  getUserActivityLog,
  getStudentActivityLog,
  getEntityActivityLog,
  getSupervisorActivityLog,
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

// Student-specific activity logs (includes student & supervisor actions on their submissions)
router.get('/student/:studentId', authenticate, getStudentActivityLog);

// Supervisor-specific activity logs (includes feedback replies and topic activities)
router.get('/supervisor/:supervisorId', authenticate, getSupervisorActivityLog);

// User-specific activity logs - User can view own, admin can view any
router.get('/user/:userId', authenticate, getUserActivityLog);

// Entity-specific activity logs - Track all actions on specific entity
router.get('/:entityType/:entityId', authenticate, getEntityActivityLog);

module.exports = router;
