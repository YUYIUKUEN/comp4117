const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Topic = require('../../src/models/Topic');
const Application = require('../../src/models/Application');
const ActivityLog = require('../../src/models/ActivityLog');
const { generateTokens } = require('../../src/utils/jwt');
const bcrypt = require('bcryptjs');

const createPasswordHash = async () => {
  return await bcrypt.hash('test-password-123', 10);
};

describe('Admin Dashboard Integration Tests', () => {
  let admin, student, supervisor, adminToken, studentToken, passwordHash;

  beforeEach(async () => {
    await User.deleteMany({});
    await Topic.deleteMany({});
    await Application.deleteMany({});
    await ActivityLog.deleteMany({});

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
  });

  describe('Admin Dashboard Workflow', () => {
    test('admin can view system statistics', async () => {
      const res = await request(app)
        .get('/api/v1/dashboards/system-stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users.total).toBe(3);
    });

    test('admin can view all users', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users.length).toBe(3);
    });

    test('admin can deactivate and reactivate user', async () => {
      let res = await request(app)
        .post(`/api/v1/admin/users/${student._id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test deactivation' });

      expect(res.status).toBe(200);
      expect(res.body.data.deactivatedAt).toBeDefined();

      // Verify system stats update
      res = await request(app)
        .get('/api/v1/dashboards/system-stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.body.data.users.deactivated).toBe(1);
      expect(res.body.data.users.active).toBe(2);

      // Reactivate
      res = await request(app)
        .post(`/api/v1/admin/users/${student._id}/reactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deactivatedAt).toBeNull();
    });

    test('admin can flag and clear topic flags', async () => {
      const topic = await Topic.create({
        title: 'AI Research',
        description: 'Comprehensive study of artificial intelligence and machine learning techniques for advanced applications',
        supervisor_id: supervisor._id,
        concentration: 'AI/ML',
        status: 'Active',
      });

      // Flag topic
      let res = await request(app)
        .post(`/api/v1/admin/topics/${topic._id}/flag`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Inappropriate content' });

      expect(res.status).toBe(200);
      expect(res.body.data.flags.length).toBe(1);

      // View flagged topics
      res = await request(app)
        .get('/api/v1/admin/topics/flagged')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.topics.length).toBeGreaterThan(0);

      // Clear flags
      res = await request(app)
        .post(`/api/v1/admin/topics/${topic._id}/clear-flags`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Issue resolved' });

      expect(res.status).toBe(200);
      expect(res.body.data.flags.length).toBe(0);
    });

    test('all admin actions are logged', async () => {
      // Deactivate user
      await request(app)
        .post(`/api/v1/admin/users/${student._id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test' });

      // Check activity log
      const logs = await ActivityLog.find({ action: 'user_deactivated' });
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].user_id.toString()).toBe(admin._id.toString());
    });

    test('admin can view system health', async () => {
      const res = await request(app)
        .get('/api/v1/health')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.database.connected).toBe(true);
      expect(res.body.data.memory).toBeDefined();
      expect(res.body.data.uptime).toBeGreaterThan(0);
    });

    test('public health check does not require auth', async () => {
      const res = await request(app).get('/api/v1/health/check');

      expect(res.status).toBe(200);
      expect(res.body.status).toBeDefined();
    });
  });

  describe('Role-Based Access Control', () => {
    test('students cannot access admin endpoints', async () => {
      let res = await request(app)
        .get('/api/v1/dashboards/system-stats')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);

      res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);

      res = await request(app)
        .get('/api/v1/health')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    test('non-admin users cannot modify system', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/users/${student._id}/deactivate`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ reason: 'Test' });

      expect(res.status).toBe(403);
    });
  });

  describe('Data Sanitization', () => {
    test('user list does not expose passwords', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      res.body.data.users.forEach(user => {
        expect(user.passwordHash).toBeUndefined();
      });
    });

    test('individual user endpoint does not expose password', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/users/${student._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.passwordHash).toBeUndefined();
    });
  });

  describe('Pagination and Filtering', () => {
    test('user list supports pagination', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users?limit=2&page=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.limit).toBe(2);
      expect(res.body.data.pagination.total).toBe(3);
    });

    test('user list supports role filtering', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users?role=Student')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users.every(u => u.role === 'Student')).toBe(true);
    });

    test('flagged topics support pagination', async () => {
      const topic = await Topic.create({
        title: 'Test Topic',
        description: 'Testing research topic with comprehensive description and proper validation compliance',
        supervisor_id: supervisor._id,
        concentration: 'AI/ML',
        status: 'Active',
      });

      await request(app)
        .post(`/api/v1/admin/topics/${topic._id}/flag`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test' });

      const res = await request(app)
        .get('/api/v1/admin/topics/flagged?limit=10&page=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('deactivating non-existent user returns 404', async () => {
      const fakeId = new (require('mongoose')).Types.ObjectId();
      const res = await request(app)
        .post(`/api/v1/admin/users/${fakeId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test' });

      expect(res.status).toBe(404);
    });

    test('flagging non-existent topic returns 404', async () => {
      const fakeId = new (require('mongoose')).Types.ObjectId();
      const res = await request(app)
        .post(`/api/v1/admin/topics/${fakeId}/flag`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test' });

      expect(res.status).toBe(404);
    });

    test('self-deactivation returns 400', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/users/${admin._id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Cannot deactivate yourself/i);
    });
  });
});
