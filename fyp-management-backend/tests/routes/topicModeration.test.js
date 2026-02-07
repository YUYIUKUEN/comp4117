const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Topic = require('../../src/models/Topic');
const ActivityLog = require('../../src/models/ActivityLog');
const { generateTokens } = require('../../src/utils/jwt');
const bcrypt = require('bcryptjs');

const createPasswordHash = async () => {
  return await bcrypt.hash('test-password-123', 10);
};

describe('Topic Moderation Routes', () => {
  let admin, student, supervisor, adminToken, studentToken, topic, passwordHash;

  beforeEach(async () => {
    await User.deleteMany({});
    await Topic.deleteMany({});
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

    topic = await Topic.create({
      title: 'AI Research',
      description: 'This is a comprehensive study of artificial intelligence and machine learning techniques that explores advanced topics',
      supervisor_id: supervisor._id,
      concentration: 'AI/ML',
      status: 'Active',
    });

    adminToken = generateTokens(admin._id, 'Admin').token;
    studentToken = generateTokens(student._id, 'Student').token;
  });

  describe('POST /api/v1/admin/topics/:topicId/flag', () => {
    test('should require admin role', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/topics/${topic._id}/flag`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ reason: 'Inappropriate content' });
      expect(res.status).toBe(403);
    });

    test('should flag topic with reason', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/topics/${topic._id}/flag`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Inappropriate content' });

      expect(res.status).toBe(200);
      expect(res.body.data.flags).toBeDefined();
      expect(res.body.data.flags[0].reason).toBe('Inappropriate content');
    });

    test('should require reason', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/topics/${topic._id}/flag`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    test('should return 404 for non-existent topic', async () => {
      const fakeId = new (require('mongoose')).Types.ObjectId();
      const res = await request(app)
        .post(`/api/v1/admin/topics/${fakeId}/flag`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test' });

      expect(res.status).toBe(404);
    });

    test('should log flag activity', async () => {
      await request(app)
        .post(`/api/v1/admin/topics/${topic._id}/flag`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Inappropriate content' });

      const logs = await ActivityLog.find({ action: 'topic_flagged' });
      expect(logs.length).toBeGreaterThan(0);
    });

    test('should allow multiple flags on same topic', async () => {
      await request(app)
        .post(`/api/v1/admin/topics/${topic._id}/flag`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Reason 1' });

      const res = await request(app)
        .post(`/api/v1/admin/topics/${topic._id}/flag`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Reason 2' });

      expect(res.status).toBe(200);
      expect(res.body.data.flags).toHaveLength(2);
    });
  });

  describe('GET /api/v1/admin/topics/flagged', () => {
    test('should require admin role', async () => {
      const res = await request(app)
        .get('/api/v1/admin/topics/flagged')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    test('should return flagged topics', async () => {
      await request(app)
        .post(`/api/v1/admin/topics/${topic._id}/flag`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Inappropriate content' });

      const res = await request(app)
        .get('/api/v1/admin/topics/flagged')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.topics.length).toBeGreaterThan(0);
      expect(res.body.data.topics[0]._id.toString()).toBe(topic._id.toString());
    });

    test('should not return unflagged topics', async () => {
      const res = await request(app)
        .get('/api/v1/admin/topics/flagged')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.topics).toHaveLength(0);
    });

    test('should support pagination', async () => {
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

  describe('POST /api/v1/admin/topics/:topicId/clear-flags', () => {
    beforeEach(async () => {
      await request(app)
        .post(`/api/v1/admin/topics/${topic._id}/flag`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Inappropriate content' });
    });

    test('should require admin role', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/topics/${topic._id}/clear-flags`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ reason: 'Resolved' });
      expect(res.status).toBe(403);
    });

    test('should clear flags from topic', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/topics/${topic._id}/clear-flags`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Issue resolved' });

      expect(res.status).toBe(200);
      expect(res.body.data.flags).toHaveLength(0);
    });

    test('should log clear-flags activity', async () => {
      await request(app)
        .post(`/api/v1/admin/topics/${topic._id}/clear-flags`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Issue resolved' });

      const logs = await ActivityLog.find({ action: 'topic_flags_cleared' });
      expect(logs.length).toBeGreaterThan(0);
    });

    test('should return 404 for non-existent topic', async () => {
      const fakeId = new (require('mongoose')).Types.ObjectId();
      const res = await request(app)
        .post(`/api/v1/admin/topics/${fakeId}/clear-flags`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test' });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/admin/topics/:topicId/archive', () => {
    test('should require admin role', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/topics/${topic._id}/archive`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ reason: 'Outdated' });
      expect(res.status).toBe(403);
    });

    test('should archive topic', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/topics/${topic._id}/archive`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Outdated' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('Archived');
    });

    test('should return 404 for non-existent topic', async () => {
      const fakeId = new (require('mongoose')).Types.ObjectId();
      const res = await request(app)
        .post(`/api/v1/admin/topics/${fakeId}/archive`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test' });

      expect(res.status).toBe(404);
    });

    test('should refuse to archive already archived topic', async () => {
      await Topic.updateOne({ _id: topic._id }, { status: 'Archived' });

      const res = await request(app)
        .post(`/api/v1/admin/topics/${topic._id}/archive`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test' });

      expect(res.status).toBe(400);
    });

    test('should log archive activity', async () => {
      await request(app)
        .post(`/api/v1/admin/topics/${topic._id}/archive`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Outdated' });

      const logs = await ActivityLog.find({ action: 'topic_archived' });
      expect(logs.length).toBeGreaterThan(0);
    });
  });
});
