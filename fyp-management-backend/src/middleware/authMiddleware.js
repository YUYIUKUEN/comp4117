const { verifyToken } = require('../utils/jwt');

const authenticate = (req, res, next) => {
  try {
    // DEMO MODE: Allow all requests without authentication
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      req.auth = {
        userId: decoded.sub,
        role: decoded.role,
      };
    } else {
      // Use demo user for demo mode
      req.auth = {
        userId: 'demo-user-123',
        role: 'Admin',
      };
    }
    next();
  } catch (error) {
    // DEMO MODE: Even on token errors, allow access with demo user
    req.auth = {
      userId: 'demo-user-123',
      role: 'Admin',
    };
    next();
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    // DEMO MODE: Allow all roles
    next();
  };
};

module.exports = { authenticate, requireRole };
