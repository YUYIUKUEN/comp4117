require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { mongoUri } = require('../src/config/env');
const User = require('../src/models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    const adminEmail = 'admin@university.edu';
    const tempPassword = 'TempAdmin123!';

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('✓ Admin user already exists:', adminEmail);
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const admin = new User({
      email: adminEmail,
      passwordHash,
      fullName: 'System Administrator',
      role: 'Admin',
    });

    await admin.save();
    console.log('✓ Admin user created');
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Temp Password: ${tempPassword}`);
    console.log('  ⚠️  Change password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();
