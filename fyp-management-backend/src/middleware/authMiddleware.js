const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const mongoose = require('mongoose');

// Cache for demo user ID
let demoSupervisorId = null;

const getDemoSupervisorId = async () => {
  if (demoSupervisorId) return demoSupervisorId;
  
  try {
    // Find or create a demo supervisor
    let demoUser = await User.findOne({ email: 'demo.supervisor@university.edu' });
    
    if (!demoUser) {
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash('DemoPass123!', 10);
      demoUser = new User({
        email: 'demo.supervisor@university.edu',
        passwordHash,
        fullName: 'Dr. Test Supervisor',
        role: 'Supervisor',
      });
      await demoUser.save();
      console.log('Created demo supervisor user');
    }
    
    demoSupervisorId = demoUser._id.toString();
    return demoSupervisorId;
  } catch (error) {
    console.error('Error getting demo supervisor:', error);
    // Return a valid but fake ObjectId as last resort
    return new mongoose.Types.ObjectId().toString();
  }
};

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth middleware: Processing request');
    
    // First try to authenticate with token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = verifyToken(token);
        console.log('Token decoded, userId:', decoded.sub, 'role:', decoded.role);
        
        // Load user from database using the token's subject (user ID)
        const user = await User.findById(decoded.sub);
        if (user) {
          console.log('User found in DB:', user.email);
          req.user = user;
          req.auth = {
            userId: decoded.sub,
            role: user.role,
          };
          return next();
        } else {
          console.log('User NOT found for ID:', decoded.sub);
          return res.status(401).json({
            code: 'UNAUTHORIZED',
            message: 'User session expired. Please log in again.',
          });
        }
      } catch (tokenError) {
        console.error('Token verification error:', tokenError.message);
        return res.status(401).json({
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token. Please log in again.',
        });
      }
    }
    
    // Demo mode: Use supervisor@example.com if it exists, otherwise create one
    console.log('Using demo mode - looking for supervisor@example.com');
    
    let demoUser = await User.findOne({ email: 'supervisor@example.com' });
    
    if (!demoUser) {
      console.log('supervisor@example.com not found, trying demo.supervisor@university.edu');
      demoUser = await User.findOne({ email: 'demo.supervisor@university.edu' });
    }
    
    if (!demoUser) {
      console.log('No supervisor found, creating demo user');
      demoUser = await User.findById(await getDemoSupervisorId());
    }
    
    if (demoUser) {
      console.log('Demo user set:', demoUser.email);
      req.user = demoUser;
      req.auth = {
        userId: demoUser._id.toString(),
        role: 'Supervisor',
      };
    } else {
      console.error('ERROR: Could not find or create demo user');
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Could not authenticate',
      });
    }
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message, error.stack);
    return res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Authentication error: ' + error.message,
    });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    const userRole = req.auth?.role || req.user?.role;
    const normalizedRoles = roles.map(r => r.toLowerCase());
    if (!userRole || !normalizedRoles.includes(userRole.toLowerCase())) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        error: `Access denied. Required role(s): ${roles.join(', ')}`,
      });
    }
    next();
  };
};

module.exports = { authenticate, requireRole };
