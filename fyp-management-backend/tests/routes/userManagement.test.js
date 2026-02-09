const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const ActivityLog = require('../../src/models/ActivityLog');
const { generateTokens } = require('../../src/utils/jwt');
const bcrypt = require('bcryptjs');

const createPasswordHash = async () => {
  return await bcrypt.hash('test-password-123', 10);
};

describe('User Management Routes', () => {
  let admin, student, supervisor, adminToken, studentToken, passwordHash;

  beforeEach(async () => {
    await User.deleteMany({});
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

  describe('GET /api/v1/admin/users', () => {
    test('should require authentication', async () => {
      const res = await request(app).get('/api/v1/admin/users');
      expect(res.status).toBe(401);
    });

    test('should require admin role', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    test('should return all users for admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users).toHaveLength(3);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.total).toBe(3);
    });

    test('should not include passwordHash in response', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      res.body.data.users.forEach(user => {
        expect(user.passwordHash).toBeUndefined();
      });
    });

    test('should filter by role', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users?role=Student')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users).toHaveLength(1);
      expect(res.body.data.users[0].role).toBe('Student');
    });

    test('should filter by active status', async () => {
      await User.updateOne({ _id: student._id }, { deactivatedAt: new Date() });

      const res = await request(app)
        .get('/api/v1/admin/users?status=active')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users.find(u => u._id.toString() === student._id.toString())).toBeUndefined();
    });

    test('should support pagination', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users?limit=2&page=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.limit).toBe(2);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.pages).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/admin/users/:userId', () => {
    test('should require admin role', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/users/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    test('should return user details', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/users/${student._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data._id.toString()).toBe(student._id.toString());
      expect(res.body.data.email).toBe('student@university.edu');
    });

    test('should return 404 for non-existent user', async () => {
      const fakeId = new (require('mongoose')).Types.ObjectId();
      const res = await request(app)
        .get(`/api/v1/admin/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    test('should not include passwordHash', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/users/${student._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.passwordHash).toBeUndefined();
    });
  });

  describe('POST /api/v1/admin/users/:userId/deactivate', () => {
    test('should require admin role', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/users/${student._id}/deactivate`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ reason: 'Test' });
      expect(res.status).toBe(403);
    });

    test('should deactivate user', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/users/${student._id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Violates honor code' });

      expect(res.status).toBe(200);
      expect(res.body.data.deactivatedAt).toBeDefined();

      const updated = await User.findById(student._id);
      expect(updated.deactivatedAt).toBeDefined();
    });

    test('should not allow self-deactivation', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/users/${admin._id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Cannot deactivate yourself/i);
    });

    test('should return 404 for non-existent user', async () => {
      const fakeId = new (require('mongoose')).Types.ObjectId();
      const res = await request(app)
        .post(`/api/v1/admin/users/${fakeId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test' });

      expect(res.status).toBe(404);
    });

    test('should refuse to deactivate already deactivated user', async () => {
      await User.updateOne({ _id: student._id }, { deactivatedAt: new Date() });

      const res = await request(app)
        .post(`/api/v1/admin/users/${student._id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test' });

      expect(res.status).toBe(400);
    });

    test('should log deactivation activity', async () => {
      await request(app)
        .post(`/api/v1/admin/users/${student._id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Violates honor code' });

      const logs = await ActivityLog.find({ action: 'user_deactivated' });
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].details.reason).toBe('Violates honor code');
    });
  });

  describe('POST /api/v1/admin/users/:userId/reactivate', () => {
    beforeEach(async () => {
      await User.updateOne({ _id: student._id }, { deactivatedAt: new Date() });
    });

    test('should require admin role', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/users/${student._id}/reactivate`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    test('should reactivate user', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/users/${student._id}/reactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deactivatedAt).toBeNull();
    });

    test('should return 404 for non-existent user', async () => {
      const fakeId = new (require('mongoose')).Types.ObjectId();
      const res = await request(app)
        .post(`/api/v1/admin/users/${fakeId}/reactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    test('should refuse to reactivate already active user', async () => {
      await User.updateOne({ _id: supervisor._id }, { deactivatedAt: null });

      const res = await request(app)
        .post(`/api/v1/admin/users/${supervisor._id}/reactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });

    test('should log reactivation activity', async () => {
      await request(app)
        .post(`/api/v1/admin/users/${student._id}/reactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      const logs = await ActivityLog.find({ action: 'user_reactivated' });
      expect(logs.length).toBeGreaterThan(0);
    });
  });
});
