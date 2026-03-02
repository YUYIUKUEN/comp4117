const express = require('express');
const corsMiddleware = require('./middleware/cors');
const loggingMiddleware = require('./middleware/logging');
const errorHandler = require('./middleware/errorHandler');
const connectDB = require('./config/database');

const app = express();

// Connect to database (skip in test mode where jest.setup.js handles it)
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// Middleware order matters!
app.use(corsMiddleware);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(loggingMiddleware);

// Routes
const authRoutes = require('./routes/authRoutes');
const topicRoutes = require('./routes/topicRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const userManagementRoutes = require('./routes/userManagementRoutes');
const topicModerationRoutes = require('./routes/topicModerationRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const activityRoutes = require('./routes/activityRoutes');
const healthRoutes = require('./routes/healthRoutes');
const adminReminderRoutes = require('./routes/adminReminderRoutes');
const gradingStandardRoutes = require('./routes/gradingStandardRoutes');
const meetingRoutes = require('./routes/meetingRoutes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/topics', topicRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/dashboards', dashboardRoutes);
app.use('/api/v1/submissions', submissionRoutes);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/admin/users', userManagementRoutes);
app.use('/api/v1/admin/topics', topicModerationRoutes);
app.use('/api/v1/admin/reminders', adminReminderRoutes);
app.use('/api/v1/activity', activityRoutes);
app.use('/api/v1/grading-standards', gradingStandardRoutes);
app.use('/api/v1/meetings', meetingRoutes);
app.use('/api/v1/health', healthRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    code: 'NOT_FOUND',
    status: 404,
  });
});

// Error handler MUST be last
app.use(errorHandler);

module.exports = app;
