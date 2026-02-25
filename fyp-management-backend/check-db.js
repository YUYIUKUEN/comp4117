require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Topic = require('./src/models/Topic');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Check for supervisor
    const supervisor = await User.findOne({ email: 'supervisor@example.com' });
    console.log('✓ Supervisor found:', supervisor ? 'YES' : 'NO');
    if (supervisor) {
      console.log('  ID:', supervisor._id);
      console.log('  Email:', supervisor.email);
      console.log('  Name:', supervisor.fullName);
      
      // Check for topics
      const topics = await Topic.find({ supervisor_id: supervisor._id });
      console.log('  Topics count:', topics.length);
      topics.forEach(t => console.log('    -', t.title));
    }
    
    // Check demo user
    const demoUser = await User.findOne({ email: 'demo.supervisor@university.edu' });
    console.log('✓ Demo user found:', demoUser ? 'YES' : 'NO');
    if (demoUser) {
      console.log('  ID:', demoUser._id);
    }
    
    // List all users and their roles
    const allUsers = await User.find({});
    console.log('\n✓ All users in database:');
    allUsers.forEach(u => console.log(`  - ${u.email} (${u.role}) [${u.fullName}]`));
    
    await mongoose.disconnect();
  } catch(e) {
    console.error('✗ Error:', e.message);
    process.exit(1);
  }
})();
