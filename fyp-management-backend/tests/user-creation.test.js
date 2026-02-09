const mongoose = require('mongoose');
const User = require('../src/models/User');
const {hashPassword} = require('../src/utils/password');

describe('User Creation Test', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fyp_test');
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('should create a user with correct fields', async () => {
    const hashedPassword = await hashPassword('test1234');
    console.log('Hashed password:', hashedPassword);

    const user = await User.create({
      email: 'test@example.com',
      passwordHash: hashedPassword,
      fullName: 'Test User',
      role: 'Student',
    });

    expect(user._id).toBeDefined();
    expect(user.email).toBe('test@example.com');
    expect(user.role).toBe('Student');
  });
});
