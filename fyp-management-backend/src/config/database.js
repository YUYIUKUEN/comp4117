const mongoose = require('mongoose');
const { mongoUri } = require('./env');

const connectDB = async () => {
  try {
    await mongoose.connect(mongoUri, {
      maxPoolSize: 20,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
    });
    if (process.env.NODE_ENV !== 'test') {
      console.log('✓ MongoDB connected:', mongoUri);
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('✗ MongoDB connection failed:', error.message);
    }
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

if (process.env.NODE_ENV !== 'test') {
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });
}

module.exports = connectDB;
