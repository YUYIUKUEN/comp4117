const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const {
  getSupervisorPendingRequests,
  createTopicChangeRequest,
  approveTopicChangeRequest,
  rejectTopicChangeRequest,
} = require('../controllers/topicChangeRequestController');

/**
 * Student endpoints
 */

// Create topic change request
router.post('/', authenticate, requireRole('Student'), createTopicChangeRequest);

/**
 * Supervisor endpoints
 */

// Get pending topic change requests for supervisor's topics
router.get(
  '/supervisor/pending',
  authenticate,
  requireRole('Supervisor'),
  getSupervisorPendingRequests
);

// Approve topic change request
router.post(
  '/:requestId/approve',
  authenticate,
  requireRole('Supervisor'),
  approveTopicChangeRequest
);

// Reject topic change request
router.post(
  '/:requestId/reject',
  authenticate,
  requireRole('Supervisor'),
  rejectTopicChangeRequest
);

module.exports = router;
