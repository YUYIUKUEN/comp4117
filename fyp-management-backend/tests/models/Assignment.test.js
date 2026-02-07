const mongoose = require('mongoose');
const Assignment = require('../../src/models/Assignment');

describe('Assignment Model', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fyp_test');
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  afterEach(async () => {
    await Assignment.deleteMany({});
  });

  describe('Valid Assignment Creation', () => {
    it('should create a valid assignment with all required fields', async () => {
      const assignment = new Assignment({
        student_id: new mongoose.Types.ObjectId(),
        topic_id: new mongoose.Types.ObjectId(),
        supervisor_id: new mongoose.Types.ObjectId(),
      });

      const saved = await assignment.save();
      expect(saved._id).toBeDefined();
      expect(saved.status).toBe('Active');
      expect(saved.assigned_at).toBeDefined();
    });

    it('should set default status to Active', async () => {
      const assignment = new Assignment({
        student_id: new mongoose.Types.ObjectId(),
        topic_id: new mongoose.Types.ObjectId(),
        supervisor_id: new mongoose.Types.ObjectId(),
      });

      const saved = await assignment.save();
      expect(saved.status).toBe('Active');
    });

    it('should support all valid status values', async () => {
      const statuses = ['Active', 'Completed', 'Changed'];

      for (const status of statuses) {
        const assignment = new Assignment({
          student_id: new mongoose.Types.ObjectId(),
          topic_id: new mongoose.Types.ObjectId(),
          supervisor_id: new mongoose.Types.ObjectId(),
          status,
        });

        const saved = await assignment.save();
        expect(saved.status).toBe(status);
      }
    });

    it('should allow optional replacedBy field', async () => {
      const oldAssignmentId = new mongoose.Types.ObjectId();
      const assignment = new Assignment({
        student_id: new mongoose.Types.ObjectId(),
        topic_id: new mongoose.Types.ObjectId(),
        supervisor_id: new mongoose.Types.ObjectId(),
        replacedBy: oldAssignmentId,
      });

      const saved = await assignment.save();
      expect(saved.replacedBy).toEqual(oldAssignmentId);
    });
  });

  describe('Unique Active Assignment Per Student', () => {
    it('should prevent multiple active assignments for same student', async () => {
      const studentId = new mongoose.Types.ObjectId();
      const supervisorId = new mongoose.Types.ObjectId();

      // First active assignment should succeed
      await Assignment.create({
        student_id: studentId,
        topic_id: new mongoose.Types.ObjectId(),
        supervisor_id: supervisorId,
        status: 'Active',
      });

      // Second active assignment to same student should fail
      const secondAssignment = new Assignment({
        student_id: studentId,
        topic_id: new mongoose.Types.ObjectId(),
        supervisor_id: supervisorId,
        status: 'Active',
      });

      await expect(secondAssignment.save()).rejects.toThrow(
        /E11000 duplicate key error|duplicate key/i
      );
    });

    it('should allow multiple assignments with different statuses for same student', async () => {
      const studentId = new mongoose.Types.ObjectId();
      const supervisorId = new mongoose.Types.ObjectId();

      // Create an Active assignment
      const active = await Assignment.create({
        student_id: studentId,
        topic_id: new mongoose.Types.ObjectId(),
        supervisor_id: supervisorId,
        status: 'Active',
      });

      // Change it to Completed
      active.status = 'Completed';
      await active.save();

      // Now create another Active assignment - should succeed
      const newActive = await Assignment.create({
        student_id: studentId,
        topic_id: new mongoose.Types.ObjectId(),
        supervisor_id: supervisorId,
        status: 'Active',
      });

      expect(newActive._id).toBeDefined();
      expect(newActive.status).toBe('Active');
    });

    it('should allow different students to have active assignments', async () => {
      const student1 = new mongoose.Types.ObjectId();
      const student2 = new mongoose.Types.ObjectId();
      const supervisorId = new mongoose.Types.ObjectId();

      const assign1 = await Assignment.create({
        student_id: student1,
        topic_id: new mongoose.Types.ObjectId(),
        supervisor_id: supervisorId,
        status: 'Active',
      });

      const assign2 = await Assignment.create({
        student_id: student2,
        topic_id: new mongoose.Types.ObjectId(),
        supervisor_id: supervisorId,
        status: 'Active',
      });

      expect(assign1._id).toBeDefined();
      expect(assign2._id).toBeDefined();
      expect(assign1._id).not.toEqual(assign2._id);
    });

    it('should allow unlimited Completed/Changed assignments per student', async () => {
      const studentId = new mongoose.Types.ObjectId();
      const supervisorId = new mongoose.Types.ObjectId();

      for (let i = 0; i < 3; i++) {
        const assignment = await Assignment.create({
          student_id: studentId,
          topic_id: new mongoose.Types.ObjectId(),
          supervisor_id: supervisorId,
          status: i === 0 ? 'Active' : i === 1 ? 'Completed' : 'Changed',
        });

        expect(assignment._id).toBeDefined();
      }

      // Verify all were created
      const count = await Assignment.countDocuments({ student_id: studentId });
      expect(count).toBe(3);
    });
  });

  describe('Field Immutability', () => {
    it('should not allow updating assigned_at', async () => {
      const assignment = await Assignment.create({
        student_id: new mongoose.Types.ObjectId(),
        topic_id: new mongoose.Types.ObjectId(),
        supervisor_id: new mongoose.Types.ObjectId(),
      });

      const originalAssignedAt = assignment.assigned_at;
      assignment.assigned_at = new Date(Date.now() - 86400000); // Yesterday

      const updated = await assignment.save();
      expect(updated.assigned_at.getTime()).toBe(originalAssignedAt.getTime());
    });
  });

  describe('Required Fields', () => {
    it('should require student_id', async () => {
      const assignment = new Assignment({
        topic_id: new mongoose.Types.ObjectId(),
        supervisor_id: new mongoose.Types.ObjectId(),
      });

      await expect(assignment.save()).rejects.toThrow();
    });

    it('should require topic_id', async () => {
      const assignment = new Assignment({
        student_id: new mongoose.Types.ObjectId(),
        supervisor_id: new mongoose.Types.ObjectId(),
      });

      await expect(assignment.save()).rejects.toThrow();
    });

    it('should require supervisor_id', async () => {
      const assignment = new Assignment({
        student_id: new mongoose.Types.ObjectId(),
        topic_id: new mongoose.Types.ObjectId(),
      });

      await expect(assignment.save()).rejects.toThrow();
    });
  });

  describe('Indexes', () => {
    it('should have unique sparse index on (student_id, status) for Active assignments', async () => {
      // This is enforced by the schema, tested above in unique constraint tests
      const studentId = new mongoose.Types.ObjectId();
      const supervisorId = new mongoose.Types.ObjectId();

      // Multiple Active should fail
      await Assignment.create({
        student_id: studentId,
        topic_id: new mongoose.Types.ObjectId(),
        supervisor_id: supervisorId,
        status: 'Active',
      });

      const duplicate = new Assignment({
        student_id: studentId,
        topic_id: new mongoose.Types.ObjectId(),
        supervisor_id: supervisorId,
        status: 'Active',
      });

      await expect(duplicate.save()).rejects.toThrow();
    });
  });
});
