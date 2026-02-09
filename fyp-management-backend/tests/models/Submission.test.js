const Submission = require('../../src/models/Submission');
const User = require('../../src/models/User');
const Topic = require('../../src/models/Topic');
const bcrypt = require('bcryptjs');

// Create a valid password hash (60+ characters, bcrypt hashed)
const createPasswordHash = async () => {
  return await bcrypt.hash('test-password-123', 10);
};

describe('Submission Model', () => {
  let student, supervisor, topic, passwordHash;

  beforeEach(async () => {
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
      title: 'AI Topic',
      description: 'Study of artificial intelligence and machine learning systems',
      supervisor_id: supervisor._id,
      concentration: 'AI/ML',
    });
  });

  test('should create submission for each phase', async () => {
    const phases = ['Initial Statement', 'Progress Report 1', 'Progress Report 2', 'Final Dissertation'];
    for (const phase of phases) {
      const submission = await Submission.create({
        student_id: student._id,
        topic_id: topic._id,
        phase,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      expect(submission._id).toBeDefined();
      expect(submission.status).toBe('Not Submitted');
    }
  });

  test('should prevent duplicate submissions for same phase', async () => {
    await Submission.create({
      student_id: student._id,
      topic_id: topic._id,
      phase: 'Initial Statement',
      dueDate: new Date(),
    });

    const duplicate = new Submission({
      student_id: student._id,
      topic_id: topic._id,
      phase: 'Initial Statement',
      dueDate: new Date(),
    });

    await expect(duplicate.save()).rejects.toThrow();
  });

  test('should mark submission as Overdue when past due date', async () => {
    const pastDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    
    const submission = await Submission.create({
      student_id: student._id,
      topic_id: topic._id,
      phase: 'Initial Statement',
      dueDate: pastDate,
      status: 'Not Submitted',
    });

    // Save again to trigger pre-save hook
    await submission.save();

    expect(submission.status).toBe('Overdue');
  });

  test('should allow file uploads to submission', async () => {
    const submission = await Submission.create({
      student_id: student._id,
      topic_id: topic._id,
      phase: 'Initial Statement',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    submission.files.push({
      filename: 'test-1673445600000-a1b2c3d4.pdf',
      originalName: 'submission.pdf',
      mimetype: 'application/pdf',
      size: 1024000,
      url: '/api/v1/submissions/Initial%20Statement/files/test-1673445600000-a1b2c3d4.pdf',
    });

    await submission.save();

    const retrieved = await Submission.findById(submission._id);
    expect(retrieved.files).toHaveLength(1);
    expect(retrieved.files[0].originalName).toBe('submission.pdf');
  });

  test('should reject file size over 50MB', async () => {
    const submission = await Submission.create({
      student_id: student._id,
      topic_id: topic._id,
      phase: 'Initial Statement',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    // Try to add oversized file
    submission.files.push({
      filename: 'large-file.pdf',
      originalName: 'large.pdf',
      mimetype: 'application/pdf',
      size: 60 * 1024 * 1024, // 60MB
      url: '/api/v1/submissions/Initial%20Statement/files/large-file.pdf',
    });

    await expect(submission.save()).rejects.toThrow();
  });

  test('should track submission timestamps', async () => {
    const submission = await Submission.create({
      student_id: student._id,
      topic_id: topic._id,
      phase: 'Initial Statement',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    expect(submission.createdAt).toBeDefined();
    expect(submission.updatedAt).toBeDefined();
  });

  test('should allow declaration of non-submission', async () => {
    const submission = await Submission.create({
      student_id: student._id,
      topic_id: topic._id,
      phase: 'Progress Report 1',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    submission.status = 'Declared Not Needed';
    submission.declarationReason = 'No project updates for this phase';
    submission.declaredAt = new Date();

    await submission.save();

    const retrieved = await Submission.findById(submission._id);
    expect(retrieved.status).toBe('Declared Not Needed');
    expect(retrieved.declarationReason).toBe('No project updates for this phase');
    expect(retrieved.declaredAt).toBeDefined();
  });
});
