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

// Supervisor personal routes (must be before /:topicId to avoid param capture)
router.get('/my-topics/list', authenticate, requireRole('Supervisor'), getMyTopics);

// Supervisor nested routes (for frontend compatibility)
router.get('/supervisor/topics', authenticate, requireRole('Supervisor'), getMyTopics);
router.post('/supervisor/topics', authenticate, requireRole('Supervisor'), createTopic);
router.put('/supervisor/topics/:topicId', authenticate, requireRole('Supervisor'), updateTopic);

// Parameterised routes (must come after literal path segments)
router.get('/:topicId', getTopicById); // Get specific topic details

// Supervisor routes (require authentication)
router.post('/', authenticate, requireRole('Supervisor'), createTopic);
router.put('/:topicId', authenticate, requireRole('Supervisor'), updateTopic);
router.post('/:topicId/publish', authenticate, requireRole('Supervisor'), publishTopic);
router.post('/:topicId/archive', authenticate, requireRole('Supervisor'), archiveTopic);

// Admin routes
router.delete('/:topicId', authenticate, requireRole('Admin', 'Supervisor'), deleteTopic);

module.exports = router;
