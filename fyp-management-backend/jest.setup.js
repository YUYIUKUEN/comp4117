const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const dotenv = require('dotenv');

// Load .env.example if .env doesn't exist
try {
  dotenv.config();
} catch (error) {
  // Ignore if no .env file
}

// Set test environment variable FIRST
process.env.NODE_ENV = 'test';

// Set required environment variables for testing if not already set
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
}
if (!process.env.PORT) {
  process.env.PORT = '5000';
}

let mongoServer;

// Connect to in-memory MongoDB before running tests
beforeAll(async () => {
  // Disconnect any existing connections first
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGODB_URI = mongoUri;
  
  try {
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 5,
    });
  } catch (error) {
    console.error('Failed to connect to memory MongoDB:', error.message);
    throw error;
  }
});

// Disconnect after all tests
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Clear database between test suites
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});
