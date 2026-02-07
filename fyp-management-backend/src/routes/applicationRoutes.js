const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const {
  applyToTopic,
  getMyApplications,
  getSupervisorApplications,
  getApplicationById,
  withdrawApplication,
  getApplicationStats,
  getTopicApplicationStats,
  approveApplication,
  rejectApplication,
} = require('../controllers/applicationController');

/**
 * Student endpoints
 */

// Apply to a topic
router.post('/', authenticate, requireRole(['Student']), applyToTopic);

// Get student's applications
router.get('/my-applications', authenticate, requireRole(['Student']), getMyApplications);

// Withdraw application
router.delete('/:id', authenticate, requireRole(['Student']), withdrawApplication);

/**
 * Supervisor endpoints
 */

// Get applications for supervisor's topics
router.get(
  '/supervisor/applications',
  authenticate,
  requireRole(['Supervisor']),
  getSupervisorApplications
);

// Approve application
router.post(
  '/:applicationId/approve',
  authenticate,
  requireRole(['Supervisor']),
  approveApplication
);

// Reject application
router.post(
  '/:applicationId/reject',
  authenticate,
  requireRole(['Supervisor']),
  rejectApplication
);

// Get application statistics
router.get('/stats/overview', authenticate, requireRole(['Supervisor']), getApplicationStats);

// Get topic-specific statistics
router.get(
  '/topic/:topicId/stats',
  authenticate,
  requireRole(['Supervisor']),
  getTopicApplicationStats
);

/**
 * Public/Any authenticated user endpoints
 */

// Get application by ID
router.get('/:id', authenticate, getApplicationById);

module.exports = router;
