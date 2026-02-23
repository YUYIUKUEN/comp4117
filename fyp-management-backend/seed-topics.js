const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const Topic = require('./src/models/Topic');
const User = require('./src/models/User');

const seedTopics = async () => {
  try {
    console.log('MongoDB URI:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const supervisor = await User.findOne({ role: 'Supervisor' });
    if (!supervisor) {
      console.log('No supervisor found. Run seed.js first.');
      process.exit(1);
    }
    console.log('Found supervisor:', supervisor.fullName);
    
    // Clear existing topics
    await Topic.deleteMany({});
    console.log('Cleared existing topics');
    
    const topics = await Topic.insertMany([
      {
        title: 'Smart City Walkability in Kowloon East',
        description: 'This project explores the walkability of urban spaces in Kowloon East using smart city data and pedestrian flow analysis. Students will work with GIS data and pedestrian sensors.',
        supervisor_id: supervisor._id,
        concentration: 'Software Engineering',
        keywords: ['smart city', 'GIS', 'walkability'],
        status: 'Active',
      },
      {
        title: 'Digital Platforms and Youth Political Participation',
        description: 'Investigate how digital platforms influence youth political engagement and participation. This research examines social media usage patterns and online activism.',
        supervisor_id: supervisor._id,
        concentration: 'AI/ML',
        keywords: ['social media', 'political participation'],
        status: 'Active',
      },
      {
        title: 'Literary Analysis and Digital Storytelling',
        description: 'Combine traditional literary analysis with modern digital storytelling techniques. Students will explore how classic narratives can be reimagined through interactive media.',
        supervisor_id: supervisor._id,
        concentration: 'Software Engineering',
        keywords: ['digital humanities', 'storytelling'],
        status: 'Active',
      },
      {
        title: 'Machine Learning for Healthcare Diagnostics',
        description: 'Develop machine learning models to assist in medical diagnostics. This project involves working with medical imaging datasets and training neural networks.',
        supervisor_id: supervisor._id,
        concentration: 'AI/ML',
        keywords: ['machine learning', 'healthcare'],
        status: 'Active',
      },
      {
        title: 'Blockchain-based Supply Chain Transparency',
        description: 'Design and implement a blockchain solution for supply chain management. This project focuses on using distributed ledger technology to improve transparency.',
        supervisor_id: supervisor._id,
        concentration: 'Systems',
        keywords: ['blockchain', 'supply chain'],
        status: 'Active',
      },
      {
        title: 'Cybersecurity Risk Assessment Framework',
        description: 'Develop a comprehensive cybersecurity risk assessment framework for small and medium enterprises. This project involves threat modeling and vulnerability assessment.',
        supervisor_id: supervisor._id,
        concentration: 'Cybersecurity',
        keywords: ['cybersecurity', 'risk assessment'],
        status: 'Active',
      },
    ]);
    
    console.log('Created', topics.length, 'topics:');
    topics.forEach(t => console.log('  -', t.title));
    
    await mongoose.disconnect();
    console.log('Done');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

seedTopics();
