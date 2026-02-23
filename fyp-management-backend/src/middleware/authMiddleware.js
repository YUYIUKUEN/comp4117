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
    // DEMO MODE: Allow all requests without authentication
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = verifyToken(token);
        req.auth = {
          userId: decoded.sub,
          role: decoded.role,
        };
        return next();
      } catch (tokenError) {
        // Token invalid, fall through to demo mode
      }
    }
    
    // Use demo supervisor for demo mode
    const demoId = await getDemoSupervisorId();
    req.auth = {
      userId: demoId,
      role: 'Supervisor',
    };
    next();
  } catch (error) {
    // DEMO MODE: Even on errors, try to allow access
    req.auth = {
      userId: new mongoose.Types.ObjectId().toString(),
      role: 'Supervisor',
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
