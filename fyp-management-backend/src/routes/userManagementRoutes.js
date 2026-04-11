const express = require('express');
const multer = require('multer');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
  reactivateUser,
  importUsersFromExcel,
  assignStudentsToSupervisor,
  markStudentsEthicsNotRequired,
  getStudentSubmissions,
} = require('../controllers/userManagementController');

// Multer config for Excel/CSV import (in-memory, 5 MB limit)
const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|csv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx, .xls, and .csv files are allowed'), false);
    }
  },
});

const router = express.Router();

// Get all users with filtering and pagination - Admin only
router.get('/', authenticate, requireRole('Admin'), getAllUsers);

// Create a new user - Admin only
router.post('/', authenticate, requireRole('Admin'), createUser);

// Import users from Excel/CSV - Admin only
router.post('/import', authenticate, requireRole('Admin'), importUpload.single('file'), importUsersFromExcel);

// Bulk assign students to supervisor - Admin only (must come before /:userId)
router.post('/bulk-assign-supervisor', authenticate, requireRole('Admin'), assignStudentsToSupervisor);

// Bulk mark students as ethics not required - Admin only (must come before /:userId)
router.post('/bulk-mark-ethics-not-required', authenticate, requireRole('Admin'), markStudentsEthicsNotRequired);

// Get student submissions - Admin only (must come before /:userId)
router.get('/:studentId/submissions', authenticate, requireRole('Admin'), getStudentSubmissions);

// Get user by ID - Admin only
router.get('/:userId', authenticate, requireRole('Admin'), getUserById);

// Update user by ID - Admin only
router.put('/:userId', authenticate, requireRole('Admin'), updateUser);

// Deactivate user - Admin only
router.post('/:userId/deactivate', authenticate, requireRole('Admin'), deactivateUser);

// Reactivate user - Admin only
router.post('/:userId/reactivate', authenticate, requireRole('Admin'), reactivateUser);

module.exports = router;
