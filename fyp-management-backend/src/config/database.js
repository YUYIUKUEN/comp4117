const mongoose = require('mongoose');
const { mongoUri } = require('./env');

let mongoUri_ = mongoUri;
let isMemoryDB = false;

const seedTestUsers = async () => {
  try {
    const User = require('../models/User');
    const bcrypt = require('bcryptjs');
    
    const userCount = await User.countDocuments();
    if (userCount > 0) return; // Already seeded
    
    const passwordHash = await bcrypt.hash('test-password-123', 10);
    await User.insertMany([
      {
        email: 'student@university.edu',
        passwordHash,
        fullName: 'Test Student',
        role: 'Student',
      },
      {
        email: 'supervisor@university.edu',
        passwordHash,
        fullName: 'Dr. Test Supervisor',
        role: 'Supervisor',
      },
      {
        email: 'admin@university.edu',
        passwordHash,
        fullName: 'System Administrator',
        role: 'Admin',
      },
    ]);
    console.log('✓ Test users seeded');
  } catch (error) {
    console.error('✗ Failed to seed test users:', error.message);
  }
};

const connectDB = async () => {
  try {
    // Try to connect to the configured MongoDB
    await mongoose.connect(mongoUri_, {
      maxPoolSize: 20,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
    });
    if (process.env.NODE_ENV !== 'test') {
      console.log('✓ MongoDB connected:', mongoUri_);
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('✗ MongoDB connection failed:', error.message);
    }
    
    // In development, fall back to in-memory MongoDB
    if (process.env.NODE_ENV === 'development') {
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        console.warn('⚠️  Starting in-memory MongoDB for development...');
        const mongoServer = await MongoMemoryServer.create();
        mongoUri_ = mongoServer.getUri();
        isMemoryDB = true;
        
        await mongoose.connect(mongoUri_, {
          maxPoolSize: 20,
          minPoolSize: 5,
        });
        console.log('✓ In-memory MongoDB connected (development mode)');
        
        // Seed test users in development
        await seedTestUsers();
      } catch (memError) {
        console.error('✗ Failed to start in-memory MongoDB:', memError.message);
        process.exit(1);
      }
    } else if (process.env.NODE_ENV === 'production') {
      // Exit in production if MongoDB unavailable
      process.exit(1);
    } else {
      // Test mode
      throw error;
    }
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
