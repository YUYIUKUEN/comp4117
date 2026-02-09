const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const {
  getMyAssignment,
  getSupervisorAssignments,
  getAssignmentById,
  completeAssignment,
} = require('../controllers/assignmentController');

/**
 * Student endpoints
 */

// Get student's active assignment
router.get('/my-assignment', authenticate, requireRole(['Student']), getMyAssignment);

/**
 * Supervisor endpoints
 */

// Get supervisor's assignments
router.get(
  '/supervisor/assignments',
  authenticate,
  requireRole(['Supervisor']),
  getSupervisorAssignments
);

// Complete assignment
router.post('/:id/complete', authenticate, requireRole(['Supervisor']), completeAssignment);

/**
 * Public/Any authenticated user endpoints
 */

// Get assignment by ID
router.get('/:id', authenticate, getAssignmentById);

module.exports = router;
