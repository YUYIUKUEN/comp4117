const request = require('supertest');
const app = require('../../src/app');
const { logActivity, LOG_ACTIONS } = require('../../src/utils/activityLogger');
const ActivityLog = require('../../src/models/ActivityLog');
const User = require('../../src/models/User');
const Topic = require('../../src/models/Topic');
const { generateTokens } = require('../../src/utils/jwt');
const bcrypt = require('bcryptjs');

const createPasswordHash = async () => {
  return await bcrypt.hash('test-password-123', 10);
};

describe('Activity Logging Integration Tests', () => {
  let admin, student, supervisor, topic, passwordHash;
  let adminToken, studentToken, supervisorToken;

  beforeEach(async () => {
    await ActivityLog.deleteMany({});
    await User.deleteMany({});
    await Topic.deleteMany({});

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

    topic = await Topic.create({
      title: 'AI Research',
      description: 'Study of artificial intelligence',
      supervisor_id: supervisor._id,
      concentration: 'AI/ML',
    });

    adminToken = generateTokens(admin._id, 'Admin').token;
    studentToken = generateTokens(student._id, 'Student').token;
    supervisorToken = generateTokens(supervisor._id, 'Supervisor').token;
  });

  describe('User Activity Tracking', () => {
    test('should log user login activities', async () => {
      const beforeCount = await ActivityLog.countDocuments();

      await logActivity(student._id, LOG_ACTIONS.LOGIN, 'User', student._id, {
        ipAddress: '192.168.1.1',
      });

      const afterCount = await ActivityLog.countDocuments();
      expect(afterCount).toBe(beforeCount + 1);

      const log = await ActivityLog.findOne({ action: LOG_ACTIONS.LOGIN });
      expect(log).toBeDefined();
      expect(log.user_id.toString()).toBe(student._id.toString());
      expect(log.ipAddress).toBe('192.168.1.1');
    });

    test('should track multiple user actions chronologically', async () => {
      await logActivity(student._id, LOG_ACTIONS.LOGIN, 'User', student._id);
      await logActivity(student._id, 'topic_viewed', 'Topic', topic._id);
      await logActivity(student._id, LOG_ACTIONS.LOGOUT, 'User', student._id);

      const logs = await ActivityLog.find({ user_id: student._id }).sort({ timestamp: 1 });
      expect(logs).toHaveLength(3);
      expect(logs[0].action).toBe(LOG_ACTIONS.LOGIN);
      expect(logs[1].action).toBe('topic_viewed');
      expect(logs[2].action).toBe(LOG_ACTIONS.LOGOUT);
    });

    test('should preserve timestamps in correct order', async () => {
      const action1 = await logActivity(student._id, LOG_ACTIONS.LOGIN, 'User', student._id);
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      const action2 = await logActivity(student._id, LOG_ACTIONS.LOGOUT, 'User', student._id);

      expect(action1.timestamp.getTime()).toBeLessThan(action2.timestamp.getTime());
    });
  });

  describe('Entity Activity Tracking', () => {
    test('should track all actions on a topic', async () => {
      await logActivity(supervisor._id, LOG_ACTIONS.TOPIC_CREATED, 'Topic', topic._id);
      await logActivity(supervisor._id, LOG_ACTIONS.TOPIC_UPDATED, 'Topic', topic._id);
      await logActivity(supervisor._id, LOG_ACTIONS.TOPIC_PUBLISHED, 'Topic', topic._id);

      const logs = await ActivityLog.find({ entityType: 'Topic', entityId: topic._id });
      expect(logs).toHaveLength(3);
      expect(logs.map(l => l.action)).toContain(LOG_ACTIONS.TOPIC_CREATED);
      expect(logs.map(l => l.action)).toContain(LOG_ACTIONS.TOPIC_UPDATED);
      expect(logs.map(l => l.action)).toContain(LOG_ACTIONS.TOPIC_PUBLISHED);
    });

    test('should retrieve entity audit trail via API', async () => {
      await logActivity(supervisor._id, LOG_ACTIONS.TOPIC_CREATED, 'Topic', topic._id.toString());
      await logActivity(supervisor._id, LOG_ACTIONS.TOPIC_UPDATED, 'Topic', topic._id.toString());

      const res = await request(app)
        .get(`/api/v1/activity/Topic/${topic._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.logs).toHaveLength(2);
      expect(res.body.data.logs[0].entityType).toBe('Topic');
    });
  });

  describe('Admin Activity Reporting', () => {
    test('should compile system-wide activity statistics', async () => {
      // Simulate various activities
      await logActivity(student._id, LOG_ACTIONS.LOGIN, 'User', student._id);
      await logActivity(student._id, LOG_ACTIONS.LOGIN, 'User', student._id);
      await logActivity(supervisor._id, LOG_ACTIONS.TOPIC_CREATED, 'Topic', topic._id);

      const res = await request(app)
        .get('/api/v1/activity/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalLogs).toBeGreaterThanOrEqual(3);
      expect(res.body.data.actionStats).toBeDefined();
      expect(Array.isArray(res.body.data.actionStats)).toBe(true);
    });

    test('should identify top users by activity', async () => {
      // User 1 performs 5 actions
      for (let i = 0; i < 5; i++) {
        await logActivity(student._id, LOG_ACTIONS.LOGIN, 'User', student._id);
      }

      // User 2 performs 2 actions
      for (let i = 0; i < 2; i++) {
        await logActivity(supervisor._id, LOG_ACTIONS.TOPIC_CREATED, 'Topic', topic._id);
      }

      const res = await request(app)
        .get('/api/v1/activity/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.topUsers).toBeDefined();
      expect(Array.isArray(res.body.data.topUsers)).toBe(true);
    });

    test('should filter activity stats by time period', async () => {
      const now = new Date();
      const oldDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

      // Create log with old timestamp
      await ActivityLog.create({
        user_id: student._id,
        action: LOG_ACTIONS.LOGIN,
        entityType: 'User',
        entityId: student._id,
        timestamp: oldDate,
      });

      // Create recent log
      await logActivity(student._id, LOG_ACTIONS.LOGIN, 'User', student._id);

      const res = await request(app)
        .get('/api/v1/activity/stats?days=7')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.period).toMatch(/7/);
      // Recent activity should be counted
      expect(res.body.data.totalLogs).toBeGreaterThan(0);
    });
  });

  describe('Activity Log Export', () => {
    test('should export activity logs as JSON', async () => {
      await logActivity(student._id, LOG_ACTIONS.LOGIN, 'User', student._id);
      await logActivity(supervisor._id, LOG_ACTIONS.TOPIC_CREATED, 'Topic', topic._id);

      const res = await request(app)
        .get('/api/v1/activity/export?format=json')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBeGreaterThanOrEqual(2);
      expect(Array.isArray(res.body.logs)).toBe(true);
    });

    test('should export activity logs as CSV', async () => {
      await logActivity(student._id, LOG_ACTIONS.LOGIN, 'User', student._id);

      const res = await request(app)
        .get('/api/v1/activity/export?format=csv')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/csv/);
      expect(res.text).toMatch(/timestamp/);
      expect(res.text).toMatch(/action/);
    });

    test('should filter export by date range', async () => {
      const now = new Date();
      const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
      const endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day from now

      await logActivity(student._id, LOG_ACTIONS.LOGIN, 'User', student._id);

      const res = await request(app)
        .get(`/api/v1/activity/export?format=json&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBeGreaterThan(0);
    });
  });

  describe('Activity Log Immutability', () => {
    test('should not allow modification of logged timestamps', async () => {
      const log = await logActivity(student._id, LOG_ACTIONS.LOGIN, 'User', student._id);
      const originalTimestamp = log.timestamp;

      const newTimestamp = new Date(Date.now() - 1000 * 60 * 60); // 1 hour earlier
      await ActivityLog.findByIdAndUpdate(log._id, { timestamp: newTimestamp });

      const updated = await ActivityLog.findById(log._id);
      expect(updated.timestamp).toEqual(originalTimestamp);
    });

    test('should maintain audit trail integrity', async () => {
      const logs = [];
      for (let i = 0; i < 5; i++) {
        const log = await logActivity(student._id, LOG_ACTIONS.LOGIN, 'User', student._id);
        logs.push(log);
      }

      const retrieved = await ActivityLog.find({ user_id: student._id }).sort({ timestamp: 1 });
      expect(retrieved).toHaveLength(5);

      // Verify chronological order is preserved
      for (let i = 0; i < retrieved.length - 1; i++) {
        expect(retrieved[i].timestamp.getTime()).toBeLessThanOrEqual(retrieved[i + 1].timestamp.getTime());
      }
    });
  });

  describe('Role-Based Access Control', () => {
    test('should prevent students from viewing all activity logs', async () => {
      await logActivity(student._id, LOG_ACTIONS.LOGIN, 'User', student._id);

      const res = await request(app)
        .get('/api/v1/activity')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBeDefined();
    });

    test('should allow students to view their own activity', async () => {
      await logActivity(student._id, LOG_ACTIONS.LOGIN, 'User', student._id);

      const res = await request(app)
        .get(`/api/v1/activity/user/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.logs).toBeDefined();
    });

    test('should allow admin to view all activity', async () => {
      await logActivity(student._id, LOG_ACTIONS.LOGIN, 'User', student._id);
      await logActivity(supervisor._id, LOG_ACTIONS.TOPIC_CREATED, 'Topic', topic._id);

      const res = await request(app)
        .get('/api/v1/activity')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.logs.length).toBeGreaterThanOrEqual(2);
    });

    test('should prevent non-admin from exporting logs', async () => {
      const res = await request(app)
        .get('/api/v1/activity/export')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Activity Log Details', () => {
    test('should capture detailed information about actions', async () => {
      const details = {
        method: 'email',
        ip_region: 'USA',
        device: 'mobile',
      };

      await logActivity(student._id, LOG_ACTIONS.LOGIN, 'User', student._id, {
        details,
        ipAddress: '203.0.113.45',
      });

      const log = await ActivityLog.findOne({ action: LOG_ACTIONS.LOGIN });
      expect(log.details).toEqual(details);
      expect(log.ipAddress).toBe('203.0.113.45');
    });

    test('should track entity-specific details', async () => {
      const topicDetails = {
        title: 'AI Research',
        concentration: 'AI/ML',
        supervisorName: 'Dr. Smith',
      };

      await logActivity(supervisor._id, LOG_ACTIONS.TOPIC_CREATED, 'Topic', topic._id, {
        details: topicDetails,
      });

      const log = await ActivityLog.findOne({ entityType: 'Topic' });
      expect(log.details.title).toBe('AI Research');
      expect(log.details.supervisorName).toBe('Dr. Smith');
    });
  });
});
