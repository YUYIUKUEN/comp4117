/**
 * Seed script to create supervisor test data
 * 
 * Creates:
 * - 1 Supervisor: Dr. Sarah Chen (supervisor@test.com / password123)
 * - 4 Students assigned to this supervisor
 * - 3 Topics owned by the supervisor
 * - Assignments linking students to topics
 * - Applications (pending, approved, rejected)
 * - Submissions at various phases
 * - Feedback on submissions
 * - Activity logs
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

// Pre-generated bcrypt hash for "password123" with 10 rounds
const PASSWORD_HASH = '$2a$10$mw5DAQXMO4G1cXP6Uu5M5OBE8yICN85wYKzRwiEvfP4xtC4NTaPmq';

// Generate ObjectIds upfront so we can cross-reference
const supervisorId = new mongoose.Types.ObjectId();
const student1Id = new mongoose.Types.ObjectId();
const student2Id = new mongoose.Types.ObjectId();
const student3Id = new mongoose.Types.ObjectId();
const student4Id = new mongoose.Types.ObjectId();

const topic1Id = new mongoose.Types.ObjectId();
const topic2Id = new mongoose.Types.ObjectId();
const topic3Id = new mongoose.Types.ObjectId();

const assignment1Id = new mongoose.Types.ObjectId();
const assignment2Id = new mongoose.Types.ObjectId();
const assignment3Id = new mongoose.Types.ObjectId();

const app1Id = new mongoose.Types.ObjectId();
const app2Id = new mongoose.Types.ObjectId();
const app3Id = new mongoose.Types.ObjectId();
const app4Id = new mongoose.Types.ObjectId();
const app5Id = new mongoose.Types.ObjectId();
const app6Id = new mongoose.Types.ObjectId();

const sub1Id = new mongoose.Types.ObjectId();
const sub2Id = new mongoose.Types.ObjectId();
const sub3Id = new mongoose.Types.ObjectId();
const sub4Id = new mongoose.Types.ObjectId();
const sub5Id = new mongoose.Types.ObjectId();

const now = new Date();

// ─── USERS ───────────────────────────────────────────────
const users = [
  {
    _id: supervisorId,
    email: 'supervisor@test.com',
    passwordHash: PASSWORD_HASH,
    fullName: 'Dr. Sarah Chen',
    role: 'Supervisor',
    concentration: 'AI/ML',
    phone: '+852 9876 5432',
    officeHours: 'Mon & Wed 2:00 PM - 4:00 PM',
    createdAt: new Date('2025-09-01'),
    updatedAt: now,
  },
  {
    _id: student1Id,
    email: 'alice.wong@student.test.com',
    passwordHash: PASSWORD_HASH,
    fullName: 'Alice Wong',
    role: 'Student',
    concentration: 'AI/ML',
    phone: '+852 6111 2222',
    createdAt: new Date('2025-09-15'),
    updatedAt: now,
  },
  {
    _id: student2Id,
    email: 'bob.liu@student.test.com',
    passwordHash: PASSWORD_HASH,
    fullName: 'Bob Liu',
    role: 'Student',
    concentration: 'Software Engineering',
    phone: '+852 6333 4444',
    createdAt: new Date('2025-09-15'),
    updatedAt: now,
  },
  {
    _id: student3Id,
    email: 'carol.lee@student.test.com',
    passwordHash: PASSWORD_HASH,
    fullName: 'Carol Lee',
    role: 'Student',
    concentration: 'Cybersecurity',
    phone: '+852 6555 6666',
    createdAt: new Date('2025-09-15'),
    updatedAt: now,
  },
  {
    _id: student4Id,
    email: 'david.chan@student.test.com',
    passwordHash: PASSWORD_HASH,
    fullName: 'David Chan',
    role: 'Student',
    concentration: 'AI/ML',
    phone: '+852 6777 8888',
    createdAt: new Date('2025-09-15'),
    updatedAt: now,
  },
];

// ─── TOPICS ──────────────────────────────────────────────
const topics = [
  {
    _id: topic1Id,
    title: 'Deep Learning for Natural Language Understanding',
    description:
      'Explore transformer-based architectures for natural language processing tasks including sentiment analysis, named entity recognition, and question answering. Students will implement and fine-tune pre-trained models on domain-specific datasets and evaluate their performance.',
    supervisor_id: supervisorId,
    concentration: 'AI/ML',
    academicYear: 4,
    keywords: ['Deep Learning', 'NLP', 'Transformers', 'BERT'],
    referenceDocuments: [
      { name: 'Attention Is All You Need', url: 'https://arxiv.org/abs/1706.03762' },
      { name: 'BERT Paper', url: 'https://arxiv.org/abs/1810.04805' },
    ],
    status: 'Active',
    maxApplications: 3,
    applicationDeadline: new Date('2026-03-31'),
    flags: [],
    createdAt: new Date('2025-10-01'),
    updatedAt: now,
    __v: 0,
  },
  {
    _id: topic2Id,
    title: 'Intelligent Tutoring System with Adaptive Learning',
    description:
      'Design and develop an AI-powered tutoring platform that adapts to individual student learning patterns. The system should track progress, identify knowledge gaps, and dynamically adjust the difficulty and style of content delivery.',
    supervisor_id: supervisorId,
    concentration: 'Software Engineering',
    academicYear: 4,
    keywords: ['Adaptive Learning', 'EdTech', 'AI', 'Personalization'],
    referenceDocuments: [],
    status: 'Active',
    maxApplications: 2,
    applicationDeadline: new Date('2026-03-15'),
    flags: [],
    createdAt: new Date('2025-10-15'),
    updatedAt: now,
    __v: 0,
  },
  {
    _id: topic3Id,
    title: 'Privacy-Preserving Federated Learning Framework',
    description:
      'Implement a federated learning framework that enables multiple parties to collaboratively train machine learning models without sharing raw data. Focus on differential privacy techniques and secure aggregation protocols.',
    supervisor_id: supervisorId,
    concentration: 'Cybersecurity',
    academicYear: 4,
    keywords: ['Federated Learning', 'Privacy', 'Distributed ML', 'Differential Privacy'],
    referenceDocuments: [
      { name: 'Federated Learning Survey', url: 'https://arxiv.org/abs/1912.04977' },
    ],
    status: 'Active',
    maxApplications: 2,
    applicationDeadline: new Date('2026-04-01'),
    flags: [],
    createdAt: new Date('2025-11-01'),
    updatedAt: now,
    __v: 0,
  },
];

// ─── APPLICATIONS ────────────────────────────────────────
const applications = [
  // Alice applied to Topic 1 → Approved
  {
    _id: app1Id,
    student_id: student1Id,
    topic_id: topic1Id,
    preference_rank: 1,
    status: 'Approved',
    supervisorNotes: 'Strong ML background. Published a paper on sentiment analysis.',
    appliedAt: new Date('2025-11-10'),
    decidedAt: new Date('2025-11-20'),
    createdAt: new Date('2025-11-10'),
    updatedAt: new Date('2025-11-20'),
    __v: 0,
  },
  // Bob applied to Topic 2 → Approved
  {
    _id: app2Id,
    student_id: student2Id,
    topic_id: topic2Id,
    preference_rank: 1,
    status: 'Approved',
    supervisorNotes: 'Great full-stack skills. Perfect for the tutoring system project.',
    appliedAt: new Date('2025-11-12'),
    decidedAt: new Date('2025-11-22'),
    createdAt: new Date('2025-11-12'),
    updatedAt: new Date('2025-11-22'),
    __v: 0,
  },
  // Carol applied to Topic 3 → Approved
  {
    _id: app3Id,
    student_id: student3Id,
    topic_id: topic3Id,
    preference_rank: 1,
    status: 'Approved',
    supervisorNotes: 'Cybersecurity specialization aligns well with this topic.',
    appliedAt: new Date('2025-11-15'),
    decidedAt: new Date('2025-11-25'),
    createdAt: new Date('2025-11-15'),
    updatedAt: new Date('2025-11-25'),
    __v: 0,
  },
  // David applied to Topic 1 → Pending
  {
    _id: app4Id,
    student_id: student4Id,
    topic_id: topic1Id,
    preference_rank: 1,
    status: 'Pending',
    appliedAt: new Date('2026-02-10'),
    createdAt: new Date('2026-02-10'),
    updatedAt: new Date('2026-02-10'),
    __v: 0,
  },
  // David also applied to Topic 2 → Pending
  {
    _id: app5Id,
    student_id: student4Id,
    topic_id: topic2Id,
    preference_rank: 2,
    status: 'Pending',
    appliedAt: new Date('2026-02-10'),
    createdAt: new Date('2026-02-10'),
    updatedAt: new Date('2026-02-10'),
    __v: 0,
  },
  // Alice also applied to Topic 3 → Rejected (already assigned Topic 1)
  {
    _id: app6Id,
    student_id: student1Id,
    topic_id: topic3Id,
    preference_rank: 2,
    status: 'Rejected',
    supervisorNotes: 'Already assigned to another topic.',
    appliedAt: new Date('2025-11-10'),
    decidedAt: new Date('2025-11-20'),
    createdAt: new Date('2025-11-10'),
    updatedAt: new Date('2025-11-20'),
    __v: 0,
  },
];

// ─── ASSIGNMENTS ─────────────────────────────────────────
const assignments = [
  {
    _id: assignment1Id,
    student_id: student1Id,
    topic_id: topic1Id,
    supervisor_id: supervisorId,
    assigned_at: new Date('2025-12-01'),
    status: 'Active',
    createdAt: new Date('2025-12-01'),
    updatedAt: now,
    __v: 0,
  },
  {
    _id: assignment2Id,
    student_id: student2Id,
    topic_id: topic2Id,
    supervisor_id: supervisorId,
    assigned_at: new Date('2025-12-01'),
    status: 'Active',
    createdAt: new Date('2025-12-01'),
    updatedAt: now,
    __v: 0,
  },
  {
    _id: assignment3Id,
    student_id: student3Id,
    topic_id: topic3Id,
    supervisor_id: supervisorId,
    assigned_at: new Date('2025-12-05'),
    status: 'Active',
    createdAt: new Date('2025-12-05'),
    updatedAt: now,
    __v: 0,
  },
];

// ─── SUBMISSIONS ─────────────────────────────────────────
const submissions = [
  // Alice - Proposal (submitted & graded)
  {
    _id: sub1Id,
    student_id: student1Id,
    topic_id: topic1Id,
    assignment_id: assignment1Id,
    phase: 'Proposal',
    status: 'Graded',
    submittedAt: new Date('2026-01-15'),
    submittedDate: new Date('2026-01-15'),
    dueDate: new Date('2026-01-20'),
    files: [
      {
        filename: 'alice_proposal.pdf',
        originalName: 'NLP_Research_Proposal.pdf',
        mimetype: 'application/pdf',
        size: 245000,
        uploadedAt: new Date('2026-01-15'),
        url: '/uploads/submissions/alice_proposal.pdf',
      },
    ],
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-25'),
    __v: 0,
  },
  // Alice - Interim Report (submitted, awaiting review)
  {
    _id: sub2Id,
    student_id: student1Id,
    topic_id: topic1Id,
    assignment_id: assignment1Id,
    phase: 'Interim Report',
    status: 'Submitted',
    submittedAt: new Date('2026-02-20'),
    submittedDate: new Date('2026-02-20'),
    dueDate: new Date('2026-02-28'),
    files: [
      {
        filename: 'alice_interim.pdf',
        originalName: 'NLP_Interim_Report.pdf',
        mimetype: 'application/pdf',
        size: 512000,
        uploadedAt: new Date('2026-02-20'),
        url: '/uploads/submissions/alice_interim.pdf',
      },
    ],
    createdAt: new Date('2026-02-20'),
    updatedAt: new Date('2026-02-20'),
    __v: 0,
  },
  // Bob - Proposal (submitted & graded)
  {
    _id: sub3Id,
    student_id: student2Id,
    topic_id: topic2Id,
    assignment_id: assignment2Id,
    phase: 'Proposal',
    status: 'Graded',
    submittedAt: new Date('2026-01-18'),
    submittedDate: new Date('2026-01-18'),
    dueDate: new Date('2026-01-20'),
    files: [
      {
        filename: 'bob_proposal.pdf',
        originalName: 'Tutoring_System_Proposal.pdf',
        mimetype: 'application/pdf',
        size: 198000,
        uploadedAt: new Date('2026-01-18'),
        url: '/uploads/submissions/bob_proposal.pdf',
      },
    ],
    createdAt: new Date('2026-01-18'),
    updatedAt: new Date('2026-01-28'),
    __v: 0,
  },
  // Bob - Interim Report (draft, not yet submitted)
  {
    _id: sub4Id,
    student_id: student2Id,
    topic_id: topic2Id,
    assignment_id: assignment2Id,
    phase: 'Interim Report',
    status: 'Draft',
    dueDate: new Date('2026-02-28'),
    files: [],
    createdAt: new Date('2026-02-15'),
    updatedAt: new Date('2026-02-15'),
    __v: 0,
  },
  // Carol - Proposal (submitted, awaiting review)
  {
    _id: sub5Id,
    student_id: student3Id,
    topic_id: topic3Id,
    assignment_id: assignment3Id,
    phase: 'Proposal',
    status: 'Submitted',
    submittedAt: new Date('2026-02-10'),
    submittedDate: new Date('2026-02-10'),
    dueDate: new Date('2026-02-15'),
    files: [
      {
        filename: 'carol_proposal.pdf',
        originalName: 'Federated_Learning_Proposal.pdf',
        mimetype: 'application/pdf',
        size: 287000,
        uploadedAt: new Date('2026-02-10'),
        url: '/uploads/submissions/carol_proposal.pdf',
      },
    ],
    createdAt: new Date('2026-02-10'),
    updatedAt: new Date('2026-02-10'),
    __v: 0,
  },
];

// ─── FEEDBACKS ───────────────────────────────────────────
const feedbacks = [
  {
    submission_id: sub1Id,
    supervisor_id: supervisorId,
    feedbackText:
      'Excellent proposal. The research questions are well-defined and the methodology is sound. Consider expanding the literature review section to include more recent work on few-shot learning.',
    isPrivate: false,
    createdAt: new Date('2026-01-25'),
    updatedAt: new Date('2026-01-25'),
    __v: 0,
  },
  {
    submission_id: sub3Id,
    supervisor_id: supervisorId,
    feedbackText:
      'Good start on the tutoring system concept. The architecture diagram is clear. Please add more detail on the adaptive learning algorithm and how you plan to measure learning outcomes.',
    isPrivate: false,
    createdAt: new Date('2026-01-28'),
    updatedAt: new Date('2026-01-28'),
    __v: 0,
  },
  {
    submission_id: sub1Id,
    supervisor_id: supervisorId,
    feedbackText:
      'Internal note: Alice is progressing faster than expected. May be a good candidate for the department showcase.',
    isPrivate: true,
    createdAt: new Date('2026-01-26'),
    updatedAt: new Date('2026-01-26'),
    __v: 0,
  },
];

// ─── ACTIVITY LOGS ───────────────────────────────────────
const activityLogs = [
  {
    user_id: supervisorId,
    action: 'topic_created',
    entityType: 'Topic',
    entityId: topic1Id,
    details: { title: 'Deep Learning for Natural Language Understanding' },
    timestamp: new Date('2025-10-01'),
    ipAddress: '192.168.1.100',
    __v: 0,
  },
  {
    user_id: supervisorId,
    action: 'topic_created',
    entityType: 'Topic',
    entityId: topic2Id,
    details: { title: 'Intelligent Tutoring System with Adaptive Learning' },
    timestamp: new Date('2025-10-15'),
    ipAddress: '192.168.1.100',
    __v: 0,
  },
  {
    user_id: supervisorId,
    action: 'topic_created',
    entityType: 'Topic',
    entityId: topic3Id,
    details: { title: 'Privacy-Preserving Federated Learning Framework' },
    timestamp: new Date('2025-11-01'),
    ipAddress: '192.168.1.100',
    __v: 0,
  },
  {
    user_id: supervisorId,
    action: 'application_approved',
    entityType: 'Application',
    entityId: app1Id,
    details: { title: 'Deep Learning for Natural Language Understanding' },
    timestamp: new Date('2025-11-20'),
    ipAddress: '192.168.1.100',
    __v: 0,
  },
  {
    user_id: supervisorId,
    action: 'application_approved',
    entityType: 'Application',
    entityId: app2Id,
    details: { title: 'Intelligent Tutoring System with Adaptive Learning' },
    timestamp: new Date('2025-11-22'),
    ipAddress: '192.168.1.100',
    __v: 0,
  },
  {
    user_id: supervisorId,
    action: 'application_approved',
    entityType: 'Application',
    entityId: app3Id,
    details: { title: 'Privacy-Preserving Federated Learning Framework' },
    timestamp: new Date('2025-11-25'),
    ipAddress: '192.168.1.100',
    __v: 0,
  },
  {
    user_id: student1Id,
    action: 'submission_uploaded',
    entityType: 'Submission',
    entityId: sub1Id,
    details: { phase: 'Proposal', fileName: 'NLP_Research_Proposal.pdf' },
    timestamp: new Date('2026-01-15'),
    ipAddress: '192.168.1.50',
    __v: 0,
  },
  {
    user_id: supervisorId,
    action: 'feedback_given',
    entityType: 'Submission',
    entityId: sub1Id,
    details: { phase: 'Proposal', submissionId: sub1Id },
    timestamp: new Date('2026-01-25'),
    ipAddress: '192.168.1.100',
    __v: 0,
  },
  {
    user_id: student1Id,
    action: 'submission_uploaded',
    entityType: 'Submission',
    entityId: sub2Id,
    details: { phase: 'Interim Report', fileName: 'NLP_Interim_Report.pdf' },
    timestamp: new Date('2026-02-20'),
    ipAddress: '192.168.1.50',
    __v: 0,
  },
  {
    user_id: student2Id,
    action: 'submission_uploaded',
    entityType: 'Submission',
    entityId: sub3Id,
    details: { phase: 'Proposal', fileName: 'Tutoring_System_Proposal.pdf' },
    timestamp: new Date('2026-01-18'),
    ipAddress: '192.168.1.51',
    __v: 0,
  },
  {
    user_id: student3Id,
    action: 'submission_uploaded',
    entityType: 'Submission',
    entityId: sub5Id,
    details: { phase: 'Proposal', fileName: 'Federated_Learning_Proposal.pdf' },
    timestamp: new Date('2026-02-10'),
    ipAddress: '192.168.1.52',
    __v: 0,
  },
];

// ─── MAIN ────────────────────────────────────────────────
async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected!\n');

    const db = mongoose.connection.db;

    // Insert users
    console.log('Inserting users...');
    const usersResult = await db.collection('users').insertMany(users);
    console.log(`  ✓ Inserted ${usersResult.insertedCount} users`);

    // Insert topics
    console.log('Inserting topics...');
    const topicsResult = await db.collection('topics').insertMany(topics);
    console.log(`  ✓ Inserted ${topicsResult.insertedCount} topics`);

    // Insert applications
    console.log('Inserting applications...');
    const appsResult = await db.collection('applications').insertMany(applications);
    console.log(`  ✓ Inserted ${appsResult.insertedCount} applications`);

    // Insert assignments
    console.log('Inserting assignments...');
    const assignResult = await db.collection('assignments').insertMany(assignments);
    console.log(`  ✓ Inserted ${assignResult.insertedCount} assignments`);

    // Insert submissions
    console.log('Inserting submissions...');
    const subResult = await db.collection('submissions').insertMany(submissions);
    console.log(`  ✓ Inserted ${subResult.insertedCount} submissions`);

    // Insert feedbacks
    console.log('Inserting feedbacks...');
    const fbResult = await db.collection('feedbacks').insertMany(feedbacks);
    console.log(`  ✓ Inserted ${fbResult.insertedCount} feedbacks`);

    // Insert activity logs
    console.log('Inserting activity logs...');
    const logResult = await db.collection('activitylogs').insertMany(activityLogs);
    console.log(`  ✓ Inserted ${logResult.insertedCount} activity logs`);

    console.log('\n========================================');
    console.log('  SEED DATA COMPLETE!');
    console.log('========================================');
    console.log('\nLogin credentials (all use password: password123):');
    console.log('─────────────────────────────────────────');
    console.log('  Supervisor: supervisor@test.com');
    console.log('  Student 1:  alice.wong@student.test.com');
    console.log('  Student 2:  bob.liu@student.test.com');
    console.log('  Student 3:  carol.lee@student.test.com');
    console.log('  Student 4:  david.chan@student.test.com');
    console.log('─────────────────────────────────────────');
    console.log('\nSupervisor has:');
    console.log('  • 3 topics (Active)');
    console.log('  • 3 assigned students (Alice, Bob, Carol)');
    console.log('  • 2 pending applications from David');
    console.log('  • 5 submissions across students');
    console.log('  • 3 feedbacks given');
    console.log('  • 11 activity log entries');

  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
  }
}

seed();
