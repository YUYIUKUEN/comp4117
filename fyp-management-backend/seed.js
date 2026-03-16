require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Topic = require('./src/models/Topic');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Clear existing test users
    await User.deleteMany({ 
      email: { $in: ['student@university.edu', 'supervisor@university.edu', 'admin@university.edu'] } 
    });
    console.log('✓ Cleared existing test users');

    // Hash the password
    const passwordHash = await bcrypt.hash('test-password-123', 10);

    // Create test users
    const users = await User.insertMany([
      {
        email: 'student@university.edu',
        passwordHash,
        fullName: 'Test Student',
        role: 'Student',
      },
      {
        email: 'supervisor@university.edu',
        passwordHash,
        fullName: 'Dr. Test Supervisor',
        role: 'Supervisor',
      },
      {
        email: 'admin@university.edu',
        passwordHash,
        fullName: 'System Administrator',
        role: 'Admin',
      },
    ]);

    console.log('✓ Created test users:');
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) [password: test-password-123]`);
    });

    // Get supervisor ID for topics
    const supervisor = users.find(u => u.role === 'Supervisor');

    // Clear existing topics by this supervisor
    await Topic.deleteMany({ supervisor_id: supervisor._id });

    // Create sample topics
    const topics = await Topic.insertMany([
      {
        title: 'Smart City Walkability in Kowloon East',
        description: 'This project explores the walkability of urban spaces in Kowloon East using smart city data and pedestrian flow analysis. Students will work with GIS data, pedestrian sensors, and develop metrics to measure and improve walkability in dense urban environments. The research involves field surveys, data analysis, and proposing design interventions.',
        supervisor_id: supervisor._id,
        concentration: 'Health and Social Wellness Concentration (HSW)',
        keywords: ['smart city', 'GIS', 'urban planning', 'walkability', 'data analysis'],
        status: 'Active',
        maxApplications: 3,
      },
      {
        title: 'Digital Platforms and Youth Political Participation',
        description: 'Investigate how digital platforms influence youth political engagement and participation. This research examines social media usage patterns, online activism, and the role of technology in democratic processes. Students will conduct surveys, analyze social media data, and develop recommendations for enhancing civic engagement through digital tools.',
        supervisor_id: supervisor._id,
        concentration: 'Health Technology and Informatics Concentration (HTI)',
        keywords: ['social media', 'political participation', 'youth engagement', 'digital democracy'],
        status: 'Active',
        maxApplications: 2,
      },
      {
        title: 'Literary Analysis and Digital Storytelling',
        description: 'Combine traditional literary analysis with modern digital storytelling techniques. Students will explore how classic narratives can be reimagined through interactive media, including web applications, games, and multimedia presentations. This project bridges humanities and technology.',
        supervisor_id: supervisor._id,
        concentration: 'Health and Social Wellness Concentration (HSW)',
        keywords: ['digital humanities', 'storytelling', 'interactive media', 'literature'],
        status: 'Active',
        maxApplications: 4,
      },
      {
        title: 'Machine Learning for Healthcare Diagnostics',
        description: 'Develop machine learning models to assist in medical diagnostics. This project involves working with medical imaging datasets, training neural networks, and evaluating model performance for detecting various conditions. Students will learn about responsible AI in healthcare contexts.',
        supervisor_id: supervisor._id,
        concentration: 'Health Technology and Informatics Concentration (HTI)',
        keywords: ['machine learning', 'healthcare', 'medical imaging', 'neural networks', 'diagnostics'],
        status: 'Active',
        maxApplications: 2,
      },
      {
        title: 'Blockchain-based Supply Chain Transparency',
        description: 'Design and implement a blockchain solution for supply chain management. This project focuses on using distributed ledger technology to improve transparency, traceability, and trust in supply chains. Students will work with smart contracts and develop proof-of-concept applications.',
        supervisor_id: supervisor._id,
        concentration: 'Health Technology and Informatics Concentration (HTI)',
        keywords: ['blockchain', 'supply chain', 'smart contracts', 'distributed systems'],
        status: 'Active',
        maxApplications: 3,
      },
      {
        title: 'Cybersecurity Risk Assessment Framework',
        description: 'Develop a comprehensive cybersecurity risk assessment framework for small and medium enterprises. This project involves threat modeling, vulnerability assessment, and creating practical guidelines for organizations to improve their security posture without significant resource investment.',
        supervisor_id: supervisor._id,
        concentration: 'Cybersecurity',
        keywords: ['cybersecurity', 'risk assessment', 'threat modeling', 'SME security'],
        status: 'Active',
        maxApplications: 2,
      },
    ]);

    console.log('✓ Created sample topics:');
    topics.forEach(topic => {
      console.log(`  - ${topic.title} (${topic.status})`);
    });

    await mongoose.disconnect();
    console.log('✓ Database seeded successfully');
  } catch (error) {
    console.error('✗ Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();
