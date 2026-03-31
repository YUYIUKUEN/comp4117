/**
 * Test Script — Verify enabled checkbox actually hides assessments from students
 * This test disables an assessment and verifies it doesn't appear in student queries
 * 
 * Run: node test-enabled-filter.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const GradingStandard = require('./src/models/GradingStandard');

async function testEnabledFilter() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    console.log('Testing ENABLED checkbox filter:\n');

    // Test 1: Show initial state
    let all = await GradingStandard.find({});
    console.log('BEFORE: All grading standards:');
    all.forEach(s => {
      console.log(`  - ${s.submissionType} | enabled: ${s.enabled}`);
    });

    // Test 2: Disable one assessment
    const toDisable = all[0];
    console.log(`\nDisabling: "${toDisable.submissionType}"\n`);
    
    await GradingStandard.updateOne(
      { _id: toDisable._id },
      { $set: { enabled: false } }
    );

    // Test 3: Query enabled standards (what students see)
    let enabledStandards = await GradingStandard.find({ enabled: true });
    console.log('AFTER: Enabled standards (what students see):');
    enabledStandards.forEach(s => {
      console.log(`  ✓ ${s.submissionType}`);
    });

    // Test 4: Verify the disabled one is NOT in the list
    const isDisabledVisible = enabledStandards.some(s => s._id.toString() === toDisable._id.toString());
    if (isDisabledVisible) {
      console.log(`\n❌ ERROR: Disabled assessment is still visible!`);
    } else {
      console.log(`\n✓ SUCCESS: Disabled assessment is NOT visible to students`);
    }

    // Test 5: Test pathway + enabled combined
    const research = await GradingStandard.findOne({
      enabled: true,
      pathways: 'Research-Based'
    });
    const solution = await GradingStandard.findOne({
      enabled: true,
      pathways: 'Solution-Based'
    });

    console.log(`\nResearch-Based enabled: ${research ? research.submissionType : 'none'}`);
    console.log(`Solution-Based enabled: ${solution ? solution.submissionType : 'none'}`);

    // Test 6: Re-enable the disabled assessment
    await GradingStandard.updateOne(
      { _id: toDisable._id },
      { $set: { enabled: true } }
    );

    enabledStandards = await GradingStandard.find({ enabled: true });
    console.log(`\nRe-enabled: "${toDisable.submissionType}"`);
    console.log(`Now visible again: ${enabledStandards.length} standards`);

    await mongoose.disconnect();
    console.log('\n✓ Enabled filter test complete');
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

testEnabledFilter();
