const express = require('express');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const {
  getSystemHealth,
  getDatabaseStats,
  healthCheck,
} = require('../controllers/healthController');

const router = express.Router();

// Simple health check (no auth required) - for load balancers
router.get('/check', healthCheck);

// System health status - Admin only
router.get('/', authenticate, requireRole('Admin'), getSystemHealth);

// Database statistics - Admin only
router.get('/database', authenticate, requireRole('Admin'), getDatabaseStats);

module.exports = router;
