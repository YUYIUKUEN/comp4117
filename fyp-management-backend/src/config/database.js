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

const seedTestTopics = async () => {
  try {
    const Topic = require('../models/Topic');
    const User = require('../models/User');
    
    const topicCount = await Topic.countDocuments();
    if (topicCount > 0) return; // Already seeded
    
    const supervisor = await User.findOne({ role: 'Supervisor' });
    if (!supervisor) {
      console.log('✗ No supervisor found, skipping topic seeding');
      return;
    }
    
    await Topic.insertMany([
      {
        title: 'Smart City Walkability in Kowloon East',
        description: 'This project explores the walkability of urban spaces in Kowloon East using smart city data and pedestrian flow analysis. Students will work with GIS data and pedestrian sensors.',
        supervisor_id: supervisor._id,
        concentration: 'Software Engineering',
        keywords: ['smart city', 'GIS', 'walkability'],
        status: 'Active',
      },
      {
        title: 'Digital Platforms and Youth Political Participation',
        description: 'Investigate how digital platforms influence youth political engagement and participation. This research examines social media usage patterns and online activism.',
        supervisor_id: supervisor._id,
        concentration: 'AI/ML',
        keywords: ['social media', 'political participation'],
        status: 'Active',
      },
      {
        title: 'Literary Analysis and Digital Storytelling',
        description: 'Combine traditional literary analysis with modern digital storytelling techniques. Students will explore how classic narratives can be reimagined through interactive media.',
        supervisor_id: supervisor._id,
        concentration: 'Software Engineering',
        keywords: ['digital humanities', 'storytelling'],
        status: 'Active',
      },
      {
        title: 'Machine Learning for Healthcare Diagnostics',
        description: 'Develop machine learning models to assist in medical diagnostics. This project involves working with medical imaging datasets and training neural networks.',
        supervisor_id: supervisor._id,
        concentration: 'AI/ML',
        keywords: ['machine learning', 'healthcare'],
        status: 'Active',
      },
      {
        title: 'Blockchain-based Supply Chain Transparency',
        description: 'Design and implement a blockchain solution for supply chain management. This project focuses on using distributed ledger technology to improve transparency.',
        supervisor_id: supervisor._id,
        concentration: 'Systems',
        keywords: ['blockchain', 'supply chain'],
        status: 'Active',
      },
      {
        title: 'Cybersecurity Risk Assessment Framework',
        description: 'Develop a comprehensive cybersecurity risk assessment framework for small and medium enterprises. This project involves threat modeling and vulnerability assessment.',
        supervisor_id: supervisor._id,
        concentration: 'Cybersecurity',
        keywords: ['cybersecurity', 'risk assessment'],
        status: 'Active',
      },
    ]);
    console.log('✓ Test topics seeded');
  } catch (error) {
    console.error('✗ Failed to seed test topics:', error.message);
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
        
        // Seed test users and topics in development
        await seedTestUsers();
        await seedTestTopics();
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
