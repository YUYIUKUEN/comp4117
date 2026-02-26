const express = require('express');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const {
  getAdminReminders,
  sendAdminReminder,
  sendBulkReminders,
  getReminderSettings,
  updateReminderSettings,
  runAutoReminders,
} = require('../controllers/adminReminderController');

const router = express.Router();

// GET  /api/v1/admin/reminders          — list all overdue/not-submitted with student info
router.get('/', authenticate, requireRole('Admin', 'Supervisor'), getAdminReminders);

// GET  /api/v1/admin/reminders/settings — get auto-reminder settings
router.get('/settings', authenticate, requireRole('Admin'), getReminderSettings);

// PUT  /api/v1/admin/reminders/settings — update auto-reminder settings
router.put('/settings', authenticate, requireRole('Admin'), updateReminderSettings);

// POST /api/v1/admin/reminders/auto-send — trigger auto-send (can also be called by cron)
router.post('/auto-send', authenticate, requireRole('Admin'), runAutoReminders);

// POST /api/v1/admin/reminders/:submissionId/send  — send reminder email to one student
router.post('/:submissionId/send', authenticate, requireRole('Admin', 'Supervisor'), sendAdminReminder);

// POST /api/v1/admin/reminders/send-bulk           — send reminders to multiple students
router.post('/send-bulk', authenticate, requireRole('Admin', 'Supervisor'), sendBulkReminders);

module.exports = router;
