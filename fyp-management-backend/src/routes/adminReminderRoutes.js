const express = require('express');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const {
  getAdminReminders,
  sendAdminReminder,
  sendBulkReminders,
} = require('../controllers/adminReminderController');

const router = express.Router();

// GET  /api/v1/admin/reminders          — list all overdue/not-submitted with student info
router.get('/', authenticate, requireRole('Admin', 'Supervisor'), getAdminReminders);

// POST /api/v1/admin/reminders/:submissionId/send  — send reminder email to one student
router.post('/:submissionId/send', authenticate, requireRole('Admin', 'Supervisor'), sendAdminReminder);

// POST /api/v1/admin/reminders/send-bulk           — send reminders to multiple students
router.post('/send-bulk', authenticate, requireRole('Admin', 'Supervisor'), sendBulkReminders);

module.exports = router;
