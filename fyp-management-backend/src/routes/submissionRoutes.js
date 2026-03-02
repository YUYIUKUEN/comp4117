const express = require('express');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/fileUpload');
const {
  submitDocument,
  getSubmission,
  getAllStudentSubmissions,
  downloadFile,
  declareNotNeeded,
  getSupervisorSubmissions,
  getSupervisorStudentSubmission,
  downloadSupervisorFile,
  getSubmissionStatistics,
  getSubmissionById,
} = require('../controllers/submissionController');

const router = express.Router();

// Student: get all submissions for current student (must be before /:phase)
router.get('/my', authenticate, requireRole('Student'), getAllStudentSubmissions);

// Student routes
router.post(
  '/:phase/submit',
  authenticate,
  requireRole('Student'),
  upload.single('file'),
  submitDocument
);

router.get('/:phase', authenticate, requireRole('Student'), getSubmission);
router.get('/:phase/files/:filename', authenticate, requireRole('Student'), downloadFile);

router.post(
  '/:phase/declare-not-needed',
  authenticate,
  requireRole('Student'),
  declareNotNeeded
);

// Supervisor routes
router.get(
  '/supervisor/submissions',
  authenticate,
  requireRole('Supervisor'),
  getSupervisorSubmissions
);

router.get(
  '/supervisor/student/:studentId/:phase',
  authenticate,
  requireRole('Supervisor'),
  getSupervisorStudentSubmission
);

router.get(
  '/supervisor/statistics',
  authenticate,
  requireRole('Supervisor'),
  getSubmissionStatistics
);

// Supervisor: get a single submission by ID
router.get(
  '/supervisor/by-id/:submissionId',
  authenticate,
  requireRole('Supervisor'),
  getSubmissionById
);

router.get(
  '/supervisor/student/:studentId/:phase/files/:filename',
  authenticate,
  requireRole('Supervisor'),
  downloadSupervisorFile
);

module.exports = router;
