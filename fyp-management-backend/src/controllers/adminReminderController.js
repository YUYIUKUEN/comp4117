const Submission = require('../models/Submission');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const ActivityLog = require('../models/ActivityLog');
const SystemSetting = require('../models/SystemSetting');
const { sendEmail } = require('../utils/email');

/**
 * GET /api/v1/admin/reminders
 * Fetch all overdue / not-submitted submissions with associated student info.
 * Admin sees ALL submissions; Supervisor sees only their assigned students.
 */
const getAdminReminders = async (req, res, next) => {
  try {
    const { status, priority } = req.query;
    const userRole = req.auth?.role || req.user?.role;

    // Build filter – default to Overdue + Not Submitted
    const statusFilter = status
      ? [status]
      : ['Overdue', 'Not Submitted'];

    const filter = { status: { $in: statusFilter } };

    // Supervisor scope: only show submissions for their assigned students
    if (userRole === 'Supervisor') {
      const assignments = await Assignment.find({
        supervisor_id: req.auth.userId,
        status: 'Active',
      });
      const topicIds = assignments.map(a => a.topic_id);
      filter.topic_id = { $in: topicIds };
    }

    const submissions = await Submission.find(filter)
      .populate('student_id', 'fullName email concentration phone')
      .populate('topic_id', 'title')
      .sort({ _id: -1 });

    const now = new Date();

    const reminders = submissions.map((sub) => {
      const due = sub.dueDate ? new Date(sub.dueDate) : null;
      const daysOverdue = due
        ? Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      let computedPriority = 'Low';
      if (daysOverdue >= 7) computedPriority = 'High';
      else if (daysOverdue >= 3) computedPriority = 'Medium';
      else if (daysOverdue > 0) computedPriority = 'Medium';

      return {
        id: sub._id,
        status: sub.status,
        phase: sub.phase,
        dueDate: sub.dueDate,
        daysOverdue,
        priority: computedPriority,
        reminderSentAt: sub.reminderSentAt || null,
        reminderCount: sub.reminderCount || 0,
        student: sub.student_id
          ? {
              id: sub.student_id._id,
              fullName: sub.student_id.fullName,
              email: sub.student_id.email,
              concentration: sub.student_id.concentration || '',
              phone: sub.student_id.phone || '',
            }
          : null,
        topic: sub.topic_id
          ? {
              id: sub.topic_id._id,
              title: sub.topic_id.title,
            }
          : null,
      };
    });

    // Optional priority filter
    const filtered = priority
      ? reminders.filter((r) => r.priority === priority)
      : reminders;

    // Sort by most overdue first (in memory to avoid Cosmos DB index issues)
    filtered.sort((a, b) => b.daysOverdue - a.daysOverdue);

    res.json({
      data: filtered,
      total: filtered.length,
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/reminders/:submissionId/send
 * Send a reminder email to the student associated with a submission.
 * Admin-only.
 */
const sendAdminReminder = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const { customMessage } = req.body; // optional custom note from admin

    const submission = await Submission.findById(submissionId)
      .populate('student_id', 'fullName email')
      .populate('topic_id', 'title');

    if (!submission) {
      return res.status(404).json({
        error: 'Submission not found',
        code: 'NOT_FOUND',
        status: 404,
      });
    }

    const student = submission.student_id;
    if (!student || !student.email) {
      return res.status(400).json({
        error: 'Student email not available for this submission',
        code: 'NO_STUDENT_EMAIL',
        status: 400,
      });
    }

    const topicTitle = submission.topic_id?.title || 'your FYP topic';
    const phase = submission.phase || 'Unknown Phase';
    const dueDateStr = submission.dueDate
      ? new Date(submission.dueDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'N/A';

    // Determine if submission is actually overdue or just not yet submitted
    const isOverdue = submission.status === 'Overdue' ||
      (submission.dueDate && new Date(submission.dueDate) < new Date());

    const subject = isOverdue
      ? `Reminder: ${phase} Submission Overdue`
      : `Reminder: ${phase} Submission Pending`;

    const statusDescription = isOverdue
      ? `is currently <strong>overdue</strong>`
      : `has <strong>not yet been submitted</strong>`;

    const statusDescriptionPlain = isOverdue
      ? 'is overdue'
      : 'has not yet been submitted';

    const urgencyNote = isOverdue
      ? 'Please submit your work as soon as possible through the FYP Management Platform to avoid further penalties.'
      : 'Please submit your work before the deadline through the FYP Management Platform.';

    const dueDateLabel = isOverdue ? 'Original Due Date' : 'Due Date';

    const plainText = [
      `Dear ${student.fullName},`,
      '',
      `This is a reminder that your submission for "${phase}" (Topic: ${topicTitle}) ${statusDescriptionPlain}.`,
      '',
      `${dueDateLabel}: ${dueDateStr}`,
      '',
      customMessage ? `Note from administrator: ${customMessage}` : '',
      '',
      urgencyNote,
      '',
      'Best regards,',
      'FYP Management Team',
    ]
      .filter(Boolean)
      .join('\n');

    const headerIcon = isOverdue ? '⚠️' : '📋';
    const headerTitle = isOverdue ? 'Submission Reminder – Overdue' : 'Submission Reminder';
    const dueDateColor = isOverdue ? '#d9534f' : '#333';

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; margin: 0; padding: 0; background: #f5f5f5;">
  <div style="max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 10px;">${headerIcon}</div>
      <h1 style="margin: 0; font-size: 22px;">${headerTitle}</h1>
    </div>
    <div style="padding: 30px 40px;">
      <p>Dear <strong>${student.fullName}</strong>,</p>
      <p>This is a reminder that your submission for <strong>${phase}</strong> (Topic: <em>${topicTitle}</em>) ${statusDescription}.</p>
      <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px 20px; margin: 20px 0; border-radius: 4px;">
        <strong style="color: #856404;">${dueDateLabel}:</strong> <span style="color: ${dueDateColor}; font-weight: 600;">${dueDateStr}</span>
      </div>
      ${customMessage ? `<div style="background: #e8f4fd; border-left: 4px solid #2196f3; padding: 15px 20px; margin: 20px 0; border-radius: 4px;"><strong>Note from administrator:</strong> ${customMessage}</div>` : ''}
      <p>${urgencyNote}</p>
    </div>
    <div style="background: #f8f9fa; padding: 20px 40px; border-top: 1px solid #e9ecef; font-size: 14px; color: #6c757d;">
      <p style="margin: 5px 0;"><strong>Best regards,</strong></p>
      <p style="margin: 5px 0;">FYP Management Team</p>
      <p style="margin-top: 15px; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`.trim();

    // Send email
    await sendEmail(student.email, student.fullName, subject, plainText, htmlContent);

    // Update submission reminder tracking
    submission.reminderSentAt = new Date();
    submission.reminderCount = (submission.reminderCount || 0) + 1;
    submission.updatedAt = new Date();
    await submission.save();

    // Log activity
    await ActivityLog.create({
      user_id: req.auth.userId,
      action: 'reminder_sent',
      entityType: 'Submission',
      entityId: submission._id,
      details: {
        studentEmail: student.email,
        studentName: student.fullName,
        phase,
        customMessage: customMessage || null,
      },
    });

    res.json({
      message: `Reminder sent successfully to ${student.email}`,
      data: {
        submissionId: submission._id,
        studentEmail: student.email,
        reminderCount: submission.reminderCount,
        reminderSentAt: submission.reminderSentAt,
      },
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/reminders/send-bulk
 * Send reminders to multiple students at once.
 * Admin-only.
 */
const sendBulkReminders = async (req, res, next) => {
  try {
    const { submissionIds, customMessage } = req.body;

    if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
      return res.status(400).json({
        error: 'submissionIds array is required',
        code: 'INVALID_INPUT',
        status: 400,
      });
    }

    const submissions = await Submission.find({ _id: { $in: submissionIds } })
      .populate('student_id', 'fullName email')
      .populate('topic_id', 'title');

    let successCount = 0;
    let failCount = 0;
    const results = [];

    for (const submission of submissions) {
      const student = submission.student_id;
      if (!student || !student.email) {
        failCount++;
        results.push({ submissionId: submission._id, success: false, error: 'No student email' });
        continue;
      }

      const topicTitle = submission.topic_id?.title || 'your FYP topic';
      const phase = submission.phase || 'Unknown Phase';
      const dueDateStr = submission.dueDate
        ? new Date(submission.dueDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : 'N/A';

      const isOverdue = submission.status === 'Overdue' ||
        (submission.dueDate && new Date(submission.dueDate) < new Date());

      const subject = isOverdue
        ? `Reminder: ${phase} Submission Overdue`
        : `Reminder: ${phase} Submission Pending`;
      const statusText = isOverdue ? 'is overdue' : 'has not yet been submitted';
      const urgencyNote = isOverdue
        ? 'Please submit your work as soon as possible.'
        : 'Please submit your work before the deadline.';
      const dueDateLabel = isOverdue ? 'Original Due Date' : 'Due Date';
      const plainText = `Dear ${student.fullName},\n\nThis is a reminder that your submission for "${phase}" (Topic: ${topicTitle}) ${statusText}.\n\n${dueDateLabel}: ${dueDateStr}\n${customMessage ? `\nNote from administrator: ${customMessage}\n` : ''}\n${urgencyNote}\n\nBest regards,\nFYP Management Team`;

      try {
        await sendEmail(student.email, student.fullName, subject, plainText);

        submission.reminderSentAt = new Date();
        submission.reminderCount = (submission.reminderCount || 0) + 1;
        submission.updatedAt = new Date();
        await submission.save();

        successCount++;
        results.push({ submissionId: submission._id, success: true, email: student.email });
      } catch (err) {
        failCount++;
        results.push({ submissionId: submission._id, success: false, error: err.message });
      }
    }

    // Log bulk action
    await ActivityLog.create({
      user_id: req.auth.userId,
      action: 'bulk_reminders_sent',
      entityType: 'Submission',
      details: { successCount, failCount, total: submissionIds.length },
    });

    res.json({
      message: `Bulk reminders: ${successCount} sent, ${failCount} failed`,
      data: { successCount, failCount, total: submissionIds.length, results },
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Auto-Reminder Settings ─────────────────────────────────────────────────

const AUTO_REMINDER_SETTINGS_KEY = 'autoReminderSettings';

const DEFAULT_SETTINGS = {
  enabled: false,
  frequencyHours: 24,        // how often the auto-send job runs
  maxRemindersPerStudent: 3, // stop auto-sending after N reminders
  targetStatuses: ['Overdue', 'Not Submitted'], // which statuses to auto-remind
  customMessage: '',         // optional default custom message for auto emails
};

/**
 * GET /api/v1/admin/reminders/settings
 */
const getReminderSettings = async (req, res, next) => {
  try {
    const settings = await SystemSetting.get(AUTO_REMINDER_SETTINGS_KEY, DEFAULT_SETTINGS);
    res.json({ data: { ...DEFAULT_SETTINGS, ...settings }, status: 200 });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/admin/reminders/settings
 */
const updateReminderSettings = async (req, res, next) => {
  try {
    const {
      enabled,
      frequencyHours,
      maxRemindersPerStudent,
      targetStatuses,
      customMessage,
    } = req.body;

    const current = await SystemSetting.get(AUTO_REMINDER_SETTINGS_KEY, DEFAULT_SETTINGS);
    const updated = { ...DEFAULT_SETTINGS, ...current };

    if (typeof enabled === 'boolean') updated.enabled = enabled;
    if (typeof frequencyHours === 'number' && frequencyHours >= 1) updated.frequencyHours = frequencyHours;
    if (typeof maxRemindersPerStudent === 'number' && maxRemindersPerStudent >= 1) updated.maxRemindersPerStudent = maxRemindersPerStudent;
    if (Array.isArray(targetStatuses)) {
      updated.targetStatuses = targetStatuses.filter(s => ['Overdue', 'Not Submitted'].includes(s));
      if (updated.targetStatuses.length === 0) updated.targetStatuses = ['Overdue', 'Not Submitted'];
    }
    if (typeof customMessage === 'string') updated.customMessage = customMessage.trim();

    await SystemSetting.set(AUTO_REMINDER_SETTINGS_KEY, updated, req.auth?.userId);

    await ActivityLog.create({
      user_id: req.auth.userId,
      action: 'auto_reminder_settings_updated',
      entityType: 'SystemSetting',
      details: updated,
    });

    res.json({ message: 'Auto-reminder settings updated.', data: updated, status: 200 });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/reminders/auto-send  (called by cron or manually)
 * Sends reminders to all qualifying submissions based on saved settings.
 */
const runAutoReminders = async (req, res, next) => {
  try {
    const settings = await SystemSetting.get(AUTO_REMINDER_SETTINGS_KEY, DEFAULT_SETTINGS);

    if (!settings.enabled) {
      return res.json({ message: 'Auto-reminders are disabled.', data: { sent: 0 }, status: 200 });
    }

    const filter = {
      status: { $in: settings.targetStatuses },
      reminderCount: { $lt: settings.maxRemindersPerStudent },
    };

    // Only resend if enough time has passed since last reminder
    const cooldownMs = (settings.frequencyHours || 24) * 60 * 60 * 1000;
    const cooldownDate = new Date(Date.now() - cooldownMs);
    filter.$or = [
      { reminderSentAt: { $exists: false } },
      { reminderSentAt: null },
      { reminderSentAt: { $lt: cooldownDate } },
    ];

    const submissions = await Submission.find(filter)
      .populate('student_id', 'fullName email')
      .populate('topic_id', 'title');

    let successCount = 0;
    let failCount = 0;

    for (const submission of submissions) {
      const student = submission.student_id;
      if (!student || !student.email) { failCount++; continue; }

      const topicTitle = submission.topic_id?.title || 'your FYP topic';
      const phase = submission.phase || 'Unknown Phase';
      const dueDateStr = submission.dueDate
        ? new Date(submission.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'N/A';

      const isOverdue = submission.status === 'Overdue' ||
        (submission.dueDate && new Date(submission.dueDate) < new Date());

      const subject = isOverdue
        ? `Reminder: ${phase} Submission Overdue`
        : `Reminder: ${phase} Submission Pending`;

      const statusText = isOverdue ? 'is overdue' : 'has not yet been submitted';
      const urgencyNote = isOverdue
        ? 'Please submit your work as soon as possible through the FYP Management Platform to avoid further penalties.'
        : 'Please submit your work before the deadline through the FYP Management Platform.';
      const dueDateLabel = isOverdue ? 'Original Due Date' : 'Due Date';
      const headerIcon = isOverdue ? '⚠️' : '📋';
      const headerTitle = isOverdue ? 'Submission Reminder – Overdue' : 'Submission Reminder';
      const dueDateColor = isOverdue ? '#d9534f' : '#333';
      const statusDescription = isOverdue ? 'is currently <strong>overdue</strong>' : 'has <strong>not yet been submitted</strong>';

      const adminNote = settings.customMessage || '';

      const plainText = [
        `Dear ${student.fullName},`,
        '',
        `This is a reminder that your submission for "${phase}" (Topic: ${topicTitle}) ${statusText}.`,
        '',
        `${dueDateLabel}: ${dueDateStr}`,
        '',
        adminNote ? `Note: ${adminNote}` : '',
        '',
        urgencyNote,
        '',
        'Best regards,',
        'FYP Management Team',
      ].filter(Boolean).join('\n');

      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; margin: 0; padding: 0; background: #f5f5f5;">
  <div style="max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 10px;">${headerIcon}</div>
      <h1 style="margin: 0; font-size: 22px;">${headerTitle}</h1>
    </div>
    <div style="padding: 30px 40px;">
      <p>Dear <strong>${student.fullName}</strong>,</p>
      <p>This is a reminder that your submission for <strong>${phase}</strong> (Topic: <em>${topicTitle}</em>) ${statusDescription}.</p>
      <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px 20px; margin: 20px 0; border-radius: 4px;">
        <strong style="color: #856404;">${dueDateLabel}:</strong> <span style="color: ${dueDateColor}; font-weight: 600;">${dueDateStr}</span>
      </div>
      ${adminNote ? `<div style="background: #e8f4fd; border-left: 4px solid #2196f3; padding: 15px 20px; margin: 20px 0; border-radius: 4px;"><strong>Note:</strong> ${adminNote}</div>` : ''}
      <p>${urgencyNote}</p>
    </div>
    <div style="background: #f8f9fa; padding: 20px 40px; border-top: 1px solid #e9ecef; font-size: 14px; color: #6c757d;">
      <p style="margin: 5px 0;"><strong>Best regards,</strong></p>
      <p style="margin: 5px 0;">FYP Management Team</p>
      <p style="margin-top: 15px; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`.trim();

      try {
        await sendEmail(student.email, student.fullName, subject, plainText, htmlContent);
        submission.reminderSentAt = new Date();
        submission.reminderCount = (submission.reminderCount || 0) + 1;
        submission.updatedAt = new Date();
        await submission.save();
        successCount++;
      } catch (err) {
        failCount++;
        console.error(`Auto-reminder failed for ${student.email}:`, err.message);
      }
    }

    console.log(`[AutoReminder] Sent ${successCount}, failed ${failCount}`);

    if (res) {
      res.json({
        message: `Auto-reminders: ${successCount} sent, ${failCount} failed`,
        data: { sent: successCount, failed: failCount, total: submissions.length },
        status: 200,
      });
    }
  } catch (error) {
    if (next) next(error);
    else console.error('[AutoReminder] Error:', error);
  }
};

module.exports = {
  getAdminReminders,
  sendAdminReminder,
  sendBulkReminders,
  getReminderSettings,
  updateReminderSettings,
  runAutoReminders,
};
