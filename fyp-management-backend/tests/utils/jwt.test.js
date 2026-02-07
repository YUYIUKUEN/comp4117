const { generateTokens, verifyToken, decodeToken } = require('../../src/utils/jwt');

describe('JWT Utils', () => {
  test('generateTokens should create valid token', () => {
    const userId = '507f1f77bcf86cd799439011';
    const userRole = 'Student';
    const result = generateTokens(userId, userRole);

    expect(result).toHaveProperty('token');
    expect(result).toHaveProperty('expiresIn');
    expect(result).toHaveProperty('expiresAt');
    expect(result.expiresIn).toBe(24 * 60 * 60);
  });

  test('verifyToken should decode valid token', () => {
    const userId = '507f1f77bcf86cd799439011';
    const { token } = generateTokens(userId, 'Student');
    const decoded = verifyToken(token);

    expect(decoded.sub).toBe(userId);
    expect(decoded.role).toBe('Student');
  });

  test('verifyToken should reject invalid token', () => {
    const invalidToken = 'invalid.token.here';
    expect(() => verifyToken(invalidToken)).toThrow();
  });

  test('decodeToken should decode without verification', () => {
    const userId = '507f1f77bcf86cd799439011';
    const { token } = generateTokens(userId, 'Student');
    const decoded = decodeToken(token);

    expect(decoded.sub).toBe(userId);
  });

  test('token should have iat and exp claims', () => {
    const { token } = generateTokens('user123', 'Admin');
    const decoded = decodeToken(token);
    
    expect(decoded).toHaveProperty('iat');
    expect(decoded).toHaveProperty('exp');
    expect(decoded.exp - decoded.iat).toBe(24 * 60 * 60);
  });
});
