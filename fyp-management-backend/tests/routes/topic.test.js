const request = require('supertest');
const app = require('../../src/app');
const Topic = require('../../src/models/Topic');
const User = require('../../src/models/User');
const ActivityLog = require('../../src/models/ActivityLog');
const { generateTokens } = require('../../src/utils/jwt');
const { hashPassword } = require('../../src/utils/password');

describe('Topic Routes', () => {
  let supervisor, student, admin;
  let supervisorToken, studentToken, adminToken;

  beforeEach(async () => {
    await Topic.deleteMany({});
    await User.deleteMany({});
    await ActivityLog.deleteMany({});

    // Create users
    const supervisorHash = await hashPassword('SupervisorPass123');
    supervisor = await User.create({
      email: 'supervisor@university.edu',
      passwordHash: supervisorHash,
      fullName: 'Dr. Smith',
      role: 'Supervisor',
    });

    const studentHash = await hashPassword('StudentPass123');
    student = await User.create({
      email: 'student@university.edu',
      passwordHash: studentHash,
      fullName: 'John Student',
      role: 'Student',
    });

    const adminHash = await hashPassword('AdminPass123');
    admin = await User.create({
      email: 'admin@university.edu',
      passwordHash: adminHash,
      fullName: 'Admin User',
      role: 'Admin',
    });

    supervisorToken = generateTokens(supervisor._id, 'Supervisor').token;
    studentToken = generateTokens(student._id, 'Student').token;
    adminToken = generateTokens(admin._id, 'Admin').token;
  });

  describe('GET /api/v1/topics', () => {
    test('should list active topics (public endpoint)', async () => {
      await Topic.create({
        title: 'Machine Learning Basics',
        description: 'Introduction to ML concepts and algorithms for beginners in AI',
        supervisor_id: supervisor._id,
        concentration: 'AI/ML',
        status: 'Active',
      });

      const res = await request(app).get('/api/v1/topics');

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.total).toBe(1);
      expect(res.body.data.topics[0].title).toBe('Machine Learning Basics');
    });

    test('should filter topics by concentration', async () => {
      await Topic.create({
        title: 'Machine Learning Basics',
        description: 'Introduction to ML concepts and algorithms for beginners in AI',
        supervisor_id: supervisor._id,
        concentration: 'AI/ML',
        status: 'Active',
      });

      await Topic.create({
        title: 'System Design',
        description: 'Learn about distributed systems, load balancing and database design',
        supervisor_id: supervisor._id,
        concentration: 'Systems',
        status: 'Active',
      });

      const res = await request(app).get('/api/v1/topics?concentration=AI/ML');

      expect(res.status).toBe(200);
      expect(res.body.data.topics.length).toBe(1);
      expect(res.body.data.topics[0].concentration).toBe('AI/ML');
    });

    test('should support pagination', async () => {
      for (let i = 0; i < 25; i++) {
        await Topic.create({
          title: `Topic ${i}`,
          description: `This is a description for testing pagination in the topic listing page`,
          supervisor_id: supervisor._id,
          concentration: 'AI/ML',
          status: 'Active',
        });
      }

      const res = await request(app).get('/api/v1/topics?page=2&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.page).toBe(2);
      expect(res.body.data.pagination.limit).toBe(10);
      expect(res.body.data.pagination.total).toBe(25);
      expect(res.body.data.pagination.pages).toBe(3);
    });

    test('should not show draft or archived topics by default', async () => {
      await Topic.create({
        title: 'Active Topic',
        description: 'This topic is published and visible to all students in the system',
        supervisor_id: supervisor._id,
        concentration: 'AI/ML',
        status: 'Active',
      });

      await Topic.create({
        title: 'Draft Topic',
        description: 'This topic is still in draft and not visible to students yet now',
        supervisor_id: supervisor._id,
        concentration: 'AI/ML',
        status: 'Draft',
      });

      const res = await request(app).get('/api/v1/topics');

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.total).toBe(1);
      expect(res.body.data.topics[0].status).toBe('Active');
    });
  });

  describe('POST /api/v1/topics', () => {
    test('should create topic as supervisor', async () => {
      const res = await request(app)
        .post('/api/v1/topics')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          title: 'Distributed Systems',
          description: 'Study of distributed systems, consistency, and consensus algorithms',
          concentration: 'Systems',
          keywords: ['distributed', 'consensus'],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Distributed Systems');
      expect(res.body.data.status).toBe('Draft');
    });

    test('should require supervisor role', async () => {
      const res = await request(app)
        .post('/api/v1/topics')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Machine Learning',
          description: 'Introduction to machine learning concepts and algorithms for students',
          concentration: 'AI/ML',
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    test('should require authentication', async () => {
      const res = await request(app)
        .post('/api/v1/topics')
        .send({
          title: 'Machine Learning',
          description: 'Introduction to machine learning concepts and algorithms for students',
          concentration: 'AI/ML',
        });

      expect(res.status).toBe(401);
    });

    test('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/v1/topics')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          title: 'Machine Learning',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_INPUT');
    });

    test('should create ActivityLog entry', async () => {
      await request(app)
        .post('/api/v1/topics')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          title: 'Test Topic',
          description: 'This is a test topic for creating a new topic with valid data',
          concentration: 'AI/ML',
        });

      const logs = await ActivityLog.find({ action: 'topic_created' });
      expect(logs).toHaveLength(1);
    });
  });

  describe('GET /api/v1/topics/:topicId', () => {
    test('should get topic details', async () => {
      const topic = await Topic.create({
        title: 'Topic Title',
        description: 'This is a detailed description for the topic that users will read',
        supervisor_id: supervisor._id,
        concentration: 'AI/ML',
        status: 'Active',
      });

      const res = await request(app).get(`/api/v1/topics/${topic._id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Topic Title');
      expect(res.body.data.supervisor_id).toBeDefined();
    });

    test('should return 404 for non-existent topic', async () => {
      const res = await request(app).get('/api/v1/topics/000000000000000000000000');

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/v1/topics/:topicId', () => {
    test('should update topic as owner', async () => {
      const topic = await Topic.create({
        title: 'Original Title',
        description: 'This is the original description that will be changed very soon here',
        supervisor_id: supervisor._id,
        concentration: 'AI/ML',
        status: 'Draft',
      });

      const res = await request(app)
        .put(`/api/v1/topics/${topic._id}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          title: 'Updated Title',
          description: 'This is the updated description for the topic in the system now',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Title');
    });

    test('should prevent updates to published topics', async () => {
      const topic = await Topic.create({
        title: 'Active Topic',
        description: 'This is a published topic that cannot be edited by the supervisor anymore',
        supervisor_id: supervisor._id,
        concentration: 'AI/ML',
        status: 'Active',
      });

      const res = await request(app)
        .put(`/api/v1/topics/${topic._id}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          title: 'Updated Title',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_STATE');
    });

    test('should require ownership', async () => {
      const otherSupervisorHash = await hashPassword('OtherPass123');
      const otherSupervisor = await User.create({
        email: 'other@university.edu',
        passwordHash: otherSupervisorHash,
        fullName: 'Dr. Other',
        role: 'Supervisor',
      });

      const topic = await Topic.create({
        title: 'Topic Title',
        description: 'This is a topic created by another supervisor that cannot be edited',
        supervisor_id: otherSupervisor._id,
        concentration: 'AI/ML',
        status: 'Draft',
      });

      const res = await request(app)
        .put(`/api/v1/topics/${topic._id}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          title: 'Updated Title',
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  describe('POST /api/v1/topics/:topicId/publish', () => {
    test('should publish draft topic', async () => {
      const topic = await Topic.create({
        title: 'Draft Topic',
        description: 'This is a draft topic that is ready to be published for students',
        supervisor_id: supervisor._id,
        concentration: 'AI/ML',
        status: 'Draft',
      });

      const res = await request(app)
        .post(`/api/v1/topics/${topic._id}/publish`)
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('Active');
    });

    test('should prevent publishing already published topics', async () => {
      const topic = await Topic.create({
        title: 'Active Topic',
        description: 'This topic is already published and cannot be published again today',
        supervisor_id: supervisor._id,
        concentration: 'AI/ML',
        status: 'Active',
      });

      const res = await request(app)
        .post(`/api/v1/topics/${topic._id}/publish`)
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_STATE');
    });

    test('should create ActivityLog entry', async () => {
      const topic = await Topic.create({
        title: 'Draft Topic',
        description: 'This is a draft topic ready to be published for all students',
        supervisor_id: supervisor._id,
        concentration: 'AI/ML',
        status: 'Draft',
      });

      await request(app)
        .post(`/api/v1/topics/${topic._id}/publish`)
        .set('Authorization', `Bearer ${supervisorToken}`);

      const logs = await ActivityLog.find({ action: 'topic_published' });
      expect(logs).toHaveLength(1);
    });
  });

  describe('POST /api/v1/topics/:topicId/archive', () => {
    test('should archive active topic', async () => {
      const topic = await Topic.create({
        title: 'Active Topic',
        description: 'This is an active topic that will be archived by the supervisor now',
        supervisor_id: supervisor._id,
        concentration: 'AI/ML',
        status: 'Active',
      });

      const res = await request(app)
        .post(`/api/v1/topics/${topic._id}/archive`)
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('Archived');
      expect(res.body.data.archivedAt).toBeDefined();
    });
  });

  describe('GET /api/v1/topics/my-topics/list', () => {
    test('should list supervisor topics', async () => {
      await Topic.create({
        title: 'My Draft Topic',
        description: 'This is my draft topic that only I can see as the supervisor',
        supervisor_id: supervisor._id,
        concentration: 'AI/ML',
        status: 'Draft',
      });

      const res = await request(app)
        .get('/api/v1/topics/my-topics/list')
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(1);
    });

    test('should require supervisor role', async () => {
      const res = await request(app)
        .get('/api/v1/topics/my-topics/list')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/topics/:topicId', () => {
    test('should delete topic as admin', async () => {
      const topic = await Topic.create({
        title: 'Topic to Delete',
        description: 'This topic will be deleted by the administrator from the system',
        supervisor_id: supervisor._id,
        concentration: 'AI/ML',
        status: 'Active',
      });

      const res = await request(app)
        .delete(`/api/v1/topics/${topic._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      const deletedTopic = await Topic.findById(topic._id);
      expect(deletedTopic).toBeNull();
    });

    test('should require admin role', async () => {
      const topic = await Topic.create({
        title: 'Topic',
        description: 'Topic that a non-admin user cannot delete from the system',
        supervisor_id: supervisor._id,
        concentration: 'AI/ML',
      });

      const res = await request(app)
        .delete(`/api/v1/topics/${topic._id}`)
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(403);
    });
  });
});
