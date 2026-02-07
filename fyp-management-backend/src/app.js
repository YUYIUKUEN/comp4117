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

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/users', require('./routes/users'));
// app.use('/api/v1/topics', require('./routes/topics'));

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
