const express = require('express');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const {
  getSystemStats,
  getConcentrationStats,
  getApplicationStats,
  getSubmissionDeadlineStats,
} = require('../controllers/dashboardController');

const router = express.Router();

// System-wide statistics - Admin only
router.get('/system-stats', authenticate, requireRole('Admin'), getSystemStats);

// Concentration-based topic statistics - Admin only
router.get('/concentration-stats', authenticate, requireRole('Admin'), getConcentrationStats);

// Application statistics by status - Admin only
router.get('/application-stats', authenticate, requireRole('Admin'), getApplicationStats);

// Submission deadline statistics - Admin only
router.get('/submission-deadline-stats', authenticate, requireRole('Admin'), getSubmissionDeadlineStats);

module.exports = router;
