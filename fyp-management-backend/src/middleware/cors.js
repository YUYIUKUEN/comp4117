const cors = require('cors');
const { frontendUrl } = require('../config/env');

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  frontendUrl,
].filter(Boolean);

module.exports = cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
