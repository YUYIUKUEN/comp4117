/**
 * Cleanup Demo Data Script
 * Removes all demo accounts and related data
 */
require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./src/models/User');
const Topic = require('./src/models/Topic');
const Application = require('./src/models/Application');
const Assignment = require('./src/models/Assignment');
const Submission = require('./src/models/Submission');
const Feedback = require('./src/models/Feedback');
const ActivityLog = require('./src/models/ActivityLog');

const DEMO_EMAILS = [
  'admin@demo.edu',
  'supervisor@demo.edu',
  'emily.lee@demo.edu',
  'student1@demo.edu',
  'student2@demo.edu',
  'student3@demo.edu',
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    const oldUsers = await User.find({ email: { $in: DEMO_EMAILS } });
    const oldIds = oldUsers.map(u => u._id);

    if (oldIds.length) {
      await Feedback.deleteMany({ supervisor_id: { $in: oldIds } });
      await Submission.deleteMany({ student_id: { $in: oldIds } });
      await Assignment.deleteMany({ $or: [{ student_id: { $in: oldIds } }, { supervisor_id: { $in: oldIds } }] });
      await Application.deleteMany({ student_id: { $in: oldIds } });
      await Topic.deleteMany({ supervisor_id: { $in: oldIds } });
      await ActivityLog.deleteMany({ user_id: { $in: oldIds } });
      await User.deleteMany({ _id: { $in: oldIds } });
      console.log('✓ Test data cleaned up successfully');
    } else {
      console.log('✓ No test data to clean up');
    }

    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
  } catch (error) {
    console.error('✗ Cleanup failed:', error.message);
    process.exit(1);
  }
};

run();
