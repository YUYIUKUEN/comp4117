/**
 * Migration Script — Add pathways field to existing grading standards
 * This script adds the 'pathways' field to grading standard documents that don't have it
 * 
 * Run: node migrate-add-grading-standard-pathways.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const GradingStandard = require('./src/models/GradingStandard');

async function migratePathways() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Find grading standards without pathways field
    const standardsWithoutPathways = await GradingStandard.find({ pathways: { $exists: false } });
    console.log(`Found ${standardsWithoutPathways.length} grading standards without pathways field\n`);

    if (standardsWithoutPathways.length === 0) {
      console.log('✓ All grading standards already have pathways field');
      await mongoose.disconnect();
      return;
    }

    // Add pathways field to existing standards (default to both pathways)
    const result = await GradingStandard.updateMany(
      { pathways: { $exists: false } },
      { $set: { pathways: ['Research-Based', 'Solution-Based'] } }
    );

    console.log(`✓ Updated ${result.modifiedCount} grading standards`);
    console.log('✓ Added pathways field (default: both Research-Based and Solution-Based)\n');

    // Verify the migration
    const allStandards = await GradingStandard.find({});
    const withPathways = await GradingStandard.find({ pathways: { $exists: true } });
    console.log(`Total grading standards: ${allStandards.length}`);
    console.log(`Standards with pathways: ${withPathways.length}`);

    // Show the standards
    console.log('\nGrading Standards after migration:');
    allStandards.forEach(s => {
      console.log(`  - ${s.submissionType} | pathways: ${s.pathways.join(', ')} | enabled: ${s.enabled}`);
    });

    await mongoose.disconnect();
    console.log('\n✓ Migration complete');
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  }
}

migratePathways();
