const request = require('supertest');
const app = require('../../src/app');
const Feedback = require('../../src/models/Feedback');
const Submission = require('../../src/models/Submission');
const Topic = require('../../src/models/Topic');
const User = require('../../src/models/User');
const Assignment = require('../../src/models/Assignment');
const { generateTokens } = require('../../src/utils/jwt');
const bcrypt = require('bcryptjs');

const createPasswordHash = async () => {
  return await bcrypt.hash('test-password-123', 10);
};

describe('Feedback Routes', () => {
  let student, supervisor, topic, submission, studentToken, supervisorToken, assignment, passwordHash;

  beforeEach(async () => {
    await Feedback.deleteMany({});
    await Submission.deleteMany({});
    await Topic.deleteMany({});
    await Assignment.deleteMany({});
    await User.deleteMany({});

    passwordHash = await createPasswordHash();

    student = await User.create({
      email: 'student@university.edu',
      passwordHash,
      fullName: 'John Student',
      role: 'Student',
    });

    supervisor = await User.create({
      email: 'supervisor@university.edu',
      passwordHash,
      fullName: 'Dr. Smith',
      role: 'Supervisor',
    });

    topic = await Topic.create({
      title: 'AI Research',
      description: 'Study of artificial intelligence and machine learning systems for modern applications',
      supervisor_id: supervisor._id,
      concentration: 'AI/ML',
    });

    submission = await Submission.create({
      student_id: student._id,
      topic_id: topic._id,
      phase: 'Initial Statement',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    assignment = await Assignment.create({
      student_id: student._id,
      topic_id: topic._id,
      supervisor_id: supervisor._id,
      status: 'Active',
    });

    studentToken = generateTokens(student._id, 'Student').token;
    supervisorToken = generateTokens(supervisor._id, 'Supervisor').token;
  });

  describe('POST /api/v1/feedback/submissions/:submissionId/feedback', () => {
    test('should create feedback as supervisor', async () => {
      const res = await request(app)
        .post(`/api/v1/feedback/submissions/${submission._id}/feedback`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          feedbackText: 'Excellent initial statement with clear methodology and objectives',
          rating: 5,
          isPrivate: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.feedbackText).toBe('Excellent initial statement with clear methodology and objectives');
      expect(res.body.data.rating).toBe(5);
      expect(res.body.data.isPrivate).toBe(false);
    });

    test('should not allow students to create feedback', async () => {
      const res = await request(app)
        .post(`/api/v1/feedback/submissions/${submission._id}/feedback`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          feedbackText: 'This should not work',
          rating: 3,
        });

      expect(res.status).toBe(403);
    });

    test('should not allow unauthenticated users to create feedback', async () => {
      const res = await request(app)
        .post(`/api/v1/feedback/submissions/${submission._id}/feedback`)
        .send({
          feedbackText: 'Unauthorized feedback',
          rating: 3,
        });

      expect(res.status).toBe(401);
    });

    test('should reject feedback from supervisor not assigned to student', async () => {
      const otherSupervisor = await User.create({
        email: 'other-supervisor@university.edu',
        passwordHash,
        fullName: 'Dr. Jones',
        role: 'Supervisor',
      });

      const otherToken = generateTokens(otherSupervisor._id, 'Supervisor').token;

      const res = await request(app)
        .post(`/api/v1/feedback/submissions/${submission._id}/feedback`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          feedbackText: 'This supervisor is not assigned',
          rating: 3,
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('NOT_ASSIGNED');
    });

    test('should reject feedback without text', async () => {
      const res = await request(app)
        .post(`/api/v1/feedback/submissions/${submission._id}/feedback`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          rating: 3,
        });

      expect(res.status).toBe(400);
    });

    test('should reject feedback with invalid rating', async () => {
      const res = await request(app)
        .post(`/api/v1/feedback/submissions/${submission._id}/feedback`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          feedbackText: 'Good feedback text here',
          rating: 6,
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_RATING');
    });
  });

  describe('GET /api/v1/feedback/submissions/:submissionId/feedback', () => {
    beforeEach(async () => {
      await Feedback.create({
        submission_id: submission._id,
        supervisor_id: supervisor._id,
        feedbackText: 'This is public feedback visible to student',
        rating: 4,
        isPrivate: false,
      });

      await Feedback.create({
        submission_id: submission._id,
        supervisor_id: supervisor._id,
        feedbackText: 'This is private feedback only for supervisor',
        rating: 3,
        isPrivate: true,
      });
    });

    test('student should only see public feedback', async () => {
      const res = await request(app)
        .get(`/api/v1/feedback/submissions/${submission._id}/feedback`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(1);
      expect(res.body.data.feedback[0].isPrivate).toBe(false);
    });

    test('supervisor should see all feedback', async () => {
      const res = await request(app)
        .get(`/api/v1/feedback/submissions/${submission._id}/feedback`)
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(2);
    });

    test('student cannot view other student submissions', async () => {
      const otherStudent = await User.create({
        email: 'other-student@university.edu',
        passwordHash,
        fullName: 'Jane Student',
        role: 'Student',
      });

      const otherToken = generateTokens(otherStudent._id, 'Student').token;

      const res = await request(app)
        .get(`/api/v1/feedback/submissions/${submission._id}/feedback`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
    });

    test('supervisor not assigned to student cannot view feedback', async () => {
      const otherSupervisor = await User.create({
        email: 'other-supervisor@university.edu',
        passwordHash,
        fullName: 'Dr. Jones',
        role: 'Supervisor',
      });

      const otherToken = generateTokens(otherSupervisor._id, 'Supervisor').token;

      const res = await request(app)
        .get(`/api/v1/feedback/submissions/${submission._id}/feedback`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
    });

    test('should return 404 for non-existent submission', async () => {
      const fakeId = new (require('mongoose')).Types.ObjectId();

      const res = await request(app)
        .get(`/api/v1/feedback/submissions/${fakeId}/feedback`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/v1/feedback/:feedbackId', () => {
    let feedback;

    beforeEach(async () => {
      feedback = await Feedback.create({
        submission_id: submission._id,
        supervisor_id: supervisor._id,
        feedbackText: 'Original feedback text here',
        rating: 3,
        isPrivate: false,
      });
    });

    test('supervisor should update own feedback', async () => {
      const res = await request(app)
        .put(`/api/v1/feedback/${feedback._id}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          feedbackText: 'Updated feedback text here',
          rating: 5,
          isPrivate: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.feedbackText).toBe('Updated feedback text here');
      expect(res.body.data.rating).toBe(5);
      expect(res.body.data.isPrivate).toBe(true);
    });

    test('supervisor cannot update other supervisor feedback', async () => {
      const otherSupervisor = await User.create({
        email: 'other-supervisor@university.edu',
        passwordHash,
        fullName: 'Dr. Jones',
        role: 'Supervisor',
      });

      const otherToken = generateTokens(otherSupervisor._id, 'Supervisor').token;

      const res = await request(app)
        .put(`/api/v1/feedback/${feedback._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          feedbackText: 'Should not work',
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('NOT_OWNER');
    });

    test('student cannot update feedback', async () => {
      const res = await request(app)
        .put(`/api/v1/feedback/${feedback._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          feedbackText: 'Should not work',
        });

      expect(res.status).toBe(403);
    });

    test('should reject invalid rating in update', async () => {
      const res = await request(app)
        .put(`/api/v1/feedback/${feedback._id}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          rating: 10,
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_RATING');
    });
  });

  describe('DELETE /api/v1/feedback/:feedbackId', () => {
    let feedback;

    beforeEach(async () => {
      feedback = await Feedback.create({
        submission_id: submission._id,
        supervisor_id: supervisor._id,
        feedbackText: 'Feedback to be deleted',
        rating: 2,
      });
    });

    test('supervisor should delete own feedback', async () => {
      const res = await request(app)
        .delete(`/api/v1/feedback/${feedback._id}`)
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(200);

      const deleted = await Feedback.findById(feedback._id);
      expect(deleted).toBeNull();
    });

    test('supervisor cannot delete other supervisor feedback', async () => {
      const otherSupervisor = await User.create({
        email: 'other-supervisor@university.edu',
        passwordHash,
        fullName: 'Dr. Jones',
        role: 'Supervisor',
      });

      const otherToken = generateTokens(otherSupervisor._id, 'Supervisor').token;

      const res = await request(app)
        .delete(`/api/v1/feedback/${feedback._id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('NOT_OWNER');
    });

    test('student cannot delete feedback', async () => {
      const res = await request(app)
        .delete(`/api/v1/feedback/${feedback._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/feedback/submissions/:submissionId/stats', () => {
    beforeEach(async () => {
      await Feedback.create({
        submission_id: submission._id,
        supervisor_id: supervisor._id,
        feedbackText: 'Good work overall',
        rating: 4,
        isPrivate: false,
      });

      await Feedback.create({
        submission_id: submission._id,
        supervisor_id: supervisor._id,
        feedbackText: 'Excellent work here',
        rating: 5,
        isPrivate: false,
      });

      await Feedback.create({
        submission_id: submission._id,
        supervisor_id: supervisor._id,
        feedbackText: 'Needs improvement here',
        rating: 2,
        isPrivate: true,
      });
    });

    test('should get feedback statistics', async () => {
      const res = await request(app)
        .get(`/api/v1/feedback/submissions/${submission._id}/stats`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(2); // Only public feedback
      expect(res.body.data.avgRating).toBe(4.5);
      expect(res.body.data.minRating).toBe(4);
      expect(res.body.data.maxRating).toBe(5);
    });

    test('should return zero count for submission with no feedback', async () => {
      const newSubmission = await Submission.create({
        student_id: student._id,
        topic_id: topic._id,
        phase: 'Progress Report 1',
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      });

      const res = await request(app)
        .get(`/api/v1/feedback/submissions/${newSubmission._id}/stats`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(0);
      expect(res.body.data.avgRating).toBeNull();
    });
  });
});
