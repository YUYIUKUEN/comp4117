const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');

const generateTokens = (userId, userRole) => {
  const nowMs = Date.now();
  const now = Math.floor(nowMs / 1000);
  const expiresIn = 24 * 60 * 60; // 24 hours
  // Add millisecond precision to ensure different tokens even within same second
  const jti = `${now}-${nowMs % 1000}`;

  const token = jwt.sign(
    {
      sub: userId.toString(),
      role: userRole,
      iat: now,
      exp: now + expiresIn,
      jti: jti,
    },
    jwtSecret,
    { algorithm: 'HS256' }
  );

  return {
    token,
    expiresIn,
    expiresAt: new Date(now * 1000 + expiresIn * 1000).toISOString(),
  };
};

const verifyToken = (token) => {
  return jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
};

const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = { generateTokens, verifyToken, decodeToken };
