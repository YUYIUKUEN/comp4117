/**
 * Demo Seed Script — creates 1 Admin, 1 Supervisor, 2 Students
 * with topics, applications, assignments, submissions, feedback, and activity logs.
 *
 * All passwords: Password1
 *
 * Run:  node seed-demo.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./src/models/User');
const Topic = require('./src/models/Topic');
const Application = require('./src/models/Application');
const Assignment = require('./src/models/Assignment');
const Submission = require('./src/models/Submission');
const Feedback = require('./src/models/Feedback');
const ActivityLog = require('./src/models/ActivityLog');

const DEMO_EMAILS = [
  'admin@demo.edu',
  'supervisor@demo.edu',
  'emily.lee@demo.edu',
  'student1@demo.edu',
  'student2@demo.edu',
  'student3@demo.edu',
];

const PASSWORD = 'Password1';

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // ── Cleanup previous demo data ──────────────────────────────────
    const oldUsers = await User.find({ email: { $in: DEMO_EMAILS } });
    const oldIds = oldUsers.map(u => u._id);

    if (oldIds.length) {
      await Feedback.deleteMany({ supervisor_id: { $in: oldIds } });
      await Submission.deleteMany({ student_id: { $in: oldIds } });
      await Assignment.deleteMany({ $or: [{ student_id: { $in: oldIds } }, { supervisor_id: { $in: oldIds } }] });
      await Application.deleteMany({ student_id: { $in: oldIds } });
      await Topic.deleteMany({ supervisor_id: { $in: oldIds } });
      await ActivityLog.deleteMany({ user_id: { $in: oldIds } });
      await User.deleteMany({ _id: { $in: oldIds } });
      console.log('✓ Cleaned up previous demo data');
    }

    // ── Users ───────────────────────────────────────────────────────
    const hash = await bcrypt.hash(PASSWORD, 10);

    const [admin, supervisor, emilyLee, student1, student2, student3] = await User.create([
      { email: 'admin@demo.edu', passwordHash: hash, fullName: 'Alice Admin', role: 'Admin' },
      { email: 'supervisor@demo.edu', passwordHash: hash, fullName: 'Dr. Samuel Lee', role: 'Supervisor', concentration: 'Health and Social Wellness Concentration (HSW)', phone: '+852-2345-6789', officeHours: 'Tue & Thu 2-4 pm' },
      { email: 'emily.lee@demo.edu', passwordHash: hash, fullName: 'Emily Lee', role: 'Supervisor', concentration: 'Health Technology and Informatics Concentration (HTI)', phone: '+852-9777-8888', officeHours: 'Mon & Wed 10-12 pm' },
      { email: 'student1@demo.edu', passwordHash: hash, fullName: 'Bob Chan', role: 'Student', concentration: 'Health and Social Wellness Concentration (HSW)', phone: '+852-9111-2222' },
      { email: 'student2@demo.edu', passwordHash: hash, fullName: 'Carol Wong', role: 'Student', concentration: 'Health Technology and Informatics Concentration (HTI)', phone: '+852-9333-4444' },
      { email: 'student3@demo.edu', passwordHash: hash, fullName: 'David Smith', role: 'Student', concentration: 'Health and Social Wellness Concentration (HSW)', phone: '+852-9555-6666' },
    ]);

    console.log('✓ Created users');

    // ── Topics (by supervisor) ──────────────────────────────────────
    const [topic1, topic2, topic3, topic4] = await Topic.create([
      {
        title: 'AI-Powered Student Advisor Chatbot',
        description: 'Build an intelligent chatbot that helps university students choose courses, understand degree requirements, and plan their academic journey. The system will use natural language processing and a knowledge base of programme regulations to provide personalised advice. Students will explore prompt engineering, retrieval-augmented generation (RAG), and user-interface design for conversational AI.',
        supervisor_id: supervisor._id,
        concentration: 'Health Technology and Informatics Concentration (HTI)',
        academicYear: 4,
        keywords: ['chatbot', 'NLP', 'RAG', 'student advisor', 'LLM'],
        status: 'Active',
        maxApplications: 3,
        applicationDeadline: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      },
      {
        title: 'Cross-Platform Mobile App for Campus Navigation',
        description: 'Design and develop a cross-platform mobile application that provides real-time indoor and outdoor navigation across the university campus. The project covers map rendering, shortest-path algorithms, Bluetooth beacon integration, and accessibility features for visually impaired users. Students will gain experience with React Native or Flutter and geolocation APIs.',
        supervisor_id: supervisor._id,
        concentration: 'Health and Social Wellness Concentration (HSW)',
        academicYear: 4,
        keywords: ['mobile app', 'navigation', 'indoor positioning', 'accessibility'],
        status: 'Active',
        maxApplications: 2,
        applicationDeadline: new Date(Date.now() + 25 * 24 * 3600 * 1000),
      },
      {
        title: 'Blockchain Credential Verification System',
        description: 'Implement a decentralised system for issuing and verifying academic credentials on a blockchain network. This project involves smart-contract development, cryptographic hashing, and building a web portal where employers can instantly verify a graduate\'s qualifications without contacting the institution. Students will learn Solidity, IPFS, and modern web development.',
        supervisor_id: supervisor._id,
        concentration: 'Health Technology and Informatics Concentration (HTI)',
        academicYear: 3,
        keywords: ['blockchain', 'credentials', 'smart contracts', 'verification'],
        status: 'Active',
        maxApplications: 2,
        applicationDeadline: new Date(Date.now() + 35 * 24 * 3600 * 1000),
      },
      {
        title: 'Automated Code Review Tool Using Static Analysis',
        description: 'Create a tool that performs automated code reviews by combining static analysis, coding-style enforcement, and simple machine-learning classifiers to detect common bug patterns. The tool will integrate with GitHub pull requests and provide inline suggestions. Students will study abstract syntax trees, linting frameworks, and CI/CD pipelines to build a practical developer tool.',
        supervisor_id: supervisor._id,
        concentration: 'Health and Social Wellness Concentration (HSW)',
        academicYear: 4,
        keywords: ['code review', 'static analysis', 'CI/CD', 'developer tools'],
        status: 'Draft',
        maxApplications: 3,
      },
    ]);

    console.log('✓ Created 4 topics (3 Active, 1 Draft)');

    // ── Applications ────────────────────────────────────────────────
    const [app1, app2, app3, app4, app5] = await Application.create([
      { student_id: student1._id, topic_id: topic1._id, preference_rank: 1, status: 'Approved', decidedAt: new Date() },
      { student_id: student1._id, topic_id: topic2._id, preference_rank: 2, status: 'Pending' },
      { student_id: student2._id, topic_id: topic1._id, preference_rank: 2, status: 'Rejected', supervisorNotes: 'Topic already full for this cycle.', decidedAt: new Date() },
      { student_id: student2._id, topic_id: topic3._id, preference_rank: 1, status: 'Approved', decidedAt: new Date() },
      { student_id: student2._id, topic_id: topic2._id, preference_rank: 3, status: 'Pending' },
    ]);

    console.log('✓ Created 5 applications (2 Approved, 2 Pending, 1 Rejected)');

    // ── Assignments (from approved applications) ────────────────────
    const [assign1, assign2] = await Assignment.create([
      { student_id: student1._id, topic_id: topic1._id, supervisor_id: supervisor._id, status: 'Active' },
      { student_id: student2._id, topic_id: topic3._id, supervisor_id: supervisor._id, status: 'Active' },
    ]);

    console.log('✓ Created 2 assignments');

    // ── Submissions ─────────────────────────────────────────────────
    const now = new Date();
    const pastDate = (daysAgo) => new Date(now.getTime() - daysAgo * 24 * 3600 * 1000);
    const futureDate = (daysAhead) => new Date(now.getTime() + daysAhead * 24 * 3600 * 1000);

    const [sub1, sub2, sub3, sub4, sub5, sub6] = await Submission.create([
      // Student 1 — has submitted Initial Statement and Progress Report 1
      {
        student_id: student1._id,
        topic_id: topic1._id,
        assignment_id: assign1._id,
        phase: 'Initial Statement',
        status: 'Submitted',
        submittedAt: pastDate(40),
        submittedDate: pastDate(40),
        dueDate: pastDate(45),
        files: [{ filename: 'initial_statement_bob.pdf', originalName: 'Initial Statement.pdf', mimetype: 'application/pdf', size: 245000 }],
      },
      {
        student_id: student1._id,
        topic_id: topic1._id,
        assignment_id: assign1._id,
        phase: 'Progress Report 1',
        status: 'Submitted',
        submittedAt: pastDate(10),
        submittedDate: pastDate(10),
        dueDate: pastDate(14),
        files: [{ filename: 'progress1_bob.pdf', originalName: 'Progress Report 1.pdf', mimetype: 'application/pdf', size: 512000 }],
      },
      // Student 1 — Progress Report 2 upcoming
      {
        student_id: student1._id,
        topic_id: topic1._id,
        assignment_id: assign1._id,
        phase: 'Progress Report 2',
        status: 'Not Submitted',
        dueDate: futureDate(20),
      },
      // Student 2 — submitted Initial Statement, Progress Report 1 overdue
      {
        student_id: student2._id,
        topic_id: topic3._id,
        assignment_id: assign2._id,
        phase: 'Initial Statement',
        status: 'Submitted',
        submittedAt: pastDate(35),
        submittedDate: pastDate(35),
        dueDate: pastDate(40),
        files: [{ filename: 'initial_carol.pdf', originalName: 'Initial Statement.pdf', mimetype: 'application/pdf', size: 198000 }],
      },
      {
        student_id: student2._id,
        topic_id: topic3._id,
        assignment_id: assign2._id,
        phase: 'Progress Report 1',
        status: 'Overdue',
        dueDate: pastDate(3),
      },
      // Student 2 — Progress Report 2 far future
      {
        student_id: student2._id,
        topic_id: topic3._id,
        assignment_id: assign2._id,
        phase: 'Progress Report 2',
        status: 'Not Submitted',
        dueDate: futureDate(50),
      },
    ]);

    console.log('✓ Created 6 submissions (3 Submitted, 1 Overdue, 2 Not Submitted)');

    // ── Feedback (from supervisor) ──────────────────────────────────
    await Feedback.create([
      {
        submission_id: sub1._id,
        supervisor_id: supervisor._id,
        feedbackText: 'Good start on defining the project scope. Please refine the literature review section and add more references to recent NLP papers. The timeline looks realistic.',
      },
      {
        submission_id: sub2._id,
        supervisor_id: supervisor._id,
        feedbackText: 'Solid progress on the RAG pipeline. The retrieval accuracy benchmarks are promising. For the next phase, focus on improving the response latency and adding a fallback mechanism when confidence is low.',
      },
      {
        submission_id: sub4._id,
        supervisor_id: supervisor._id,
        feedbackText: 'The initial scope is well-defined. I suggest narrowing the credential types to degree certificates first before expanding. Include a threat model in Progress Report 1.',
        isPrivate: true,
      },
    ]);

    console.log('✓ Created 3 feedback entries');

    // ── Activity Logs ───────────────────────────────────────────────
    await ActivityLog.create([
      { user_id: admin._id, action: 'login', entityType: 'User', entityId: admin._id, timestamp: pastDate(1) },
      { user_id: admin._id, action: 'user_created', entityType: 'User', entityId: supervisor._id, details: { role: 'Supervisor' }, timestamp: pastDate(60) },
      { user_id: supervisor._id, action: 'login', entityType: 'User', entityId: supervisor._id, timestamp: pastDate(0.5) },
      { user_id: supervisor._id, action: 'topic_created', entityType: 'Topic', entityId: topic1._id, details: { title: topic1.title }, timestamp: pastDate(55) },
      { user_id: supervisor._id, action: 'topic_created', entityType: 'Topic', entityId: topic2._id, details: { title: topic2.title }, timestamp: pastDate(54) },
      { user_id: supervisor._id, action: 'topic_created', entityType: 'Topic', entityId: topic3._id, details: { title: topic3.title }, timestamp: pastDate(53) },
      { user_id: supervisor._id, action: 'application_approved', entityType: 'Application', entityId: app1._id, details: { student: student1.fullName }, timestamp: pastDate(45) },
      { user_id: supervisor._id, action: 'application_approved', entityType: 'Application', entityId: app4._id, details: { student: student2.fullName }, timestamp: pastDate(44) },
      { user_id: supervisor._id, action: 'application_rejected', entityType: 'Application', entityId: app3._id, details: { student: student2.fullName }, timestamp: pastDate(44) },
      { user_id: supervisor._id, action: 'feedback_given', entityType: 'Submission', entityId: sub1._id, timestamp: pastDate(38) },
      { user_id: supervisor._id, action: 'feedback_given', entityType: 'Submission', entityId: sub2._id, timestamp: pastDate(8) },
      { user_id: supervisor._id, action: 'feedback_given', entityType: 'Submission', entityId: sub4._id, timestamp: pastDate(30) },
      { user_id: student1._id, action: 'login', entityType: 'User', entityId: student1._id, timestamp: pastDate(0.2) },
      { user_id: student1._id, action: 'application_submitted', entityType: 'Application', entityId: app1._id, timestamp: pastDate(50) },
      { user_id: student1._id, action: 'application_submitted', entityType: 'Application', entityId: app2._id, timestamp: pastDate(50) },
      { user_id: student1._id, action: 'submission_uploaded', entityType: 'Submission', entityId: sub1._id, timestamp: pastDate(40) },
      { user_id: student1._id, action: 'submission_uploaded', entityType: 'Submission', entityId: sub2._id, timestamp: pastDate(10) },
      { user_id: student2._id, action: 'login', entityType: 'User', entityId: student2._id, timestamp: pastDate(2) },
      { user_id: student2._id, action: 'application_submitted', entityType: 'Application', entityId: app3._id, timestamp: pastDate(48) },
      { user_id: student2._id, action: 'application_submitted', entityType: 'Application', entityId: app4._id, timestamp: pastDate(47) },
      { user_id: student2._id, action: 'application_submitted', entityType: 'Application', entityId: app5._id, timestamp: pastDate(46) },
      { user_id: student2._id, action: 'submission_uploaded', entityType: 'Submission', entityId: sub4._id, timestamp: pastDate(35) },
    ]);

    console.log('✓ Created activity logs');

    // ── Summary ─────────────────────────────────────────────────────
    await mongoose.disconnect();

    console.log('\n══════════════════════════════════════════════');
    console.log('  DEMO ACCOUNTS  (all passwords: Password1)');
    console.log('══════════════════════════════════════════════');
    console.log('  Admin         : admin@demo.edu');
    console.log('  Supervisors   : supervisor@demo.edu (Dr. Samuel Lee)');
    console.log('                  emily.lee@demo.edu (Emily Lee)');
    console.log('  Student 1     : student1@demo.edu   (Bob Chan)');
    console.log('  Student 2     : student2@demo.edu   (Carol Wong)');
    console.log('  Student 3     : student3@demo.edu   (David Smith - CLEAN ACCOUNT)');
    console.log('══════════════════════════════════════════════');
    console.log('\n✓ Demo data seeded successfully!');

  } catch (err) {
    console.error('✗ Seed failed:', err.message);
    console.error(err);
    process.exit(1);
  }
};

run();
