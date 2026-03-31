/**
 * Migration Script — Add enabledByPathway field to grading standards
 * This script adds pathway-specific enable/disable to existing grading standards
 * 
 * Run: node migrate-add-enabled-by-pathway.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const GradingStandard = require('./src/models/GradingStandard');

async function migrateEnabledByPathway() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Find grading standards without enabledByPathway field
    const standardsWithoutField = await GradingStandard.find({ enabledByPathway: { $exists: false } });
    console.log(`Found ${standardsWithoutField.length} grading standards without enabledByPathway field\n`);

    if (standardsWithoutField.length === 0) {
      console.log('✓ All grading standards already have enabledByPathway field');
      await mongoose.disconnect();
      return;
    }

    // Add enabledByPathway field to existing standards
    // Use the global 'enabled' field value for both pathways
    const result = await GradingStandard.updateMany(
      { enabledByPathway: { $exists: false } },
      [
        {
          $set: {
            enabledByPathway: {
              'Research-Based': { $cond: ['$enabled', true, false] },
              'Solution-Based': { $cond: ['$enabled', true, false] }
            }
          }
        }
      ]
    );

    console.log(`✓ Updated ${result.modifiedCount} grading standards`);
    console.log('✓ Added enabledByPathway field (initialized from global "enabled" field)\n');

    // Verify the migration
    const allStandards = await GradingStandard.find({});
    console.log('Grading Standards after migration:');
    allStandards.forEach(s => {
      console.log(`  - ${s.submissionType}`);
      console.log(`    Research-Based: ${s.enabledByPathway?.['Research-Based'] ?? s.enabled}`);
      console.log(`    Solution-Based: ${s.enabledByPathway?.['Solution-Based'] ?? s.enabled}`);
    });

    await mongoose.disconnect();
    console.log('\n✓ Migration complete');
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  }
}

migrateEnabledByPathway();
