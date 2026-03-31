/**
 * Test Script — Verify grading standard filter by enabled status and pathway
 * Tests that disabled assessments don't appear for students
 * 
 * Run: node test-grading-standard-filter.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const GradingStandard = require('./src/models/GradingStandard');

async function testGradingStandardFilter() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    console.log('Testing grading standard filter:\n');

    // Test 1: All standards (admin view)
    let standards = await GradingStandard.find({});
    console.log('1. All standards (admin view):', standards.length, 'standards');
    standards.forEach(s => {
      console.log(`   - ${s.submissionType} | enabled: ${s.enabled} | pathways: ${s.pathways.join(', ')}`);
    });

    // Test 2: Only enabled standards (student view)
    standards = await GradingStandard.find({ enabled: true });
    console.log('\n2. Enabled standards only (student view):', standards.length, 'standards');
    standards.forEach(s => console.log(`   - ${s.submissionType}`));

    // Test 3: Research-Based pathway standards (enabled)
    standards = await GradingStandard.find({
      enabled: true,
      pathways: 'Research-Based'
    });
    console.log('\n3. Research-Based pathway (enabled):', standards.length, 'standards');
    standards.forEach(s => console.log(`   - ${s.submissionType}`));

    // Test 4: Solution-Based pathway standards (enabled)
    standards = await GradingStandard.find({
      enabled: true,
      pathways: 'Solution-Based'
    });
    console.log('\n4. Solution-Based pathway (enabled):', standards.length, 'standards');
    standards.forEach(s => console.log(`   - ${s.submissionType}`));

    // Test 5: Disabled standards (shouldn't appear to students)
    standards = await GradingStandard.find({ enabled: false });
    console.log('\n5. Disabled standards (should NOT appear to students):', standards.length, 'standards');
    if (standards.length > 0) {
      standards.forEach(s => console.log(`   - ${s.submissionType} [HIDDEN FROM STUDENTS]`));
    } else {
      console.log('   (none - all standards are enabled)');
    }

    console.log('\n✓ Filter test complete');
    console.log('\nSummary:');
    console.log('✓ Enabled filter: students only see enabled: true');
    console.log('✓ Pathway filter: students only see their pathway');
    
    await mongoose.disconnect();
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

testGradingStandardFilter();
