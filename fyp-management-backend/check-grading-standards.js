const mongoose = require('mongoose');
require('dotenv').config();

const GradingStandard = require('./src/models/GradingStandard');

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    const standards = await GradingStandard.find();
    console.log(`Found ${standards.length} grading standards:\n`);
    
    standards.forEach(s => {
      console.log(`📋 ${s.submissionType}`);
      console.log(`   _id: ${s._id}`);
      console.log(`   enabled: ${s.enabled}`);
      console.log(`   enabledByPathway:`, JSON.stringify(s.enabledByPathway, null, 2));
      console.log(`   pathways:`, s.pathways);
      console.log('');
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

check();
