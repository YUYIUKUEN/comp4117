const express = require('express');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} = require('../controllers/rubricTemplateController');

const router = express.Router();

// GET all templates
router.get('/', authenticate, getAllTemplates);

// GET by id
router.get('/:id', authenticate, getTemplateById);

// POST - create (admin only)
router.post('/', authenticate, requireRole('Admin'), createTemplate);

// PUT - update (admin only)
router.put('/:id', authenticate, requireRole('Admin'), updateTemplate);

// DELETE (admin only)
router.delete('/:id', authenticate, requireRole('Admin'), deleteTemplate);

module.exports = router;
