require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Clear existing test users
    await User.deleteMany({ 
      email: { $in: ['student@university.edu', 'supervisor@university.edu', 'admin@university.edu'] } 
    });
    console.log('✓ Cleared existing test users');

    // Hash the password
    const passwordHash = await bcrypt.hash('test-password-123', 10);

    // Create test users
    const users = await User.insertMany([
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

    console.log('✓ Created test users:');
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) [password: test-password-123]`);
    });

    await mongoose.disconnect();
    console.log('✓ Database seeded successfully');
  } catch (error) {
    console.error('✗ Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();
