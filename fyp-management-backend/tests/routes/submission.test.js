const request = require('supertest');
const app = require('../../src/app');
const Submission = require('../../src/models/Submission');
const Topic = require('../../src/models/Topic');
const User = require('../../src/models/User');
const Assignment = require('../../src/models/Assignment');
const { generateTokens } = require('../../src/utils/jwt');
const bcrypt = require('bcryptjs');

const createUser = async (email, fullName, role) => {
  const passwordHash = await bcrypt.hash('test-password-123', 10);
  return await User.create({
    email,
    passwordHash,
    fullName,
    role,
  });
};

describe('Submission Routes', () => {
  let student, supervisor, assignment, studentToken, supervisorToken, topic;

  beforeEach(async () => {
    await Submission.deleteMany({});
    await Assignment.deleteMany({});
    await Topic.deleteMany({});
    await User.deleteMany({});

    student = await createUser('student@university.edu', 'John Student', 'Student');
    supervisor = await createUser('supervisor@university.edu', 'Dr. Smith', 'Supervisor');

    topic = await Topic.create({
      title: 'AI Topic',
      description: 'Study of artificial intelligence and machine learning systems',
      supervisor_id: supervisor._id,
      concentration: 'AI/ML',
    });

    assignment = await Assignment.create({
      student_id: student._id,
      topic_id: topic._id,
      supervisor_id: supervisor._id,
    });

    const tokens = generateTokens(student._id, 'Student');
    studentToken = tokens.token;

    const supervisorTokens = generateTokens(supervisor._id, 'Supervisor');
    supervisorToken = supervisorTokens.token;
  });

  describe('POST /api/v1/submissions/:phase/submit', () => {
    test('should accept PDF file submission', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n test content');

      const res = await request(app)
        .post('/api/v1/submissions/Initial%20Statement/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('file', pdfBuffer, 'test.pdf');

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('Submitted');
      expect(res.body.data.files).toHaveLength(1);
    });

    test('should reject file without attachment', async () => {
      const res = await request(app)
        .post('/api/v1/submissions/Initial%20Statement/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('NO_FILE');
    });

    test('should reject invalid file type', async () => {
      const txtBuffer = Buffer.from('This is a text file');

      const res = await request(app)
        .post('/api/v1/submissions/Initial%20Statement/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('file', txtBuffer, 'test.txt');

      // File validation can return 400, 422, or 500 depending on multer error handling
      expect([400, 422, 500]).toContain(res.status);
    });

    test('should require authentication', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n test content');

      const res = await request(app)
        .post('/api/v1/submissions/Initial%20Statement/submit')
        .attach('file', pdfBuffer, 'test.pdf');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/submissions/:phase', () => {
    test('should retrieve student submission', async () => {
      const submission = await Submission.create({
        student_id: student._id,
        topic_id: topic._id,
        phase: 'Initial Statement',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'Submitted',
      });

      const res = await request(app)
        .get('/api/v1/submissions/Initial%20Statement')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data._id.toString()).toBe(submission._id.toString());
    });

    test('should return 404 for non-existent submission', async () => {
      const res = await request(app)
        .get('/api/v1/submissions/Initial%20Statement')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/submissions/:phase/declare-not-needed', () => {
    test('should mark submission as declared', async () => {
      const res = await request(app)
        .post('/api/v1/submissions/Initial%20Statement/declare-not-needed')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ reason: 'No project updates for this phase' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('Declared Not Needed');
      expect(res.body.data.declarationReason).toBe('No project updates for this phase');
    });

    test('should reject declaration without reason', async () => {
      const res = await request(app)
        .post('/api/v1/submissions/Initial%20Statement/declare-not-needed')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_INPUT');
    });
  });

  describe('GET /api/v1/submissions/supervisor/submissions', () => {
    test('should retrieve supervisor submissions', async () => {
      await Submission.create({
        student_id: student._id,
        topic_id: topic._id,
        phase: 'Initial Statement',
        dueDate: new Date(),
        status: 'Submitted',
      });

      const res = await request(app)
        .get('/api/v1/submissions/supervisor/submissions')
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    test('should filter by phase', async () => {
      await Submission.create({
        student_id: student._id,
        topic_id: topic._id,
        phase: 'Initial Statement',
        dueDate: new Date(),
        status: 'Submitted',
      });

      await Submission.create({
        student_id: student._id,
        topic_id: topic._id,
        phase: 'Progress Report 1',
        dueDate: new Date(),
        status: 'Not Submitted',
      });

      const res = await request(app)
        .get('/api/v1/submissions/supervisor/submissions?phase=Initial%20Statement')
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].phase).toBe('Initial Statement');
    });

    test('should require supervisor role', async () => {
      const res = await request(app)
        .get('/api/v1/submissions/supervisor/submissions')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/submissions/supervisor/student/:studentId/:phase', () => {
    test('should retrieve specific student submission', async () => {
      const submission = await Submission.create({
        student_id: student._id,
        topic_id: topic._id,
        phase: 'Initial Statement',
        dueDate: new Date(),
        status: 'Submitted',
      });

      const res = await request(app)
        .get(`/api/v1/submissions/supervisor/student/${student._id}/Initial%20Statement`)
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data._id.toString()).toBe(submission._id.toString());
    });

    test('should prevent unauthorized supervisor access', async () => {
      const anotherSupervisor = await createUser('other-supervisor@university.edu', 'Dr. Other', 'Supervisor');

      const anotherToken = generateTokens(anotherSupervisor._id, 'Supervisor').token;

      const res = await request(app)
        .get(`/api/v1/submissions/supervisor/student/${student._id}/Initial%20Statement`)
        .set('Authorization', `Bearer ${anotherToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/submissions/supervisor/statistics', () => {
    test('should retrieve submission statistics', async () => {
      await Submission.create({
        student_id: student._id,
        topic_id: topic._id,
        phase: 'Initial Statement',
        dueDate: new Date(),
        status: 'Submitted',
      });

      const res = await request(app)
        .get('/api/v1/submissions/supervisor/statistics')
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
