const { authenticate, requireRole } = require('../../src/middleware/authMiddleware');
const { generateTokens } = require('../../src/utils/jwt');

describe('Authentication Middleware', () => {
  test('authenticate should extract userId and role from valid token', () => {
    const { token } = generateTokens('user123', 'Student');
    const req = {
      headers: { authorization: `Bearer ${token}` },
    };
    const res = {};
    const next = jest.fn();

    authenticate(req, res, next);

    expect(req.auth).toEqual({ userId: 'user123', role: 'Student' });
    expect(next).toHaveBeenCalled();
  });

  test('authenticate should reject missing authorization header', () => {
    const req = { headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(String),
        code: 'NO_AUTH',
        status: 401,
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('authenticate should reject malformed authorization header', () => {
    const req = { headers: { authorization: 'InvalidHeader token' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('authenticate should reject invalid token', () => {
    const req = { headers: { authorization: 'Bearer invalid.token.here' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'INVALID_TOKEN',
      })
    );
  });

  test('requireRole should allow authorized roles', () => {
    const req = { auth: { role: 'Student' } };
    const res = {};
    const next = jest.fn();

    const middleware = requireRole('Student', 'Supervisor');
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('requireRole should reject unauthorized roles', () => {
    const req = { auth: { role: 'Student' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    const middleware = requireRole('Admin');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'FORBIDDEN',
        status: 403,
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('requireRole should reject when auth not set', () => {
    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    const middleware = requireRole('Admin');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
