const request = require('supertest');
const app = require('../../src/app');
const ActivityLog = require('../../src/models/ActivityLog');
const User = require('../../src/models/User');
const { generateTokens } = require('../../src/utils/jwt');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const createPasswordHash = async () => {
  return await bcrypt.hash('test-password-123', 10);
};

describe('Activity Routes', () => {
  let admin, student, supervisor, adminToken, studentToken, supervisorToken, passwordHash;

  beforeEach(async () => {
    await ActivityLog.deleteMany({});
    await User.deleteMany({});

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

    // Create activity logs for testing
    await ActivityLog.insertMany([
      {
        user_id: student._id,
        action: 'login',
        entityType: 'User',
        entityId: student._id,
        ipAddress: '192.168.1.1',
      },
      {
        user_id: student._id,
        action: 'topic_viewed',
        entityType: 'Topic',
        entityId: new mongoose.Types.ObjectId(),
        ipAddress: '192.168.1.1',
      },
      {
        user_id: supervisor._id,
        action: 'feedback_added',
        entityType: 'Feedback',
        entityId: new mongoose.Types.ObjectId(),
        ipAddress: '10.0.0.1',
      },
    ]);
  });

  describe('GET /api/v1/activity', () => {
    test('should require authentication', async () => {
      const res = await request(app).get('/api/v1/activity');

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    test('should require admin role', async () => {
      const res = await request(app)
        .get('/api/v1/activity')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    test('should return all logs for admin', async () => {
      const res = await request(app)
        .get('/api/v1/activity')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.logs).toBeDefined();
      expect(res.body.data.logs.length).toBeGreaterThan(0);
      expect(res.body.data.pagination).toBeDefined();
    });

    test('should support pagination', async () => {
      const res = await request(app)
        .get('/api/v1/activity?limit=1&page=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.limit).toBe(1);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.logs.length).toBeLessThanOrEqual(1);
    });

    test('should filter by action', async () => {
      const res = await request(app)
        .get('/api/v1/activity?action=login')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.logs.every(log => log.action === 'login')).toBe(true);
    });

    test('should filter by entityType', async () => {
      const res = await request(app)
        .get('/api/v1/activity?entityType=Topic')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.logs.every(log => log.entityType === 'Topic')).toBe(true);
    });

    test('should filter by userId', async () => {
      const res = await request(app)
        .get(`/api/v1/activity?userId=${student._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.logs.every(log => log.user_id._id.toString() === student._id.toString())).toBe(true);
    });

    test('should populate user information', async () => {
      const res = await request(app)
        .get('/api/v1/activity')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.logs[0].user_id).toBeDefined();
      expect(res.body.data.logs[0].user_id.fullName).toBeDefined();
      expect(res.body.data.logs[0].user_id.email).toBeDefined();
    });
  });

  describe('GET /api/v1/activity/stats', () => {
    test('should require admin role', async () => {
      const res = await request(app)
        .get('/api/v1/activity/stats')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    test('should return activity statistics for admin', async () => {
      const res = await request(app)
        .get('/api/v1/activity/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalLogs).toBeDefined();
      expect(res.body.data.actionStats).toBeDefined();
      expect(res.body.data.topUsers).toBeDefined();
    });

    test('should aggregate action statistics', async () => {
      const res = await request(app)
        .get('/api/v1/activity/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.actionStats)).toBe(true);
      expect(res.body.data.actionStats[0]._id).toBeDefined();
      expect(res.body.data.actionStats[0].count).toBeGreaterThan(0);
    });

    test('should show top users', async () => {
      const res = await request(app)
        .get('/api/v1/activity/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.topUsers)).toBe(true);
    });

    test('should accept days parameter', async () => {
      const res = await request(app)
        .get('/api/v1/activity/stats?days=30')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.period).toMatch(/30/);
    });
  });

  describe('GET /api/v1/activity/export', () => {
    test('should require admin role', async () => {
      const res = await request(app)
        .get('/api/v1/activity/export')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    test('should export as JSON by default', async () => {
      const res = await request(app)
        .get('/api/v1/activity/export')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.headers['content-disposition']).toMatch(/attachment/);
      expect(res.body.count).toBeDefined();
      expect(Array.isArray(res.body.logs)).toBe(true);
    });

    test('should export as CSV format', async () => {
      const res = await request(app)
        .get('/api/v1/activity/export?format=csv')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/csv/);
      expect(res.headers['content-disposition']).toMatch(/attachment/);
      expect(typeof res.text).toBe('string');
      expect(res.text).toMatch(/timestamp/);
    });

    test('CSV export should include headers', async () => {
      const res = await request(app)
        .get('/api/v1/activity/export?format=csv')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const lines = res.text.split('\n');
      expect(lines[0]).toMatch(/timestamp/);
      expect(lines[0]).toMatch(/action/);
    });
  });

  describe('GET /api/v1/activity/user/:userId', () => {
    test('should require authentication', async () => {
      const res = await request(app).get(`/api/v1/activity/user/${student._id}`);

      expect(res.status).toBe(401);
    });

    test('should allow user to view own logs', async () => {
      const res = await request(app)
        .get(`/api/v1/activity/user/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.logs).toBeDefined();
    });

    test('should prevent user from viewing other users logs', async () => {
      const res = await request(app)
        .get(`/api/v1/activity/user/${supervisor._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    test('should allow admin to view any user logs', async () => {
      const res = await request(app)
        .get(`/api/v1/activity/user/${student._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.logs).toBeDefined();
    });

    test('should return only logs for requested user', async () => {
      const res = await request(app)
        .get(`/api/v1/activity/user/${student._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.logs.every(log => log.user_id._id.toString() === student._id.toString())).toBe(true);
    });

    test('should support pagination', async () => {
      const res = await request(app)
        .get(`/api/v1/activity/user/${student._id}?limit=1&page=1`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.limit).toBe(1);
    });
  });

  describe('GET /api/v1/activity/:entityType/:entityId', () => {
    test('should require authentication', async () => {
      const res = await request(app).get('/api/v1/activity/Topic/topic123');

      expect(res.status).toBe(401);
    });

    test('should return logs for entity', async () => {
      const res = await request(app)
        .get('/api/v1/activity/Topic/topic123')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.logs).toBeDefined();
      expect(res.body.data.pagination).toBeDefined();
    });

    test('should filter by entityType and entityId', async () => {
      const res = await request(app)
        .get('/api/v1/activity/Topic/topic123')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.logs.every(log => log.entityType === 'Topic' && log.entityId === 'topic123')).toBe(true);
    });

    test('should return empty array for non-existent entity', async () => {
      const res = await request(app)
        .get('/api/v1/activity/Topic/nonexistent')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.logs).toEqual([]);
    });

    test('should support pagination', async () => {
      const res = await request(app)
        .get('/api/v1/activity/Topic/topic123?limit=1&page=1')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.limit).toBe(1);
    });
  });
});
