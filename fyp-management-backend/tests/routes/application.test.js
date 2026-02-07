const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Topic = require('../../src/models/Topic');
const Application = require('../../src/models/Application');
const {generateTokens} = require('../../src/utils/jwt');
const {hashPassword} = require('../../src/utils/password');

describe('Application Routes', () => {
  let studentUser, supervisorUser, adminUser;
  let studentToken, supervisorToken, adminToken;
  let activeTopic, draftTopic;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fyp_test');
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Clean up
    await User.deleteMany({});
    await Topic.deleteMany({});
    await Application.deleteMany({});

    // Create users
    const hashedPassword = await hashPassword('password123');

    studentUser = await User.create({
      email: 'student@example.com',
      passwordHash: hashedPassword,
      fullName: 'Test Student',
      role: 'Student',
    });

    supervisorUser = await User.create({
      email: 'supervisor@example.com',
      passwordHash: hashedPassword,
      fullName: 'Test Supervisor',
      role: 'Supervisor',
    });

    adminUser = await User.create({
      email: 'admin@example.com',
      passwordHash: hashedPassword,
      fullName: 'Test Admin',
      role: 'Admin',
    });

    // Generate tokens
    studentToken = generateTokens(studentUser._id, studentUser.role).token;
    supervisorToken = generateTokens(supervisorUser._id, supervisorUser.role).token;
    adminToken = generateTokens(adminUser._id, adminUser.role).token;

    // Create topics
    activeTopic = await Topic.create({
      title: 'Active Research Topic',
      description: 'This is an active research topic for testing',
      supervisor_id: supervisorUser._id,
      concentration: 'AI/ML',
      status: 'Active',
    });

    draftTopic = await Topic.create({
      title: 'Draft Research Topic',
      description: 'This is a draft research topic for testing',
      supervisor_id: supervisorUser._id,
      concentration: 'Web',
      status: 'Draft',
    });
  });

  describe('POST /applications (Apply to Topic)', () => {
    it('should successfully apply to an active topic', async () => {
      const res = await request(app)
        .post('/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          topic_id: activeTopic._id,
          preference_rank: 1,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Pending');
      expect(res.body.data.preference_rank).toBe(1);
    });

    it('should prevent duplicate applications to same topic', async () => {
      // First application
      await request(app)
        .post('/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          topic_id: activeTopic._id,
          preference_rank: 1,
        });

      // Duplicate application
      const res = await request(app)
        .post('/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          topic_id: activeTopic._id,
          preference_rank: 2,
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('DUPLICATE_APPLICATION');
    });

    it('should enforce maximum 5 applications per student', async () => {
      // Create 5 additional topics
      const topics = [];
      for (let i = 0; i < 5; i++) {
        const topic = await Topic.create({
          title: `Topic ${i}`,
          description: `Topic ${i} description`,
          supervisor_id: supervisorUser._id,
          concentration: 'AI/ML',
          status: 'Active',
        });
        topics.push(topic);
      }

      // Apply to all 5 topics
      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .post('/applications')
          .set('Authorization', `Bearer ${studentToken}`)
          .send({
            topic_id: topics[i]._id,
            preference_rank: i + 1,
          });

        expect(res.status).toBe(201);
      }

      // 6th application should fail
      const topic6 = await Topic.create({
        title: 'Topic 6',
        description: 'Topic 6 description',
        supervisor_id: supervisorUser._id,
        concentration: 'Web',
        status: 'Active',
      });

      const res = await request(app)
        .post('/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          topic_id: topic6._id,
          preference_rank: 1,
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('APPLICATION_LIMIT_EXCEEDED');
    });

    it('should prevent applying to inactive topics', async () => {
      const res = await request(app)
        .post('/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          topic_id: draftTopic._id,
          preference_rank: 1,
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('TOPIC_NOT_ACTIVE');
    });

    it('should reject invalid preference_rank', async () => {
      const invalidRanks = [0, 6, 'abc'];

      for (const rank of invalidRanks) {
        const res = await request(app)
          .post('/applications')
          .set('Authorization', `Bearer ${studentToken}`)
          .send({
            topic_id: activeTopic._id,
            preference_rank: rank,
          });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('INVALID_PREFERENCE_RANK');
      }
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/applications')
        .send({
          topic_id: activeTopic._id,
          preference_rank: 1,
        });

      expect(res.status).toBe(401);
    });

    it('should only allow students to apply', async () => {
      const res = await request(app)
        .post('/applications')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          topic_id: activeTopic._id,
          preference_rank: 1,
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /applications/my-applications (Student Applications List)', () => {
    beforeEach(async () => {
      // Create some applications
      for (let i = 0; i < 3; i++) {
        const topic = await Topic.create({
          title: `Topic ${i}`,
          description: `Description ${i}`,
          supervisor_id: supervisorUser._id,
          concentration: 'AI/ML',
          status: 'Active',
        });

        await Application.create({
          student_id: studentUser._id,
          topic_id: topic._id,
          preference_rank: i + 1,
          status: 'Pending',
        });
      }
    });

    it('should retrieve student applications', async () => {
      const res = await request(app)
        .get('/applications/my-applications')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(3);
      expect(res.body.pagination.total).toBe(3);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/applications/my-applications?page=2&limit=2')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.pagination.page).toBe(2);
      expect(res.body.pagination.limit).toBe(2);
    });

    it('should filter by status', async () => {
      // Approve one application
      const app1 = await Application.findOne();
      app1.status = 'Approved';
      await app1.save();

      const res = await request(app)
        .get('/applications/my-applications?status=Pending')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/applications/my-applications');

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /applications/:id (Withdraw Application)', () => {
    let application;

    beforeEach(async () => {
      application = await Application.create({
        student_id: studentUser._id,
        topic_id: activeTopic._id,
        preference_rank: 1,
        status: 'Pending',
      });
    });

    it('should successfully withdraw a pending application', async () => {
      const res = await request(app)
        .delete(`/applications/${application._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify application is deleted
      const deleted = await Application.findById(application._id);
      expect(deleted).toBeNull();
    });

    it('should prevent withdrawing non-pending applications', async () => {
      // Change status to Approved
      application.status = 'Approved';
      application.decidedAt = new Date();
      await application.save();

      const res = await request(app)
        .delete(`/applications/${application._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('CANNOT_WITHDRAW');
    });

    it('should prevent withdrawing others applications', async () => {
      const res = await request(app)
        .delete(`/applications/${application._id}`)
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .delete(`/applications/${application._id}`);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /applications/:id (Get Application by ID)', () => {
    let application;

    beforeEach(async () => {
      application = await Application.create({
        student_id: studentUser._id,
        topic_id: activeTopic._id,
        preference_rank: 1,
        status: 'Pending',
      });
    });

    it('should retrieve application by ID', async () => {
      const res = await request(app)
        .get(`/applications/${application._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id.toString()).toBe(application._id.toString());
    });

    it('should return 404 for non-existent application', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/applications/${fakeId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('APPLICATION_NOT_FOUND');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get(`/applications/${application._id}`);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /applications/supervisor/applications (Supervisor Applications)', () => {
    let student2;

    beforeEach(async () => {
      const hashedPassword = await hashPassword('password123');
      student2 = await User.create({
        email: 'student2@example.com',
        passwordHash: hashedPassword,
        fullName: 'Test Student 2',
        role: 'Student',
      });

      // Create applications from both students
      await Application.create({
        student_id: studentUser._id,
        topic_id: activeTopic._id,
        preference_rank: 1,
        status: 'Pending',
      });

      await Application.create({
        student_id: student2._id,
        topic_id: activeTopic._id,
        preference_rank: 2,
        status: 'Pending',
      });
    });

    it('should retrieve applications for supervisor topics', async () => {
      const res = await request(app)
        .get('/applications/supervisor/applications')
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/applications/supervisor/applications?page=1&limit=1')
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.pagination.total).toBe(2);
    });

    it('should filter by status', async () => {
      // Update one to Approved
      const app = await Application.findOne({ student_id: studentUser._id });
      app.status = 'Approved';
      await app.save();

      const res = await request(app)
        .get('/applications/supervisor/applications?status=Approved')
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });

    it('should require supervisor role', async () => {
      const res = await request(app)
        .get('/applications/supervisor/applications')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    it('should return empty list if supervisor has no topics', async () => {
      const hashedPassword = await hashPassword('password123');
      const otherSupervisor = await User.create({
        email: 'supervisor2@example.com',
        passwordHash: hashedPassword,
        fullName: 'Other Supervisor',
        role: 'Supervisor',
      });
      const otherToken = generateTokens(otherSupervisor._id, otherSupervisor.role).token;

      const res = await request(app)
        .get('/applications/supervisor/applications')
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
      expect(res.body.pagination.total).toBe(0);
    });
  });

  describe('GET /applications/stats/overview (Application Statistics)', () => {
    beforeEach(async () => {
      // Create applications with different statuses
      for (let i = 0; i < 3; i++) {
        const topic = await Topic.create({
          title: `Topic ${i}`,
          description: `Description ${i}`,
          supervisor_id: supervisorUser._id,
          concentration: 'AI/ML',
          status: 'Active',
        });

        const status = i === 0 ? 'Pending' : i === 1 ? 'Approved' : 'Rejected';
        await Application.create({
          student_id: studentUser._id,
          topic_id: topic._id,
          preference_rank: i + 1,
          status,
          decidedAt: i !== 0 ? new Date() : undefined,
        });
      }
    });

    it('should retrieve application statistics', async () => {
      const res = await request(app)
        .get('/applications/stats/overview')
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(3);
      expect(res.body.data.pending).toBe(1);
      expect(res.body.data.approved).toBe(1);
      expect(res.body.data.rejected).toBe(1);
    });

    it('should require supervisor role', async () => {
      const res = await request(app)
        .get('/applications/stats/overview')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /applications/topic/:topicId/stats (Topic-specific Statistics)', () => {
    beforeEach(async () => {
      // Create applications for a specific topic
      for (let i = 0; i < 2; i++) {
        const status = i === 0 ? 'Pending' : 'Approved';
        await Application.create({
          student_id: studentUser._id,
          topic_id: activeTopic._id,
          preference_rank: i + 1,
          status,
          decidedAt: i !== 0 ? new Date() : undefined,
        });
      }
    });

    it('should retrieve statistics for a specific topic', async () => {
      const res = await request(app)
        .get(`/applications/topic/${activeTopic._id}/stats`)
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(2);
      expect(res.body.data.pending).toBe(1);
      expect(res.body.data.approved).toBe(1);
    });

    it('should prevent non-supervisors from viewing stats', async () => {
      const res = await request(app)
        .get(`/applications/topic/${activeTopic._id}/stats`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    it('should prevent supervisors from viewing other supervisors topic stats', async () => {
      const hashedPassword = await hashPassword('password123');
      const otherSupervisor = await User.create({
        email: 'supervisor2@example.com',
        passwordHash: hashedPassword,
        fullName: 'Other Supervisor',
        role: 'Supervisor',
      });
      const otherToken = generateTokens(otherSupervisor._id, otherSupervisor.role).token;

      const res = await request(app)
        .get(`/applications/topic/${activeTopic._id}/stats`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });
});
