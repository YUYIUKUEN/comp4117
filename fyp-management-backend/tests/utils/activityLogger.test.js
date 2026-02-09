const { logActivity, logBatchActivity, LOG_ACTIONS } = require('../../src/utils/activityLogger');
const ActivityLog = require('../../src/models/ActivityLog');
const User = require('../../src/models/User');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const createPasswordHash = async () => {
  return await bcrypt.hash('test-password-123', 10);
};

describe('Activity Logger Utils', () => {
  let user, passwordHash;

  beforeEach(async () => {
    await ActivityLog.deleteMany({});
    await User.deleteMany({});
    
    passwordHash = await createPasswordHash();

    user = await User.create({
      email: 'test@university.edu',
      passwordHash,
      fullName: 'Test User',
      role: 'Student',
    });
  });

  describe('LOG_ACTIONS', () => {
    test('should have all standard action types defined', () => {
      expect(LOG_ACTIONS.LOGIN).toBe('login');
      expect(LOG_ACTIONS.LOGOUT).toBe('logout');
      expect(LOG_ACTIONS.TOPIC_CREATED).toBe('topic_created');
      expect(LOG_ACTIONS.FEEDBACK_ADDED).toBe('feedback_added');
      expect(LOG_ACTIONS.APPLICATION_SUBMITTED).toBe('application_submitted');
    });
  });

  describe('logActivity', () => {
    test('should create activity log entry with required fields', async () => {
      const log = await logActivity(user._id, LOG_ACTIONS.LOGIN, 'User', user._id);

      expect(log).toBeDefined();
      expect(log.user_id.toString()).toBe(user._id.toString());
      expect(log.action).toBe(LOG_ACTIONS.LOGIN);
      expect(log.entityType).toBe('User');
      expect(log.entityId.toString()).toBe(user._id.toString());
    });

    test('should include details when provided', async () => {
      const details = { loginMethod: 'email', ipRegion: 'USA' };
      const log = await logActivity(user._id, LOG_ACTIONS.LOGIN, 'User', user._id, {
        details,
      });

      expect(log.details).toEqual(details);
    });

    test('should include ipAddress when provided', async () => {
      const log = await logActivity(user._id, LOG_ACTIONS.LOGIN, 'User', user._id, {
        ipAddress: '192.168.1.1',
      });

      expect(log.ipAddress).toBe('192.168.1.1');
    });

    test('should set timestamp automatically', async () => {
      const beforeCreate = new Date();
      const log = await logActivity(user._id, LOG_ACTIONS.LOGIN, 'User', user._id);
      const afterCreate = new Date();

      expect(log.timestamp).toBeDefined();
      expect(log.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(log.timestamp.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    test('should handle missing required fields gracefully', async () => {
      const log = await logActivity(null, LOG_ACTIONS.LOGIN, 'User', user._id);
      expect(log).toBeNull();
    });

    test('should log various action types', async () => {
      const actions = [LOG_ACTIONS.TOPIC_CREATED, LOG_ACTIONS.FEEDBACK_ADDED, LOG_ACTIONS.APPLICATION_SUBMITTED];

      for (const action of actions) {
        const log = await logActivity(user._id, action, 'Entity', 'entity123');
        expect(log).toBeDefined();
        expect(log.action).toBe(action);
      }
    });
  });

  describe('logBatchActivity', () => {
    test('should create multiple activity log entries', async () => {
      const actions = [
        { action: LOG_ACTIONS.LOGIN, entityType: 'User', entityId: user._id },
        { action: LOG_ACTIONS.TOPIC_CREATED, entityType: 'Topic', entityId: new mongoose.Types.ObjectId() },
        { action: LOG_ACTIONS.FEEDBACK_ADDED, entityType: 'Feedback', entityId: new mongoose.Types.ObjectId() },
      ];

      const logs = await logBatchActivity(user._id, actions);

      expect(logs).toHaveLength(3);
      expect(logs[0].action).toBe(LOG_ACTIONS.LOGIN);
      expect(logs[1].action).toBe(LOG_ACTIONS.TOPIC_CREATED);
      expect(logs[2].action).toBe(LOG_ACTIONS.FEEDBACK_ADDED);
    });

    test('should include ipAddress for all batch entries', async () => {
      const actions = [
        { action: LOG_ACTIONS.LOGIN, entityType: 'User', entityId: user._id },
        { action: LOG_ACTIONS.LOGOUT, entityType: 'User', entityId: user._id },
      ];

      const logs = await logBatchActivity(user._id, actions, { ipAddress: '10.0.0.1' });

      logs.forEach(log => {
        expect(log.ipAddress).toBe('10.0.0.1');
      });
    });

    test('should include details in batch entries', async () => {
      const actions = [
        { action: LOG_ACTIONS.TOPIC_CREATED, entityType: 'Topic', entityId: new mongoose.Types.ObjectId(), details: { title: 'Topic 1' } },
        { action: LOG_ACTIONS.TOPIC_CREATED, entityType: 'Topic', entityId: new mongoose.Types.ObjectId(), details: { title: 'Topic 2' } },
      ];

      const logs = await logBatchActivity(user._id, actions);

      expect(logs[0].details.title).toBe('Topic 1');
      expect(logs[1].details.title).toBe('Topic 2');
    });

    test('should handle empty action array', async () => {
      const logs = await logBatchActivity(user._id, []);
      expect(logs).toEqual([]);
    });

    test('should handle invalid input gracefully', async () => {
      const logs = await logBatchActivity(user._id, null);
      expect(logs).toEqual([]);
    });

    test('should create logs with sequential timestamps', async () => {
      const actions = [
        { action: LOG_ACTIONS.LOGIN, entityType: 'User', entityId: user._id },
        { action: LOG_ACTIONS.TOPIC_CREATED, entityType: 'Topic', entityId: new mongoose.Types.ObjectId() },
      ];

      const logs = await logBatchActivity(user._id, actions);

      expect(logs[0].timestamp.getTime()).toBeLessThanOrEqual(logs[1].timestamp.getTime());
    });
  });

  describe('Activity log immutability', () => {
    test('should not allow updating createdAt timestamp', async () => {
      const log = await logActivity(user._id, LOG_ACTIONS.LOGIN, 'User', user._id);
      const originalCreatedAt = log.createdAt;

      const updated = await ActivityLog.findByIdAndUpdate(log._id, { createdAt: new Date() }, { new: true });

      expect(updated.createdAt).toEqual(originalCreatedAt);
    });
  });
});
