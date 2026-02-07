const Topic = require('../../src/models/Topic');
const User = require('../../src/models/User');
const { hashPassword } = require('../../src/utils/password');

describe('Topic Model', () => {
  let supervisor;

  beforeEach(async () => {
    await User.deleteMany({});
    await Topic.deleteMany({});
    const passwordHash = await hashPassword('SupervisorPass123');
    supervisor = await User.create({
      email: 'supervisor@university.edu',
      passwordHash,
      fullName: 'Dr. Smith',
      role: 'Supervisor',
    });
  });

  test('should create topic with valid data', async () => {
    const topic = await Topic.create({
      title: 'Advanced Machine Learning',
      description: 'Study of deep learning and neural networks for classification tasks',
      supervisor_id: supervisor._id,
      concentration: 'AI/ML',
      keywords: ['ML', 'Deep Learning'],
    });

    expect(topic._id).toBeDefined();
    expect(topic.status).toBe('Draft');
    expect(topic.createdAt).toBeDefined();
  });

  test('should require title, description, concentration', async () => {
    const topic = new Topic({
      supervisor_id: supervisor._id,
    });

    await expect(topic.save()).rejects.toThrow();
  });

  test('should validate title length (minimum 5 characters)', async () => {
    const topic = new Topic({
      title: 'AI',
      description: 'This is a valid description with more than 50 characters for a topic',
      supervisor_id: supervisor._id,
      concentration: 'AI/ML',
    });

    await expect(topic.save()).rejects.toThrow();
  });

  test('should validate description length (minimum 50 characters)', async () => {
    const topic = new Topic({
      title: 'Valid Topic Title',
      description: 'Short',
      supervisor_id: supervisor._id,
      concentration: 'AI/ML',
    });

    await expect(topic.save()).rejects.toThrow();
  });

  test('should validate concentration enum', async () => {
    const topic = new Topic({
      title: 'Valid Topic Title',
      description: 'This is a valid description with more than 50 characters for validation',
      supervisor_id: supervisor._id,
      concentration: 'InvalidConcentration',
    });

    await expect(topic.save()).rejects.toThrow();
  });

  test('should validate keywords maximum count (10)', async () => {
    const topic = new Topic({
      title: 'Valid Topic Title',
      description: 'This is a valid description with more than 50 characters for testing',
      supervisor_id: supervisor._id,
      concentration: 'AI/ML',
      keywords: Array(11).fill('keyword'),
    });

    await expect(topic.save()).rejects.toThrow();
  });

  test('should allow valid status values', async () => {
    const topic = await Topic.create({
      title: 'Valid Topic Title',
      description: 'This is a valid description with more than 50 characters for validation',
      supervisor_id: supervisor._id,
      concentration: 'Systems',
      status: 'Active',
    });

    expect(topic.status).toBe('Active');
  });

  test('should set default status to Draft', async () => {
    const topic = await Topic.create({
      title: 'Valid Topic Title',
      description: 'This is a valid description with more than 50 characters for validation',
      supervisor_id: supervisor._id,
      concentration: 'Software Engineering',
    });

    expect(topic.status).toBe('Draft');
  });
});
