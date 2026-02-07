const express = require('express');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const {
  flagTopic,
  getFlaggedTopics,
  clearTopicFlags,
  archiveTopic,
} = require('../controllers/topicModerationController');

const router = express.Router();

// Get flagged topics - Admin only
router.get('/flagged', authenticate, requireRole('Admin'), getFlaggedTopics);

// Flag a topic for moderation - Admin only
router.post('/:topicId/flag', authenticate, requireRole('Admin'), flagTopic);

// Clear flags from a topic - Admin only
router.post('/:topicId/clear-flags', authenticate, requireRole('Admin'), clearTopicFlags);

// Archive a topic - Admin only
router.post('/:topicId/archive', authenticate, requireRole('Admin'), archiveTopic);

module.exports = router;
