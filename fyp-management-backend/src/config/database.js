const mongoose = require('mongoose');
const { mongoUri, azureCosmosConnectionString } = require('./env');

const connectDB = async () => {
  try {
    // Use Azure Cosmos DB if connection string is provided, otherwise use MongoDB
    const connectionString = azureCosmosConnectionString || mongoUri;
    
    await mongoose.connect(connectionString, {
      maxPoolSize: 20,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      retryWrites: false, // Azure Cosmos DB doesn't support retryWrites
    });
    if (process.env.NODE_ENV !== 'test') {
      console.log('✓ Database connected successfully');
      console.log('✓ Connection string:', connectionString.substring(0, 50) + '...');
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('✗ Database connection failed:', error.message);
    }
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

if (process.env.NODE_ENV !== 'test') {
  mongoose.connection.on('error', (err) => {
    console.error('Database connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('Database disconnected');
  });
}

module.exports = connectDB;
