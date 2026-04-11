const express = require('express');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const {
  getAllCohorts,
  getCohortById,
  createCohort,
  updateCohort,
  deleteCohort,
} = require('../controllers/cohortController');

const router = express.Router();

// Get all cohorts - Admin only
router.get('/', authenticate, requireRole('Admin'), getAllCohorts);

// Create a new cohort - Admin only
router.post('/', authenticate, requireRole('Admin'), createCohort);

// Get cohort by ID - Admin only
router.get('/:cohortId', authenticate, requireRole('Admin'), getCohortById);

// Update cohort - Admin only
router.put('/:cohortId', authenticate, requireRole('Admin'), updateCohort);

// Delete/archive cohort - Admin only
router.delete('/:cohortId', authenticate, requireRole('Admin'), deleteCohort);

module.exports = router;
