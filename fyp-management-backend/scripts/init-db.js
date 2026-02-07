require('dotenv').config();
const mongoose = require('mongoose');
const { mongoUri } = require('../src/config/env');

const initDB = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    // Collections will auto-create with first insert
    // Just verify connection
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('✓ Database initialized');
    console.log(`  Collections: ${collections.length > 0 ? collections.map(c => c.name).join(', ') : 'None yet'}`);

    process.exit(0);
  } catch (error) {
    console.error('✗ Error initializing database:', error.message);
    process.exit(1);
  }
};

initDB();
