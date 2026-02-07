const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const mongoose = require('mongoose');
const { generateTokens } = require('../../src/utils/jwt');
const bcrypt = require('bcryptjs');

const createPasswordHash = async () => {
  return await bcrypt.hash('test-password-123', 10);
};

describe('Health Check Routes', () => {
  let admin, adminToken, passwordHash;

  beforeEach(async () => {
    await User.deleteMany({});

    passwordHash = await createPasswordHash();

    admin = await User.create({
      email: 'admin@university.edu',
      passwordHash,
      fullName: 'Administrator',
      role: 'Admin',
    });

    adminToken = generateTokens(admin._id, 'Admin').token;
  });

  describe('GET /api/v1/health/check', () => {
    test('should not require authentication', async () => {
      const res = await request(app).get('/api/v1/health/check');
      expect(res.status).toBe(200);
    });

    test('should return health status', async () => {
      const res = await request(app).get('/api/v1/health/check');

      expect(res.status).toBe(200);
      expect(res.body.status).toBeDefined();
      expect(res.body.timestamp).toBeDefined();
    });

    test('should return ok status when healthy', async () => {
      const res = await request(app).get('/api/v1/health/check');

      expect(res.status).toBe(200);
      expect(['ok', 'degraded']).toContain(res.body.status);
    });
  });

  describe('GET /api/v1/health', () => {
    test('should require authentication', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(401);
    });

    test('should require admin role', async () => {
      const studentToken = generateTokens(new mongoose.Types.ObjectId(), 'Student').token;

      const res = await request(app)
        .get('/api/v1/health')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    test('should return detailed health information', async () => {
      const res = await request(app)
        .get('/api/v1/health')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('timestamp');
      expect(res.body.data).toHaveProperty('status');
      expect(res.body.data).toHaveProperty('database');
      expect(res.body.data).toHaveProperty('memory');
      expect(res.body.data).toHaveProperty('uptime');
      expect(res.body.data).toHaveProperty('nodeVersion');
      expect(res.body.data).toHaveProperty('platform');
    });

    test('should include database connection status', async () => {
      const res = await request(app)
        .get('/api/v1/health')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.database).toHaveProperty('connected');
      expect(res.body.data.database).toHaveProperty('message');
    });

    test('should include memory usage', async () => {
      const res = await request(app)
        .get('/api/v1/health')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.memory).toHaveProperty('heapUsed');
      expect(res.body.data.memory).toHaveProperty('heapTotal');
      expect(typeof res.body.data.memory.heapUsed).toBe('number');
    });

    test('should include process uptime', async () => {
      const res = await request(app)
        .get('/api/v1/health')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(typeof res.body.data.uptime).toBe('number');
      expect(res.body.data.uptime).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/health/database', () => {
    test('should require admin role', async () => {
      const studentToken = generateTokens(new mongoose.Types.ObjectId(), 'Student').token;

      const res = await request(app)
        .get('/api/v1/health/database')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    test('should return database statistics', async () => {
      const res = await request(app)
        .get('/api/v1/health/database')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('timestamp');
    });

    test('should have graceful fallback', async () => {
      const res = await request(app)
        .get('/api/v1/health/database')
        .set('Authorization', `Bearer ${adminToken}`);

      // Should not throw error, just return 200 with partial data
      expect([200]).toContain(res.status);
    });
  });
});
