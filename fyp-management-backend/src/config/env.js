require('dotenv').config();

const required = ['JWT_SECRET', 'PORT'];
required.forEach(env => {
  if (!process.env[env]) {
    throw new Error(`Missing required environment variable: ${env}`);
  }
});

// Either MONGODB_URI or AZURE_COSMOS_CONNECTION_STRING must be provided
if (!process.env.MONGODB_URI && !process.env.AZURE_COSMOS_CONNECTION_STRING) {
  throw new Error('Missing required environment variable: MONGODB_URI or AZURE_COSMOS_CONNECTION_STRING');
}

module.exports = {
  mongoUri: process.env.MONGODB_URI,
  azureCosmosConnectionString: process.env.AZURE_COSMOS_CONNECTION_STRING,
  jwtSecret: process.env.JWT_SECRET,
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwtExpiry: process.env.JWT_EXPIRY || '24h',
  logLevel: process.env.LOG_LEVEL || 'debug',
};
