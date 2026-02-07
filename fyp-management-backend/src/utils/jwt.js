const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');

const generateTokens = (userId, userRole) => {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 24 * 60 * 60; // 24 hours

  const token = jwt.sign(
    {
      sub: userId.toString(),
      role: userRole,
      iat: now,
      exp: now + expiresIn,
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
