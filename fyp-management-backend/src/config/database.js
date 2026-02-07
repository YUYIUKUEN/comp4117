const mongoose = require('mongoose');
const { mongoUri } = require('./env');

const connectDB = async () => {
  try {
    await mongoose.connect(mongoUri, {
      maxPoolSize: 20,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
    });
    console.log('✓ MongoDB connected:', mongoUri);
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

module.exports = connectDB;
