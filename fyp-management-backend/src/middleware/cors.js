const cors = require('cors');
const { frontendUrl } = require('../config/env');

module.exports = cors({
  origin: frontendUrl || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
