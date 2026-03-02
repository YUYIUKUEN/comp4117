const express = require('express');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const {
  addFeedback,
  getFeedback,
  updateFeedback,
  deleteFeedback,
  getFeedbackStats,
  getStudentRecentFeedback,
  replyToFeedback,
} = require('../controllers/feedbackController');

const router = express.Router();

// Student: get recent feedback across all submissions
router.get(
  '/student/recent',
  authenticate,
  requireRole('Student'),
  getStudentRecentFeedback
);

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

// Reply to feedback - students and supervisors
router.post(
  '/:feedbackId/replies',
  authenticate,
  replyToFeedback
);

module.exports = router;
