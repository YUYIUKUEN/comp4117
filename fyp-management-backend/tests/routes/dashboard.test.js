const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Topic = require('../../src/models/Topic');
const Application = require('../../src/models/Application');
const Assignment = require('../../src/models/Assignment');
const Submission = require('../../src/models/Submission');
const { generateTokens } = require('../../src/utils/jwt');
const bcrypt = require('bcryptjs');

const createPasswordHash = async () => {
  return await bcrypt.hash('test-password-123', 10);
};

describe('Dashboard Routes', () => {
  let admin, student, supervisor, adminToken, studentToken, supervisorToken, passwordHash;

  beforeEach(async () => {
    await User.deleteMany({});
    await Topic.deleteMany({});
    await Application.deleteMany({});
    await Assignment.deleteMany({});
    await Submission.deleteMany({});

    passwordHash = await createPasswordHash();

    admin = await User.create({
      email: 'admin@university.edu',
      passwordHash,
      fullName: 'Administrator',
      role: 'Admin',
    });

    student = await User.create({
      email: 'student@university.edu',
      passwordHash,
      fullName: 'Student User',
      role: 'Student',
    });

    supervisor = await User.create({
      email: 'supervisor@university.edu',
      passwordHash,
      fullName: 'Supervisor User',
      role: 'Supervisor',
    });

    adminToken = generateTokens(admin._id, 'Admin').token;
    studentToken = generateTokens(student._id, 'Student').token;
    supervisorToken = generateTokens(supervisor._id, 'Supervisor').token;
  });

  describe('GET /api/v1/dashboards/system-stats', () => {
    test('should require authentication', async () => {
      const res = await request(app).get('/api/v1/dashboards/system-stats');
      expect(res.status).toBe(401);
    });

    test('should require admin role', async () => {
      const res = await request(app)
        .get('/api/v1/dashboards/system-stats')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    test('should return system stats as admin', async () => {
      const res = await request(app)
        .get('/api/v1/dashboards/system-stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('users');
      expect(res.body.data).toHaveProperty('topics');
      expect(res.body.data).toHaveProperty('applications');
      expect(res.body.data).toHaveProperty('assignments');
      expect(res.body.data).toHaveProperty('submissions');
      expect(res.body.data.timestamp).toBeDefined();
    });

    test('should include user counts', async () => {
      const res = await request(app)
        .get('/api/v1/dashboards/system-stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users.total).toBe(3);
      expect(res.body.data.users.students).toBe(1);
      expect(res.body.data.users.supervisors).toBe(1);
      expect(res.body.data.users.admins).toBe(1);
    });

    test('should track active and deactivated users', async () => {
      await User.updateOne({ _id: student._id }, { deactivatedAt: new Date() });

      const res = await request(app)
        .get('/api/v1/dashboards/system-stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users.active).toBe(2);
      expect(res.body.data.users.deactivated).toBe(1);
    });
  });

  describe('GET /api/v1/dashboards/concentration-stats', () => {
    test('should require admin role', async () => {
      const res = await request(app)
        .get('/api/v1/dashboards/concentration-stats')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    test('should return concentration statistics', async () => {
      await Topic.create({
        title: 'AI Research',
        description: 'Comprehensive study of artificial intelligence and machine learning techniques with advanced applications',
        supervisor_id: supervisor._id,
        concentration: 'AI/ML',
        status: 'Active',
      });

      await Topic.create({
        title: 'Database Study',
        description: 'Research into database systems, query optimization, and distributed database architectures for modern applications',
        supervisor_id: supervisor._id,
        concentration: 'Other',
        status: 'Active',
      });

      const res = await request(app)
        .get('/api/v1/dashboards/concentration-stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.concentrations).toBeDefined();
      expect(res.body.data.concentrations.length).toBeGreaterThan(0);
    });

    test('should only count active topics', async () => {
      await Topic.create({
        title: 'Active Topic',
        description: 'An active research topic focused on exploring innovative solutions in academic research and development',
        supervisor_id: supervisor._id,
        concentration: 'AI/ML',
        status: 'Active',
      });

      await Topic.create({
        title: 'Draft Topic',
        description: 'A draft research topic currently in preparation stage for future academic exploration and development',
        supervisor_id: supervisor._id,
        concentration: 'AI/ML',
        status: 'Draft',
      });

      const res = await request(app)
        .get('/api/v1/dashboards/concentration-stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      // Verify count is for active topics only
      const aiMlConc = res.body.data.concentrations.find(c => c._id === 'AI/ML');
      expect(aiMlConc?.topicCount).toBe(1);
    });
  });

  describe('GET /api/v1/dashboards/application-stats', () => {
    test('should require admin role', async () => {
      const res = await request(app)
        .get('/api/v1/dashboards/application-stats')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    test('should return application statistics', async () => {
      await Application.create({
        student_id: student._id,
        topic_id: (await Topic.create({
          title: 'Study',
          description: 'A comprehensive research study covering advanced topics in computer science and information technology',
          supervisor_id: supervisor._id,
          concentration: 'AI/ML',
        }))._id,
        status: 'Pending',
      });

      const res = await request(app)
        .get('/api/v1/dashboards/application-stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/dashboards/submission-deadline-stats', () => {
    test('should require admin role', async () => {
      const res = await request(app)
        .get('/api/v1/dashboards/submission-deadline-stats')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    test('should return submission deadline statistics', async () => {
      const res = await request(app)
        .get('/api/v1/dashboards/submission-deadline-stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('submitted');
      expect(res.body.data).toHaveProperty('pending');
      expect(res.body.data).toHaveProperty('overdue');
      expect(res.body.data).toHaveProperty('dueSoon');
    });

    test('should track overdue submissions', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago

      const topic = await Topic.create({
        title: 'Test Topic',
        description: 'Testing research topic with comprehensive description and proper validation compliance',
        supervisor_id: supervisor._id,
        concentration: 'AI/ML',
      });

      const assignment = await Assignment.create({
        topic_id: topic._id,
        supervisor_id: supervisor._id,
        student_id: student._id,
        assignment_title: 'Test Assignment',
        dueDate: pastDate,
      });

      await Submission.create({
        assignment_id: assignment._id,
        topic_id: topic._id,
        student_id: student._id,
        status: 'Not Submitted',
        dueDate: pastDate,
        submittedDate: null,
      });

      const res = await request(app)
        .get('/api/v1/dashboards/submission-deadline-stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.overdue).toBeGreaterThan(0);
    });
  });
});
