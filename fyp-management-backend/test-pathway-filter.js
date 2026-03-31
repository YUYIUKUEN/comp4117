require('dotenv').config();
const mongoose = require('mongoose');
const Topic = require('./src/models/Topic');

async function testPathwayFilter() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');
    
    console.log('Testing pathway filter:\n');
    
    // Test 1: All active
    let topics = await Topic.find({status: 'Active'});
    console.log('1. All Active (no filter):', topics.length, 'topics');
    
    // Test 2: Research-Based
    topics = await Topic.find({status: 'Active', pathway: 'Research-Based'});
    console.log('2. Research-Based:', topics.length, 'topics');
    topics.forEach(t => console.log('   -', t.title));
    
    // Test 3: Solution-Based
    topics = await Topic.find({status: 'Active', pathway: 'Solution-Based'});
    console.log('3. Solution-Based:', topics.length, 'topics');
    topics.forEach(t => console.log('   -', t.title));
    
    // Test 4: HSW + Research-Based
    topics = await Topic.find({
      status: 'Active',
      concentration: 'Health and Social Wellness Concentration (HSW)',
      pathway: 'Research-Based'
    });
    console.log('4. HSW + Research-Based:', topics.length, 'topics');
    
    // Test 5: HSW + Solution-Based
    topics = await Topic.find({
      status: 'Active',
      concentration: 'Health and Social Wellness Concentration (HSW)',
      pathway: 'Solution-Based'
    });
    console.log('5. HSW + Solution-Based:', topics.length, 'topics');
    topics.forEach(t => console.log('   -', t.title));

    await mongoose.disconnect();
    console.log('\n✓ Test complete');
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

testPathwayFilter();
