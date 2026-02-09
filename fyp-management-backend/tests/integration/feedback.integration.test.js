const request = require('supertest');
const app = require('../../src/app');
const Feedback = require('../../src/models/Feedback');
const Submission = require('../../src/models/Submission');
const Topic = require('../../src/models/Topic');
const User = require('../../src/models/User');
const Assignment = require('../../src/models/Assignment');
const ActivityLog = require('../../src/models/ActivityLog');
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

describe('Feedback Integration Tests', () => {
  let student, supervisor, topic, assignment, submission;
  let studentToken, supervisorToken;

  beforeEach(async () => {
    // Clean up all data
    await Feedback.deleteMany({});
    await Submission.deleteMany({});
    await Assignment.deleteMany({});
    await Topic.deleteMany({});
    await User.deleteMany({});
    await ActivityLog.deleteMany({});

    // Create users
    student = await createUser('student.integration@university.edu', 'Integration Test Student', 'Student');
    supervisor = await createUser('supervisor.integration@university.edu', 'Dr. Integration Supervisor', 'Supervisor');

    // Create topic and assignment
    topic = await Topic.create({
      title: 'Integration Test Topic',
      description: 'This is a comprehensive topic for integration testing with feedback workflows and various edge cases',
      supervisor_id: supervisor._id,
      concentration: 'AI/ML',
    });

    assignment = await Assignment.create({
      student_id: student._id,
      topic_id: topic._id,
      supervisor_id: supervisor._id,
      status: 'Active',
    });

    // Create submission
    submission = await Submission.create({
      student_id: student._id,
      topic_id: topic._id,
      phase: 'Initial Statement',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    // Generate tokens
    studentToken = generateTokens(student._id, 'Student').token;
    supervisorToken = generateTokens(supervisor._id, 'Supervisor').token;
  });

  describe('Complete Feedback Workflow', () => {
    test('should complete full feedback workflow: create, read, update, delete', async () => {
      // Step 1: Create feedback
      const createRes = await request(app)
        .post(`/api/v1/feedback/submissions/${submission._id}/feedback`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          feedbackText: 'Initial comprehensive review of the proposal',
          rating: 4,
          isPrivate: false,
        });

      expect(createRes.status).toBe(201);
      const feedbackId = createRes.body.data._id;

      // Step 2: Student reads public feedback
      const readRes = await request(app)
        .get(`/api/v1/feedback/submissions/${submission._id}/feedback`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(readRes.status).toBe(200);
      expect(readRes.body.data.count).toBe(1);
      expect(readRes.body.data.feedback[0]._id).toBe(feedbackId);

      // Step 3: Supervisor updates feedback
      const updateRes = await request(app)
        .put(`/api/v1/feedback/${feedbackId}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          feedbackText: 'Updated comprehensive review with additional suggestions',
          rating: 5,
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.rating).toBe(5);

      // Step 4: Supervisor deletes feedback
      const deleteRes = await request(app)
        .delete(`/api/v1/feedback/${feedbackId}`)
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(deleteRes.status).toBe(200);

      // Step 5: Verify feedback is gone
      const verifyRes = await request(app)
        .get(`/api/v1/feedback/submissions/${submission._id}/feedback`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.count).toBe(0);
    });

    test('should handle multiple feedback items', async () => {
      // Create multiple feedback items
      const feedback1 = await request(app)
        .post(`/api/v1/feedback/submissions/${submission._id}/feedback`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          feedbackText: 'First feedback comment on methodology',
          rating: 4,
          isPrivate: false,
        });

      const feedback2 = await request(app)
        .post(`/api/v1/feedback/submissions/${submission._id}/feedback`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          feedbackText: 'Second feedback comment on objectives',
          rating: 3,
          isPrivate: false,
        });

      expect(feedback1.status).toBe(201);
      expect(feedback2.status).toBe(201);

      // Student should see both
      const readRes = await request(app)
        .get(`/api/v1/feedback/submissions/${submission._id}/feedback`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(readRes.status).toBe(200);
      expect(readRes.body.data.count).toBe(2);
    });
  });

  describe('Privacy Rules', () => {
    test('students should not see private feedback', async () => {
      // Create private feedback
      await request(app)
        .post(`/api/v1/feedback/submissions/${submission._id}/feedback`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          feedbackText: 'Private feedback for supervisor only',
          isPrivate: true,
        });

      // Create public feedback
      await request(app)
        .post(`/api/v1/feedback/submissions/${submission._id}/feedback`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          feedbackText: 'Public feedback for student',
          isPrivate: false,
        });

      // Student should only see public
      const readRes = await request(app)
        .get(`/api/v1/feedback/submissions/${submission._id}/feedback`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(readRes.status).toBe(200);
      expect(readRes.body.data.count).toBe(1);
      expect(readRes.body.data.feedback[0].isPrivate).toBe(false);

      // Supervisor should see both
      const supervisorRes = await request(app)
        .get(`/api/v1/feedback/submissions/${submission._id}/feedback`)
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(supervisorRes.status).toBe(200);
      expect(supervisorRes.body.data.count).toBe(2);
    });
  });

  describe('Authorization Rules', () => {
    test('only assigned supervisor can create feedback', async () => {
      const unassignedSupervisor = await createUser('unassigned@university.edu', 'Dr. Unassigned', 'Supervisor');
      const unassignedToken = generateTokens(unassignedSupervisor._id, 'Supervisor').token;

      const res = await request(app)
        .post(`/api/v1/feedback/submissions/${submission._id}/feedback`)
        .set('Authorization', `Bearer ${unassignedToken}`)
        .send({
          feedbackText: 'Should not work',
          rating: 3,
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('NOT_ASSIGNED');
    });

    test('only feedback owner can update/delete', async () => {
      const otherSupervisor = await createUser('other.supervisor@university.edu', 'Dr. Other', 'Supervisor');

      // Create assignment for other supervisor but different student
      const otherStudent = await createUser('other.student@university.edu', 'Other Student', 'Student');
      await Assignment.create({
        student_id: otherStudent._id,
        topic_id: topic._id,
        supervisor_id: otherSupervisor._id,
        status: 'Active',
      });

      const otherToken = generateTokens(otherSupervisor._id, 'Supervisor').token;

      // Create feedback with original supervisor
      const createRes = await request(app)
        .post(`/api/v1/feedback/submissions/${submission._id}/feedback`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          feedbackText: 'Original feedback',
          rating: 4,
        });

      const feedbackId = createRes.body.data._id;

      // Try to update with different supervisor
      const updateRes = await request(app)
        .put(`/api/v1/feedback/${feedbackId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          feedbackText: 'Should not work',
        });

      expect(updateRes.status).toBe(403);
      expect(updateRes.body.code).toBe('NOT_OWNER');
    });
  });

  describe('Activity Logging', () => {
    test('should log feedback creation', async () => {
      await request(app)
        .post(`/api/v1/feedback/submissions/${submission._id}/feedback`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          feedbackText: 'Feedback for logging test',
          rating: 3,
        });

      const logs = await ActivityLog.find({
        action: 'feedback_added',
        user_id: supervisor._id,
      });

      expect(logs).toHaveLength(1);
      expect(logs[0].entityType).toBe('Feedback');
    });

    test('should log feedback updates', async () => {
      const createRes = await request(app)
        .post(`/api/v1/feedback/submissions/${submission._id}/feedback`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          feedbackText: 'Original feedback',
        });

      const feedbackId = createRes.body.data._id;

      await request(app)
        .put(`/api/v1/feedback/${feedbackId}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          feedbackText: 'Updated feedback',
        });

      const logs = await ActivityLog.find({
        action: 'feedback_updated',
      });

      expect(logs).toHaveLength(1);
    });

    test('should log feedback deletion', async () => {
      const createRes = await request(app)
        .post(`/api/v1/feedback/submissions/${submission._id}/feedback`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          feedbackText: 'Feedback to be deleted',
        });

      const feedbackId = createRes.body.data._id;

      await request(app)
        .delete(`/api/v1/feedback/${feedbackId}`)
        .set('Authorization', `Bearer ${supervisorToken}`);

      const logs = await ActivityLog.find({
        action: 'feedback_deleted',
      });

      expect(logs).toHaveLength(1);
    });
  });

  describe('Feedback Statistics', () => {
    test('should calculate correct statistics from public feedback', async () => {
      // Create multiple feedback items with different ratings
      const ratings = [3, 4, 4, 5, 5, 5];

      for (const rating of ratings) {
        await request(app)
          .post(`/api/v1/feedback/submissions/${submission._id}/feedback`)
          .set('Authorization', `Bearer ${supervisorToken}`)
          .send({
            feedbackText: `Feedback with rating ${rating}`,
            rating,
            isPrivate: false,
          });
      }

      // Add private feedback that should not be counted
      await request(app)
        .post(`/api/v1/feedback/submissions/${submission._id}/feedback`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          feedbackText: 'Private feedback should not be counted',
          rating: 1,
          isPrivate: true,
        });

      // Get statistics
      const statsRes = await request(app)
        .get(`/api/v1/feedback/submissions/${submission._id}/stats`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(statsRes.status).toBe(200);
      expect(statsRes.body.data.count).toBe(6); // Only public
      expect(statsRes.body.data.avgRating).toBe((3 + 4 + 4 + 5 + 5 + 5) / 6); // ~4.33
      expect(statsRes.body.data.minRating).toBe(3);
      expect(statsRes.body.data.maxRating).toBe(5);
    });
  });

  describe('Edge Cases', () => {
    test('should reject empty feedback text', async () => {
      const res = await request(app)
        .post(`/api/v1/feedback/submissions/${submission._id}/feedback`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          feedbackText: '   ',
          rating: 3,
        });

      expect(res.status).toBe(400);
    });

    test('should handle null rating gracefully', async () => {
      const res = await request(app)
        .post(`/api/v1/feedback/submissions/${submission._id}/feedback`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          feedbackText: 'Feedback without rating',
          // No rating provided
          isPrivate: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.rating).toBeUndefined();
    });

    test('should handle max length feedback', async () => {
      const longFeedback = 'A'.repeat(5000);

      const res = await request(app)
        .post(`/api/v1/feedback/submissions/${submission._id}/feedback`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          feedbackText: longFeedback,
          rating: 4,
        });

      expect(res.status).toBe(201);
    });
  });
});
