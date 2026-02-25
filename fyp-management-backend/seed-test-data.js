require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Topic = require('./src/models/Topic');
const Application = require('./src/models/Application');

const seedTestData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Clear existing test data
    const testEmails = [
      'supervisor@example.com',
      'student1@example.com',
      'student2@example.com',
      'student3@example.com',
      'student4@example.com',
    ];

    await User.deleteMany({ email: { $in: testEmails } });
    console.log('✓ Cleared existing test users');

    // Hash password
    const passwordHash = await bcrypt.hash('password123', 10);

    // Create supervisor and students
    const users = await User.insertMany([
      {
        email: 'supervisor@example.com',
        passwordHash,
        fullName: 'Dr. Emily Lee',
        role: 'Supervisor',
        concentration: 'Software Engineering',
        phone: '+852-1234-5678',
        officeHours: 'Monday & Wednesday 2-4pm',
      },
      {
        email: 'student1@example.com',
        passwordHash,
        fullName: 'Student Chan Hoi Ting',
        role: 'Student',
        concentration: 'Software Engineering',
        phone: '+852-9876-5432',
      },
      {
        email: 'student2@example.com',
        passwordHash,
        fullName: 'Student Lau Tsz Yan',
        role: 'Student',
        concentration: 'AI/ML',
        phone: '+852-9876-5433',
      },
      {
        email: 'student3@example.com',
        passwordHash,
        fullName: 'Student Wong Kai Ming',
        role: 'Student',
        concentration: 'Software Engineering',
        phone: '+852-9876-5434',
      },
      {
        email: 'student4@example.com',
        passwordHash,
        fullName: 'Student Ng Mei Ching',
        role: 'Student',
        concentration: 'Cybersecurity',
        phone: '+852-9876-5435',
      },
    ]);

    console.log('\n✓ Created test users:');
    console.log('  Supervisor:');
    console.log('    - supervisor@example.com (password: password123)');
    console.log('  Students:');
    users.slice(1).forEach(user => {
      console.log(`    - ${user.email} (${user.fullName})`);
    });

    const supervisor = users[0];
    const students = users.slice(1);

    // Clear existing topics and applications
    await Topic.deleteMany({ supervisor_id: supervisor._id });
    await Application.deleteMany({
      student_id: { $in: students.map(s => s._id) },
    });

    // Create sample topics
    const topics = await Topic.insertMany([
      {
        title: 'Smart City Walkability in Kowloon East',
        description:
          'This project explores the walkability of urban spaces in Kowloon East using smart city data and pedestrian flow analysis. Students will work with GIS data, pedestrian sensors, and develop metrics to measure and improve walkability in dense urban environments.',
        supervisor_id: supervisor._id,
        concentration: 'Software Engineering',
        academicYear: 4,
        keywords: ['smart city', 'GIS', 'urban planning', 'walkability'],
        status: 'Active',
        maxApplications: 3,
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Machine Learning for Healthcare Diagnostics',
        description:
          'Develop machine learning models to assist in medical diagnostics. This project involves working with medical imaging datasets, training neural networks, and evaluating model performance for detecting various conditions.',
        supervisor_id: supervisor._id,
        concentration: 'AI/ML',
        academicYear: 3,
        keywords: ['machine learning', 'healthcare', 'medical imaging', 'neural networks'],
        status: 'Active',
        maxApplications: 2,
        applicationDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Blockchain-based Supply Chain Transparency',
        description:
          'Design and implement a blockchain solution for supply chain management. This project focuses on using distributed ledger technology to improve transparency, traceability, and trust in supply chains.',
        supervisor_id: supervisor._id,
        concentration: 'Cybersecurity',
        academicYear: 4,
        keywords: ['blockchain', 'supply chain', 'smart contracts', 'distributed systems'],
        status: 'Active',
        maxApplications: 2,
        applicationDeadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
      },
    ]);

    console.log('\n✓ Created sample topics:');
    topics.forEach(topic => {
      console.log(`  - ${topic.title}`);
    });

    // Create applications (student applications to supervisor's topics)
    const applications = await Application.insertMany([
      {
        student_id: students[0]._id, // Chan Hoi Ting
        topic_id: topics[0]._id, // Smart City Walkability
        preference_rank: 1,
        status: 'Approved',
      },
      {
        student_id: students[1]._id, // Lau Tsz Yan
        topic_id: topics[1]._id, // Machine Learning Healthcare
        preference_rank: 1,
        status: 'Approved',
      },
      {
        student_id: students[2]._id, // Wong Kai Ming
        topic_id: topics[0]._id, // Smart City Walkability
        preference_rank: 2,
        status: 'Pending',
      },
      {
        student_id: students[3]._id, // Ng Mei Ching
        topic_id: topics[2]._id, // Blockchain Supply Chain
        preference_rank: 1,
        status: 'Approved',
      },
      {
        student_id: students[0]._id, // Chan Hoi Ting
        topic_id: topics[1]._id, // Machine Learning Healthcare
        preference_rank: 2,
        status: 'Pending',
      },
    ]);

    console.log('\n✓ Created test applications:');
    applications.forEach(app => {
      const student = students.find(s => s._id.equals(app.student_id));
      const topic = topics.find(t => t._id.equals(app.topic_id));
      console.log(`  - ${student.fullName} → ${topic.title} (${app.status})`);
    });

    await mongoose.disconnect();
    console.log('\n✓ Test data seeded successfully!');
    console.log('\n📝 Login credentials:');
    console.log('  Email: supervisor@example.com');
    console.log('  Password: password123');
  } catch (error) {
    console.error('✗ Error seeding test data:', error.message);
    console.error(error);
    process.exit(1);
  }
};

seedTestData();
