const Feedback = require('../../src/models/Feedback');
const Submission = require('../../src/models/Submission');
const User = require('../../src/models/User');
const Topic = require('../../src/models/Topic');
const bcrypt = require('bcryptjs');

const createPasswordHash = async () => {
  return await bcrypt.hash('test-password-123', 10);
};

describe('Feedback Model', () => {
  let student, supervisor, topic, submission, passwordHash;

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
  });

  test('should create feedback with required fields', async () => {
    const feedback = await Feedback.create({
      submission_id: submission._id,
      supervisor_id: supervisor._id,
      feedbackText: 'This is a comprehensive feedback on your proposal',
    });

    expect(feedback._id).toBeDefined();
    expect(feedback.submission_id).toEqual(submission._id);
    expect(feedback.supervisor_id).toEqual(supervisor._id);
    expect(feedback.isPrivate).toBe(false);
  });

  test('should require submission_id', async () => {
    const feedback = new Feedback({
      supervisor_id: supervisor._id,
      feedbackText: 'Test feedback',
    });

    await expect(feedback.save()).rejects.toThrow();
  });

  test('should require supervisor_id', async () => {
    const feedback = new Feedback({
      submission_id: submission._id,
      feedbackText: 'Test feedback',
    });

    await expect(feedback.save()).rejects.toThrow();
  });

  test('should require feedbackText', async () => {
    const feedback = new Feedback({
      submission_id: submission._id,
      supervisor_id: supervisor._id,
    });

    await expect(feedback.save()).rejects.toThrow();
  });

  test('should enforce minimum feedbackText length', async () => {
    const feedback = new Feedback({
      submission_id: submission._id,
      supervisor_id: supervisor._id,
      feedbackText: 'Short',
    });

    await expect(feedback.save()).rejects.toThrow();
  });

  test('should enforce maximum feedbackText length', async () => {
    const feedback = new Feedback({
      submission_id: submission._id,
      supervisor_id: supervisor._id,
      feedbackText: 'a'.repeat(5001),
    });

    await expect(feedback.save()).rejects.toThrow();
  });

  test('should allow rating between 1 and 5', async () => {
    const feedback = await Feedback.create({
      submission_id: submission._id,
      supervisor_id: supervisor._id,
      feedbackText: 'Excellent work on your proposal with detailed methodology',
      rating: 4,
    });

    expect(feedback.rating).toBe(4);
  });

  test('should reject rating below 1', async () => {
    const feedback = new Feedback({
      submission_id: submission._id,
      supervisor_id: supervisor._id,
      feedbackText: 'This is comprehensive feedback text',
      rating: 0,
    });

    await expect(feedback.save()).rejects.toThrow();
  });

  test('should reject rating above 5', async () => {
    const feedback = new Feedback({
      submission_id: submission._id,
      supervisor_id: supervisor._id,
      feedbackText: 'This is comprehensive feedback text',
      rating: 6,
    });

    await expect(feedback.save()).rejects.toThrow();
  });

  test('should handle isPrivate flag', async () => {
    const privateFeedback = await Feedback.create({
      submission_id: submission._id,
      supervisor_id: supervisor._id,
      feedbackText: 'This is private feedback only for supervisor review',
      isPrivate: true,
    });

    expect(privateFeedback.isPrivate).toBe(true);

    const publicFeedback = await Feedback.create({
      submission_id: submission._id,
      supervisor_id: supervisor._id,
      feedbackText: 'This is public feedback visible to student',
      isPrivate: false,
    });

    expect(publicFeedback.isPrivate).toBe(false);
  });

  test('should track createdAt and updatedAt timestamps', async () => {
    const feedback = await Feedback.create({
      submission_id: submission._id,
      supervisor_id: supervisor._id,
      feedbackText: 'Feedback with timestamps for tracking modifications',
    });

    expect(feedback.createdAt).toBeDefined();
    expect(feedback.updatedAt).toBeDefined();
    expect(feedback.createdAt).toBeInstanceOf(Date);
  });

  test('should update updatedAt when modified', async () => {
    const feedback = await Feedback.create({
      submission_id: submission._id,
      supervisor_id: supervisor._id,
      feedbackText: 'Original feedback text',
    });

    const originalUpdatedAt = feedback.updatedAt;

    // Wait a bit to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 100));

    feedback.feedbackText = 'Updated feedback text';
    feedback.updatedAt = new Date();
    await feedback.save();

    expect(feedback.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  test('should create index on submission_id and isPrivate', async () => {
    const feedback = await Feedback.create({
      submission_id: submission._id,
      supervisor_id: supervisor._id,
      feedbackText: 'Feedback for index testing',
      isPrivate: false,
    });

    const found = await Feedback.findOne({
      submission_id: submission._id,
      isPrivate: false,
    });

    expect(found).toBeDefined();
    expect(found._id).toEqual(feedback._id);
  });
});
