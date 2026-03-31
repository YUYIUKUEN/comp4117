/**
 * Migration Script — Add pathway field to existing topics
 * This script adds the 'pathway' field to topic documents that don't have it
 * 
 * Run: node migrate-add-pathway.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Topic = require('./src/models/Topic');

async function migratePathway() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Find topics without pathway field
    const topicsWithoutPathway = await Topic.find({ pathway: { $exists: false } });
    console.log(`Found ${topicsWithoutPathway.length} topics without pathway field\n`);

    if (topicsWithoutPathway.length === 0) {
      console.log('✓ All topics already have pathway field');
      await mongoose.disconnect();
      return;
    }

    // Add pathway field to existing topics (default to 'Solution-Based')
    const result = await Topic.updateMany(
      { pathway: { $exists: false } },
      { $set: { pathway: 'Solution-Based' } }
    );

    console.log(`✓ Updated ${result.modifiedCount} topics`);
    console.log('✓ Added pathway field to all topics (default: Solution-Based)\n');

    // Verify the migration
    const allTopics = await Topic.find({});
    const withPathway = await Topic.find({ pathway: { $exists: true } });
    console.log(`Total topics: ${allTopics.length}`);
    console.log(`Topics with pathway: ${withPathway.length}`);

    await mongoose.disconnect();
    console.log('\n✓ Migration complete');
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  }
}

migratePathway();
