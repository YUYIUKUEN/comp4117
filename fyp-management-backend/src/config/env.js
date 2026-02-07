require('dotenv').config();

const required = ['MONGODB_URI', 'JWT_SECRET', 'PORT'];
required.forEach(env => {
  if (!process.env[env]) {
    throw new Error(`Missing required environment variable: ${env}`);
  }
});

module.exports = {
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwtExpiry: process.env.JWT_EXPIRY || '24h',
  logLevel: process.env.LOG_LEVEL || 'debug',
};
