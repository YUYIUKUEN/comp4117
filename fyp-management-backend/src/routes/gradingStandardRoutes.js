const express = require('express');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const {
  getAllGradingStandards,
  getGradingStandardById,
  getGradingStandardBySubmissionType,
  getGradingStandardBySubmissionTypeAndPathway,
  createGradingStandard,
  updateGradingStandard,
  deleteGradingStandard,
} = require('../controllers/gradingStandardController');

const router = express.Router();

// Route order matters! More specific routes must come BEFORE catch-all routes like /:id

// GET all - any authenticated user (supervisors need to read)
router.get('/', authenticate, getAllGradingStandards);

// GET by submission type - called by supervisor feedback form
// NOTE: This route must come BEFORE /:id to prevent conflict
router.get('/by-type/:submissionType', authenticate, getGradingStandardBySubmissionType);

// GET by submission type and pathway - for pathway-specific rubrics
// Uses query parameters to avoid URL encoding issues with special characters in pathways
router.get('/by-type-pathway', authenticate, getGradingStandardBySubmissionTypeAndPathway);

// GET by id
router.get('/:id', authenticate, getGradingStandardById);

// POST - admin only
router.post('/', authenticate, requireRole('Admin'), createGradingStandard);

// PUT - admin only
router.put('/:id', authenticate, requireRole('Admin'), updateGradingStandard);

// DELETE - admin only
router.delete('/:id', authenticate, requireRole('Admin'), deleteGradingStandard);

module.exports = router;
