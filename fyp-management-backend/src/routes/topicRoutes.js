const express = require('express');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const {
  createTopic,
  getTopics,
  getTopicById,
  updateTopic,
  publishTopic,
  archiveTopic,
  deleteTopic,
  getMyTopics,
} = require('../controllers/topicController');

const router = express.Router();

// Public routes
router.get('/', getTopics); // List all active topics
router.get('/:topicId', getTopicById); // Get specific topic details

// Supervisor routes (require authentication)
router.post('/', authenticate, requireRole('Supervisor'), createTopic);
router.put('/:topicId', authenticate, requireRole('Supervisor'), updateTopic);
router.post('/:topicId/publish', authenticate, requireRole('Supervisor'), publishTopic);
router.post('/:topicId/archive', authenticate, requireRole('Supervisor'), archiveTopic);

// Supervisor personal routes
router.get('/my-topics/list', authenticate, requireRole('Supervisor'), getMyTopics);

// Admin routes
router.delete('/:topicId', authenticate, requireRole('Admin'), deleteTopic);

module.exports = router;
