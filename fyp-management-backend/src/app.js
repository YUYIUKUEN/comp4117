const express = require('express');
const corsMiddleware = require('./middleware/cors');
const loggingMiddleware = require('./middleware/logging');
const errorHandler = require('./middleware/errorHandler');
const connectDB = require('./config/database');

const app = express();

// Connect to database
connectDB();

// Middleware order matters!
app.use(corsMiddleware);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(loggingMiddleware);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes will be added here
// app.use('/api/v1/auth', require('./routes/auth'));
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
