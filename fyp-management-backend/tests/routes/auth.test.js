const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const ActivityLog = require('../../src/models/ActivityLog');
const { hashPassword } = require('../../src/utils/password');
const { generateTokens } = require('../../src/utils/jwt');

describe('POST /api/v1/auth/login', () => {
  let testUser;

  beforeEach(async () => {
    await User.deleteMany({});
    await ActivityLog.deleteMany({});
    const hash = await hashPassword('TestPass123');
    testUser = await User.create({
      email: 'student@university.edu',
      passwordHash: hash,
      fullName: 'Test Student',
      role: 'Student',
    });
  });

  test('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'student@university.edu',
        password: 'TestPass123',
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toBe('student@university.edu');
    expect(res.body.data.user.role).toBe('Student');
    expect(res.body.data).toHaveProperty('expiresIn');
    expect(res.body.data).toHaveProperty('expiresAt');
  });

  test('should reject invalid password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'student@university.edu',
        password: 'WrongPass123',
      });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('AUTH_FAILED');
    expect(res.body.error).toContain('Invalid');
  });

  test('should reject non-existent email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'nonexistent@university.edu',
        password: 'TestPass123',
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Invalid');
  });

  test('should require email and password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student@university.edu' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_INPUT');
  });

  test('should be case-insensitive for email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'STUDENT@UNIVERSITY.EDU',
        password: 'TestPass123',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('student@university.edu');
  });

  test('should reject deactivated accounts', async () => {
    testUser.deactivatedAt = new Date();
    await testUser.save();

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'student@university.edu',
        password: 'TestPass123',
      });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('ACCOUNT_DEACTIVATED');
  });

  test('should log successful login to ActivityLog', async () => {
    await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'student@university.edu',
        password: 'TestPass123',
      });

    const logs = await ActivityLog.find({ action: 'login' });
    expect(logs).toHaveLength(1);
    expect(logs[0].user_id.toString()).toBe(testUser._id.toString());
  });

  test('should log failed login attempt', async () => {
    await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'student@university.edu',
        password: 'WrongPass123',
      });

    const logs = await ActivityLog.find({ action: 'login_failed' });
    expect(logs).toHaveLength(1);
  });
});

describe('POST /api/v1/auth/logout', () => {
  let testUser, testToken;

  beforeEach(async () => {
    await User.deleteMany({});
    await ActivityLog.deleteMany({});
    const hash = await hashPassword('TestPass123');
    testUser = await User.create({
      email: 'student@university.edu',
      passwordHash: hash,
      fullName: 'Test Student',
      role: 'Student',
    });
    const result = generateTokens(testUser._id, 'Student');
    testToken = result.token;
  });

  test('should logout with valid token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.message).toContain('successfully');
  });

  test('should reject logout without token', async () => {
    const res = await request(app).post('/api/v1/auth/logout');

    expect(res.status).toBe(401);
  });

  test('should log logout action', async () => {
    await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${testToken}`);

    const logs = await ActivityLog.find({ action: 'logout' });
    expect(logs).toHaveLength(1);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  let testUser, testToken;

  beforeEach(async () => {
    await User.deleteMany({});
    const hash = await hashPassword('TestPass123');
    testUser = await User.create({
      email: 'student@university.edu',
      passwordHash: hash,
      fullName: 'Test Student',
      role: 'Student',
    });
    const result = generateTokens(testUser._id, 'Student');
    testToken = result.token;
  });

  test('should issue new token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.token).not.toBe(testToken);
    expect(res.body.data).toHaveProperty('expiresIn');
    expect(res.body.data).toHaveProperty('expiresAt');
  });

  test('should reject without token', async () => {
    const res = await request(app).post('/api/v1/auth/refresh');

    expect(res.status).toBe(401);
  });

  test('should reject for deactivated user', async () => {
    testUser.deactivatedAt = new Date();
    await testUser.save();

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/password-reset-request', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await ActivityLog.deleteMany({});
    const hash = await hashPassword('TestPass123');
    await User.create({
      email: 'student@university.edu',
      passwordHash: hash,
      fullName: 'Test Student',
      role: 'Student',
    });
  });

  test('should accept email for reset request', async () => {
    const res = await request(app)
      .post('/api/v1/auth/password-reset-request')
      .send({ email: 'student@university.edu' });

    expect(res.status).toBe(200);
    expect(res.body.data.message).toContain('email sent');
  });

  test('should not reveal if user exists', async () => {
    const res = await request(app)
      .post('/api/v1/auth/password-reset-request')
      .send({ email: 'nonexistent@university.edu' });

    expect(res.status).toBe(200);
    expect(res.body.data.message).toContain('email sent');
  });
});

describe('POST /api/v1/auth/password-reset', () => {
  let testUser, testToken;

  beforeEach(async () => {
    await User.deleteMany({});
    await ActivityLog.deleteMany({});
    const hash = await hashPassword('TestPass123');
    testUser = await User.create({
      email: 'student@university.edu',
      passwordHash: hash,
      fullName: 'Test Student',
      role: 'Student',
    });
    const result = generateTokens(testUser._id, 'Student');
    testToken = result.token;
  });

  test('should change password with valid new password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/password-reset')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ newPassword: 'NewSecurePass123' });

    expect(res.status).toBe(200);
    expect(res.body.data.message).toContain('successfully');

    // Verify new password works for login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'student@university.edu',
        password: 'NewSecurePass123',
      });

    expect(loginRes.status).toBe(200);
  });

  test('should reject weak passwords', async () => {
    const res = await request(app)
      .post('/api/v1/auth/password-reset')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ newPassword: 'weak' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('WEAK_PASSWORD');
  });

  test('should log password change', async () => {
    await request(app)
      .post('/api/v1/auth/password-reset')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ newPassword: 'NewSecurePass123' });

    const logs = await ActivityLog.find({ action: 'password_changed' });
    expect(logs).toHaveLength(1);
  });

  test('should require authentication', async () => {
    const res = await request(app)
      .post('/api/v1/auth/password-reset')
      .send({ newPassword: 'NewSecurePass123' });

    expect(res.status).toBe(401);
  });
});
