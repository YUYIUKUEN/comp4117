const express = require('express');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
  reactivateUser,
} = require('../controllers/userManagementController');

const router = express.Router();

// Get all users with filtering and pagination - Admin only
router.get('/', authenticate, requireRole('Admin'), getAllUsers);

// Create a new user - Admin only
router.post('/', authenticate, requireRole('Admin'), createUser);

// Get user by ID - Admin only
router.get('/:userId', authenticate, requireRole('Admin'), getUserById);

// Update user by ID - Admin only
router.put('/:userId', authenticate, requireRole('Admin'), updateUser);

// Deactivate user - Admin only
router.post('/:userId/deactivate', authenticate, requireRole('Admin'), deactivateUser);

// Reactivate user - Admin only
router.post('/:userId/reactivate', authenticate, requireRole('Admin'), reactivateUser);

module.exports = router;
