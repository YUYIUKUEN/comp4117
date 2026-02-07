const express = require('express');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/fileUpload');
const {
  submitDocument,
  getSubmission,
  downloadFile,
  declareNotNeeded,
  getSupervisorSubmissions,
  getSupervisorStudentSubmission,
  downloadSupervisorFile,
  getSubmissionStatistics,
} = require('../controllers/submissionController');

const router = express.Router();

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

router.get(
  '/supervisor/student/:studentId/:phase/files/:filename',
  authenticate,
  requireRole('Supervisor'),
  downloadSupervisorFile
);

module.exports = router;
