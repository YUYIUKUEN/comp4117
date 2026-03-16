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
        title: 'Community Health Intervention Programs',
        description: 'Design and evaluate community health intervention programs targeting underserved populations. Students will work with local health organizations to implement wellness initiatives.',
        supervisor_id: supervisor._id,
        concentration: 'Health and Social Wellness Concentration (HSW)',
        keywords: ['community health', 'wellness', 'intervention'],
        status: 'Active',
      },
      {
        title: 'Mental Health Support in Digital Age',
        description: 'Investigate the effectiveness of digital platforms in providing mental health support and peer counseling. This project explores online mental health resources and their impact.',
        supervisor_id: supervisor._id,
        concentration: 'Health and Social Wellness Concentration (HSW)',
        keywords: ['mental health', 'digital support', 'wellbeing'],
        status: 'Active',
      },
      {
        title: 'Public Health Policy Analysis',
        description: 'Analyze current public health policies and their implementation in healthcare systems. Students will examine policy effectiveness and recommend improvements for social wellbeing.',
        supervisor_id: supervisor._id,
        concentration: 'Health and Social Wellness Concentration (HSW)',
        keywords: ['public health', 'policy', 'health systems'],
        status: 'Active',
      },
      {
        title: 'Health Technology for Elderly Care',
        description: 'Develop health technology solutions for monitoring and supporting elderly care. This project involves designing IoT devices and health management applications.',
        supervisor_id: supervisor._id,
        concentration: 'Health Technology and Informatics Concentration (HTI)',
        keywords: ['health tech', 'IoT', 'elderly care', 'machine learning'],
        status: 'Active',
      },
      {
        title: 'Medical Imaging AI System',
        description: 'Build AI-powered medical imaging analysis system for diagnostic support. This project involves training neural networks on medical datasets for disease detection.',
        supervisor_id: supervisor._id,
        concentration: 'Health Technology and Informatics Concentration (HTI)',
        keywords: ['AI', 'medical imaging', 'diagnostics', 'deep learning'],
        status: 'Active',
      },
      {
        title: 'Electronic Health Records Integration',
        description: 'Design an integrated electronic health records system with data security and interoperability features. Students will work on healthcare IT infrastructure and cybersecurity.',
        supervisor_id: supervisor._id,
        concentration: 'Health Technology and Informatics Concentration (HTI)',
        keywords: ['health informatics', 'EHR', 'data security', 'integration'],
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
