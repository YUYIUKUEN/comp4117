const express = require('express');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const {
  addFeedback,
  getFeedback,
  updateFeedback,
  deleteFeedback,
  getFeedbackStats,
} = require('../controllers/feedbackController');

const router = express.Router();

// Create feedback - supervisor only
router.post(
  '/submissions/:submissionId/feedback',
  authenticate,
  requireRole('Supervisor'),
  addFeedback
);

// Get feedback - authenticated (students see public, supervisors see all)
router.get(
  '/submissions/:submissionId/feedback',
  authenticate,
  getFeedback
);

// Get feedback statistics
router.get(
  '/submissions/:submissionId/stats',
  authenticate,
  getFeedbackStats
);

// Update feedback - supervisor only, owner verification
router.put(
  '/:feedbackId',
  authenticate,
  requireRole('Supervisor'),
  updateFeedback
);

// Delete feedback - supervisor only, owner verification
router.delete(
  '/:feedbackId',
  authenticate,
  requireRole('Supervisor'),
  deleteFeedback
);

module.exports = router;
