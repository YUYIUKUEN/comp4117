const express = require('express');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const {
  getAllUsers,
  getUserById,
  deactivateUser,
  reactivateUser,
} = require('../controllers/userManagementController');

const router = express.Router();

// Get all users with filtering and pagination - Admin only
router.get('/', authenticate, requireRole('Admin'), getAllUsers);

// Get user by ID - Admin only
router.get('/:userId', authenticate, requireRole('Admin'), getUserById);

// Deactivate user - Admin only
router.post('/:userId/deactivate', authenticate, requireRole('Admin'), deactivateUser);

// Reactivate user - Admin only
router.post('/:userId/reactivate', authenticate, requireRole('Admin'), reactivateUser);

module.exports = router;
