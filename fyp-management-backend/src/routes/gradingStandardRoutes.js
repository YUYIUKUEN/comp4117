const express = require('express');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const {
  getAllGradingStandards,
  getGradingStandardById,
  createGradingStandard,
  updateGradingStandard,
  deleteGradingStandard,
} = require('../controllers/gradingStandardController');

const router = express.Router();

// GET all - any authenticated user (supervisors need to read)
router.get('/', authenticate, getAllGradingStandards);

// GET by id
router.get('/:id', authenticate, getGradingStandardById);

// POST - admin only
router.post('/', authenticate, requireRole('Admin'), createGradingStandard);

// PUT - admin only
router.put('/:id', authenticate, requireRole('Admin'), updateGradingStandard);

// DELETE - admin only
router.delete('/:id', authenticate, requireRole('Admin'), deleteGradingStandard);

module.exports = router;
