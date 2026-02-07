const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const ActivityLog = require('../../src/models/ActivityLog');
const { hashPassword } = require('../../src/utils/password');
const { generateTokens } = require('../../src/utils/jwt');

describe('Auth Integration Tests', () => {
  let testUser, testToken;

  beforeEach(async () => {
    await User.deleteMany({});
    await ActivityLog.deleteMany({});
    const hash = await hashPassword('TestPass123');
    testUser = await User.create({
      email: 'test@university.edu',
      passwordHash: hash,
      fullName: 'Test User',
      role: 'Student',
    });
    const result = generateTokens(testUser._id, 'Student');
    testToken = result.token;
  });

  test('full auth flow: login -> use token -> logout', async () => {
    // Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@university.edu',
        password: 'TestPass123',
      });

    expect(loginRes.status).toBe(200);
    const { token } = loginRes.body.data;
    expect(token).toBeDefined();

    // Use protected endpoint (health check is public, so we test logout which requires auth)
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.data.message).toContain('successfully');
  });

  test('password strength validation on reset', async () => {
    const res = await request(app)
      .post('/api/v1/auth/password-reset')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ newPassword: 'weak' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('WEAK_PASSWORD');
  });

  test('case-insensitive email login', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'TEST@UNIVERSITY.EDU',
        password: 'TestPass123',
      });

    expect(res.status).toBe(200);
  });

  test('deactivated user cannot login', async () => {
    testUser.deactivatedAt = new Date();
    await testUser.save();

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@university.edu',
        password: 'TestPass123',
      });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('ACCOUNT_DEACTIVATED');
  });

  test('admin can login with same flow', async () => {
    const adminHash = await hashPassword('AdminPass123');
    const admin = await User.create({
      email: 'admin@university.edu',
      passwordHash: adminHash,
      fullName: 'Admin User',
      role: 'Admin',
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@university.edu',
        password: 'AdminPass123',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('Admin');
  });

  test('supervisor can login with same flow', async () => {
    const supervisorHash = await hashPassword('SupervisorPass123');
    const supervisor = await User.create({
      email: 'supervisor@university.edu',
      passwordHash: supervisorHash,
      fullName: 'Supervisor User',
      role: 'Supervisor',
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'supervisor@university.edu',
        password: 'SupervisorPass123',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('Supervisor');
  });

  test('token can be refreshed multiple times', async () => {
    const refresh1 = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Authorization', `Bearer ${testToken}`);

    expect(refresh1.status).toBe(200);
    const newToken1 = refresh1.body.data.token;

    const refresh2 = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Authorization', `Bearer ${newToken1}`);

    expect(refresh2.status).toBe(200);
    const newToken2 = refresh2.body.data.token;

    expect(newToken1).not.toBe(testToken);
    expect(newToken2).not.toBe(newToken1);
  });

  test('password change prevents old password usage', async () => {
    // Change password
    await request(app)
      .post('/api/v1/auth/password-reset')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ newPassword: 'NewSecurePass123' });

    // Try to login with old password
    const oldPasswordRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@university.edu',
        password: 'TestPass123',
      });

    expect(oldPasswordRes.status).toBe(401);

    // Try to login with new password
    const newPasswordRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@university.edu',
        password: 'NewSecurePass123',
      });

    expect(newPasswordRes.status).toBe(200);
  });

  test('activity logging tracks all events', async () => {
    // Login
    await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@university.edu',
        password: 'TestPass123',
      });

    // Change password
    await request(app)
      .post('/api/v1/auth/password-reset')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ newPassword: 'NewSecurePass123' });

    // Logout
    await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${testToken}`);

    const logs = await ActivityLog.find({ user_id: testUser._id });
    const actions = logs.map(log => log.action);

    expect(actions).toContain('login');
    expect(actions).toContain('password_changed');
    expect(actions).toContain('logout');
  });
});
