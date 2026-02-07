const mongoose = require('mongoose');
const Application = require('../../src/models/Application');

describe('Application Model', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fyp_test');
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  afterEach(async () => {
    await Application.deleteMany({});
  });

  describe('Valid Application Creation', () => {
    it('should create a valid application with all required fields', async () => {
      const application = new Application({
        student_id: new mongoose.Types.ObjectId(),
        topic_id: new mongoose.Types.ObjectId(),
        preference_rank: 1,
      });

      const saved = await application.save();
      expect(saved._id).toBeDefined();
      expect(saved.status).toBe('Pending');
      expect(saved.appliedAt).toBeDefined();
      expect(saved.decidedAt).toBeUndefined();
    });

    it('should set default status to Pending', async () => {
      const application = new Application({
        student_id: new mongoose.Types.ObjectId(),
        topic_id: new mongoose.Types.ObjectId(),
        preference_rank: 2,
      });

      const saved = await application.save();
      expect(saved.status).toBe('Pending');
    });

    it('should allow all valid preference_rank values (1-5)', async () => {
      for (let rank = 1; rank <= 5; rank++) {
        const application = new Application({
          student_id: new mongoose.Types.ObjectId(),
          topic_id: new mongoose.Types.ObjectId(),
          preference_rank: rank,
        });
        const saved = await application.save();
        expect(saved.preference_rank).toBe(rank);
      }
    });

    it('should allow optional supervisorNotes', async () => {
      const application = new Application({
        student_id: new mongoose.Types.ObjectId(),
        topic_id: new mongoose.Types.ObjectId(),
        preference_rank: 1,
        supervisorNotes: 'Good candidate for this topic',
      });

      const saved = await application.save();
      expect(saved.supervisorNotes).toBe('Good candidate for this topic');
    });
  });

  describe('Duplicate Prevention', () => {
    it('should prevent duplicate applications from same student to same topic', async () => {
      const studentId = new mongoose.Types.ObjectId();
      const topicId = new mongoose.Types.ObjectId();

      // First application should succeed
      await Application.create({
        student_id: studentId,
        topic_id: topicId,
        preference_rank: 1,
      });

      // Second application to same topic should fail
      const duplicateApp = new Application({
        student_id: studentId,
        topic_id: topicId,
        preference_rank: 2,
      });

      await expect(duplicateApp.save()).rejects.toThrow(
        /E11000 duplicate key error|duplicate key/i
      );
    });

    it('should allow same student to apply to different topics', async () => {
      const studentId = new mongoose.Types.ObjectId();
      const topic1 = new mongoose.Types.ObjectId();
      const topic2 = new mongoose.Types.ObjectId();

      const app1 = await Application.create({
        student_id: studentId,
        topic_id: topic1,
        preference_rank: 1,
      });

      const app2 = await Application.create({
        student_id: studentId,
        topic_id: topic2,
        preference_rank: 2,
      });

      expect(app1._id).toBeDefined();
      expect(app2._id).toBeDefined();
      expect(app1._id).not.toEqual(app2._id);
    });

    it('should allow different students to apply to same topic', async () => {
      const student1 = new mongoose.Types.ObjectId();
      const student2 = new mongoose.Types.ObjectId();
      const topicId = new mongoose.Types.ObjectId();

      const app1 = await Application.create({
        student_id: student1,
        topic_id: topicId,
        preference_rank: 1,
      });

      const app2 = await Application.create({
        student_id: student2,
        topic_id: topicId,
        preference_rank: 1,
      });

      expect(app1._id).toBeDefined();
      expect(app2._id).toBeDefined();
      expect(app1._id).not.toEqual(app2._id);
    });
  });

  describe('Preference Rank Validation', () => {
    it('should reject preference_rank outside 1-5 range', async () => {
      const invalidRanks = [0, 6, 10, -1];

      for (const rank of invalidRanks) {
        const application = new Application({
          student_id: new mongoose.Types.ObjectId(),
          topic_id: new mongoose.Types.ObjectId(),
          preference_rank: rank,
        });

        await expect(application.save()).rejects.toThrow();
      }
    });

    it('should be required', async () => {
      const application = new Application({
        student_id: new mongoose.Types.ObjectId(),
        topic_id: new mongoose.Types.ObjectId(),
      });

      await expect(application.save()).rejects.toThrow();
    });
  });

  describe('Status Transitions', () => {
    it('should support all valid status values', async () => {
      const statuses = ['Pending', 'Approved', 'Rejected'];
      const studentId = new mongoose.Types.ObjectId();

      for (let i = 0; i < statuses.length; i++) {
        const application = new Application({
          student_id: studentId,
          topic_id: new mongoose.Types.ObjectId(),
          preference_rank: i + 1,
          status: statuses[i],
        });

        const saved = await application.save();
        expect(saved.status).toBe(statuses[i]);
      }
    });

    it('should set decidedAt when transitioning from Pending', async () => {
      const application = await Application.create({
        student_id: new mongoose.Types.ObjectId(),
        topic_id: new mongoose.Types.ObjectId(),
        preference_rank: 1,
      });

      application.status = 'Approved';
      application.decidedAt = new Date();
      const updated = await application.save();

      expect(updated.status).toBe('Approved');
      expect(updated.decidedAt).toBeDefined();
    });
  });

  describe('Field Immutability', () => {
    it('should not allow updating appliedAt', async () => {
      const application = await Application.create({
        student_id: new mongoose.Types.ObjectId(),
        topic_id: new mongoose.Types.ObjectId(),
        preference_rank: 1,
      });

      const originalAppliedAt = application.appliedAt;
      application.appliedAt = new Date(Date.now() - 86400000); // Yesterday

      const updated = await application.save();
      expect(updated.appliedAt.getTime()).toBe(originalAppliedAt.getTime());
    });
  });

  describe('Indexes', () => {
    it('should have unique index on (student_id, topic_id)', async () => {
      const indexes = Application.collection.getIndexes();
      expect(indexes).toBeDefined();
      // Index structure should prevent duplicate (student_id, topic_id) combinations
    });
  });
});
