const cors = require('cors');
const { frontendUrl } = require('../config/env');

module.exports = cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', frontendUrl],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
