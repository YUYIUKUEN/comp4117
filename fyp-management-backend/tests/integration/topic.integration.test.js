const request = require('supertest');
const app = require('../../src/app');
const Topic = require('../../src/models/Topic');
const User = require('../../src/models/User');
const ActivityLog = require('../../src/models/ActivityLog');
const { generateTokens } = require('../../src/utils/jwt');
const { hashPassword } = require('../../src/utils/password');

describe('Topic Management Integration Tests', () => {
  let supervisor, student, otherSupervisor;
  let supervisorToken, studentToken;

  beforeEach(async () => {
    // Clear collections
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

    const otherHash = await hashPassword('OtherPass123');
    otherSupervisor = await User.create({
      email: 'other@university.edu',
      passwordHash: otherHash,
      fullName: 'Dr. Jones',
      role: 'Supervisor',
    });

    supervisorToken = generateTokens(supervisor._id, 'Supervisor').token;
    studentToken = generateTokens(student._id, 'Student').token;
  });

  describe('Full Topic Lifecycle', () => {
    test('should complete topic lifecycle: create -> publish -> view -> archive', async () => {
      // Supervisor creates a draft topic
      const createRes = await request(app)
        .post('/api/v1/topics')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          title: 'Advanced Machine Learning',
          description: 'Study of deep learning architectures and applications in production systems',
          concentration: 'AI/ML',
          academicYear: 4,
          keywords: ['deep-learning', 'neural-networks', 'tensorflow'],
        });

      expect(createRes.status).toBe(201);
      const topicId = createRes.body.data._id;
      expect(createRes.body.data.status).toBe('Draft');

      // Student cannot see draft topics
      const studentBrowseBeforePublish = await request(app).get('/api/v1/topics');
      expect(studentBrowseBeforePublish.status).toBe(200);
      const draftTopicVisible = studentBrowseBeforePublish.body.data.topics.some(
        t => t._id === topicId
      );
      expect(draftTopicVisible).toBe(false);

      // Supervisor publishes the topic
      const publishRes = await request(app)
        .post(`/api/v1/topics/${topicId}/publish`)
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(publishRes.status).toBe(200);
      expect(publishRes.body.data.status).toBe('Active');

      // Now student can see the published topic
      const studentBrowseAfterPublish = await request(app).get('/api/v1/topics');
      expect(studentBrowseAfterPublish.status).toBe(200);
      const publishedTopicVisible = studentBrowseAfterPublish.body.data.topics.some(
        t => t._id === topicId
      );
      expect(publishedTopicVisible).toBe(true);

      // Student views topic details
      const viewRes = await request(app).get(`/api/v1/topics/${topicId}`);
      expect(viewRes.status).toBe(200);
      expect(viewRes.body.data.title).toBe('Advanced Machine Learning');
      expect(viewRes.body.data.supervisor_id.fullName).toBe('Dr. Smith');

      // Supervisor archives the topic
      const archiveRes = await request(app)
        .post(`/api/v1/topics/${topicId}/archive`)
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(archiveRes.status).toBe(200);
      expect(archiveRes.body.data.status).toBe('Archived');
      expect(archiveRes.body.data.archivedAt).toBeDefined();

      // Archived topic is hidden from students again
      const finalBrowse = await request(app).get('/api/v1/topics');
      const archivedTopicVisible = finalBrowse.body.data.topics.some(
        t => t._id === topicId
      );
      expect(archivedTopicVisible).toBe(false);
    });

    test('should maintain ActivityLog throughout lifecycle', async () => {
      const createRes = await request(app)
        .post('/api/v1/topics')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          title: 'Test Topic',
          description: 'This is for testing the activity logging throughout the workflow',
          concentration: 'Systems',
        });

      const topicId = createRes.body.data._id;

      await request(app)
        .post(`/api/v1/topics/${topicId}/publish`)
        .set('Authorization', `Bearer ${supervisorToken}`);

      const logs = await ActivityLog.find({
        entityType: 'Topic',
        entityId: topicId,
      }).sort({ createdAt: 1 });

      expect(logs.length).toBeGreaterThanOrEqual(2);
      expect(logs[0].action).toBe('topic_created');
      expect(logs[1].action).toBe('topic_published');
    });
  });

  describe('Search and Filtering', () => {
    beforeEach(async () => {
      // Create multiple topics with different attributes
      await Topic.create([
        {
          title: 'Deep Learning for Computer Vision',
          description: 'Advanced deep learning techniques for image recognition and object detection models',
          supervisor_id: supervisor._id,
          concentration: 'AI/ML',
          academicYear: 4,
          keywords: ['deep-learning', 'vision'],
          status: 'Active',
        },
        {
          title: 'Distributed System Design',
          description: 'Design principles for building scalable and fault-tolerant distributed systems',
          supervisor_id: supervisor._id,
          concentration: 'Systems',
          academicYear: 3,
          keywords: ['distributed', 'scalable'],
          status: 'Active',
        },
        {
          title: 'Cybersecurity and Network Defense',
          description: 'Modern approaches to network security, intrusion detection and threat mitigation',
          supervisor_id: otherSupervisor._id,
          concentration: 'Cybersecurity',
          academicYear: 4,
          keywords: ['security', 'network'],
          status: 'Active',
        },
      ]);
    });

    test('should filter topics by concentration', async () => {
      const res = await request(app).get('/api/v1/topics?concentration=AI%2FML');

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.total).toBe(1);
      expect(res.body.data.topics[0].concentration).toBe('AI/ML');
    });

    test('should filter topics by multiple concentrations sequentially', async () => {
      const aimlRes = await request(app).get('/api/v1/topics?concentration=AI%2FML');
      const systemsRes = await request(app).get('/api/v1/topics?concentration=Systems');
      const securityRes = await request(app).get('/api/v1/topics?concentration=Cybersecurity');

      expect(aimlRes.body.data.pagination.total).toBe(1);
      expect(systemsRes.body.data.pagination.total).toBe(1);
      expect(securityRes.body.data.pagination.total).toBe(1);
    });

    test('should filter topics by academic year', async () => {
      const res = await request(app).get('/api/v1/topics?academicYear=4');

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.total).toBe(2);
      res.body.data.topics.forEach(topic => {
        expect(topic.academicYear).toBe(4);
      });
    });

    test('should search topics by title', async () => {
      const res = await request(app).get('/api/v1/topics?search=Deep%20Learning');

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(1);
    });

    test('should combine multiple filters', async () => {
      const res = await request(app).get(
        '/api/v1/topics?concentration=AI%2FML&academicYear=4'
      );

      expect(res.status).toBe(200);
      expect(res.body.data.topics.every(t => t.concentration === 'AI/ML')).toBe(true);
      expect(res.body.data.topics.every(t => t.academicYear === 4)).toBe(true);
    });
  });

  describe('Topic Ownership and Permissions', () => {
    test('should allow supervisors to edit only their own draft topics', async () => {
      const otherToken = generateTokens(otherSupervisor._id, 'Supervisor').token;

      const createRes = await request(app)
        .post('/api/v1/topics')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          title: 'Original Title',
          description: 'This is the original description and only the creator can edit it',
          concentration: 'AI/ML',
          status: 'Draft',
        });

      const topicId = createRes.body.data._id;

      // Other supervisor cannot edit
      const otherEditRes = await request(app)
        .put(`/api/v1/topics/${topicId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          title: 'Hacked Title',
        });

      expect(otherEditRes.status).toBe(403);

      // Original supervisor can edit
      const ownerEditRes = await request(app)
        .put(`/api/v1/topics/${topicId}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          title: 'Updated Title by Owner',
        });

      expect(ownerEditRes.status).toBe(200);
      expect(ownerEditRes.body.data.title).toBe('Updated Title by Owner');
    });

    test('should prevent students from publishing topics', async () => {
      const createdTopic = await Topic.create({
        title: 'Test Topic',
        description: 'This is a test topic for validation of student publishing permissions',
        supervisor_id: supervisor._id,
        concentration: 'AI/ML',
        status: 'Draft',
      });

      const res = await request(app)
        .post(`/api/v1/topics/${createdTopic._id}/publish`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    test('should display supervisor info in topic details', async () => {
      const topic = await Topic.create({
        title: 'Topic with Supervisor Info',
        description: 'This topic should show complete supervisor information in the response',
        supervisor_id: supervisor._id,
        concentration: 'AI/ML',
        status: 'Active',
      });

      const res = await request(app).get(`/api/v1/topics/${topic._id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.supervisor_id).toBeDefined();
      expect(res.body.data.supervisor_id.fullName).toBe('Dr. Smith');
      expect(res.body.data.supervisor_id.email).toBe('supervisor@university.edu');
    });
  });

  describe('Supervisor Personal Topic Management', () => {
    test('should list only supervisor own topics with all statuses', async () => {
      // Create topics with different statuses
      await Topic.create([
        {
          title: 'Draft Topic',
          description: 'This is a draft topic only visible to the supervisor who owns it',
          supervisor_id: supervisor._id,
          concentration: 'AI/ML',
          status: 'Draft',
        },
        {
          title: 'Active Topic',
          description: 'This is an active published topic visible to all students and the supervisor',
          supervisor_id: supervisor._id,
          concentration: 'AI/ML',
          status: 'Active',
        },
        {
          title: 'Archived Topic',
          description: 'This topic is archived and no longer visible to students in browsing',
          supervisor_id: supervisor._id,
          concentration: 'AI/ML',
          status: 'Archived',
        },
        {
          title: 'Other Supervisor Active Topic',
          description: 'This is another supervisors active topic not visible in my topics list',
          supervisor_id: otherSupervisor._id,
          concentration: 'Systems',
          status: 'Active',
        },
      ]);

      const res = await request(app)
        .get('/api/v1/topics/my-topics/list')
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(3);
      res.body.data.topics.forEach(topic => {
        const supervisorIdStr = typeof topic.supervisor_id === 'string' 
          ? topic.supervisor_id 
          : topic.supervisor_id._id;
        expect(supervisorIdStr).toBe(supervisor._id.toString());
      });
    });

    test('should filter my-topics by status', async () => {
      await Topic.create([
        {
          title: 'Draft Topic',
          description: 'This is a draft topic only I can see in my personal topic list',
          supervisor_id: supervisor._id,
          concentration: 'AI/ML',
          status: 'Draft',
        },
        {
          title: 'Active Topic',
          description: 'This is my published and active topic visible to all students',
          supervisor_id: supervisor._id,
          concentration: 'AI/ML',
          status: 'Active',
        },
      ]);

      const draftRes = await request(app)
        .get('/api/v1/topics/my-topics/list?status=Draft')
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(draftRes.status).toBe(200);
      expect(draftRes.body.data.count).toBe(1);
      expect(draftRes.body.data.topics[0].status).toBe('Draft');
    });
  });

  describe('Pagination and Sorting', () => {
    beforeEach(async () => {
      // Create 25 topics for pagination testing
      const topics = [];
      for (let i = 1; i <= 25; i++) {
        topics.push({
          title: `Topic ${String(i).padStart(2, '0')}`,
          description: `This is topic number ${i} created for pagination and sorting testing purposes`,
          supervisor_id: supervisor._id,
          concentration: 'AI/ML',
          status: 'Active',
        });
      }
      await Topic.create(topics);
    });

    test('should paginate results correctly', async () => {
      const page1 = await request(app).get('/api/v1/topics?page=1&limit=10');
      const page2 = await request(app).get('/api/v1/topics?page=2&limit=10');
      const page3 = await request(app).get('/api/v1/topics?page=3&limit=10');

      expect(page1.body.data.pagination.page).toBe(1);
      expect(page1.body.data.pagination.limit).toBe(10);
      expect(page1.body.data.topics.length).toBe(10);

      expect(page2.body.data.pagination.page).toBe(2);
      expect(page2.body.data.topics.length).toBe(10);

      expect(page3.body.data.pagination.page).toBe(3);
      expect(page3.body.data.topics.length).toBe(5);

      // Page 1 and page 2 should have different topics
      const page1Ids = page1.body.data.topics.map(t => t._id);
      const page2Ids = page2.body.data.topics.map(t => t._id);
      expect(page1Ids).not.toContainEqual(page2Ids[0]);
    });

    test('should sort topics by createdAt descending by default', async () => {
      const res = await request(app).get('/api/v1/topics');

      expect(res.status).toBe(200);
      const topics = res.body.data.topics;
      
      // Check that topics are sorted by createdAt in descending order
      for (let i = 1; i < topics.length; i++) {
        const prevDate = new Date(topics[i - 1].createdAt).getTime();
        const currDate = new Date(topics[i].createdAt).getTime();
        expect(prevDate).toBeGreaterThanOrEqual(currDate);
      }
    });
  });

  describe('Topic Content Validation', () => {
    test('should create topic with all optional fields', async () => {
      const res = await request(app)
        .post('/api/v1/topics')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          title: 'Comprehensive Topic',
          description: 'This is a comprehensive topic with all possible fields filled in for testing',
          concentration: 'AI/ML',
          academicYear: 3,
          keywords: ['ml', 'algorithms', 'data-science'],
          referenceDocuments: [
            { name: 'Paper 1', url: 'https://example.com/paper1' },
            { name: 'Paper 2', url: 'https://example.com/paper2' },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.keywords).toEqual(['ml', 'algorithms', 'data-science']);
      expect(res.body.data.referenceDocuments.length).toBe(2);
    });

    test('should reject topics with invalid concentration', async () => {
      const res = await request(app)
        .post('/api/v1/topics')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          title: 'Invalid Concentration Topic',
          description: 'This topic has an invalid concentration field that should be rejected',
          concentration: 'InvalidType',
        });

      expect(res.status).toBe(400);
    });
  });
});
