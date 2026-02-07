---
work_package_id: "WP01"
title: "Backend Foundation & Database"
lane: "for_review"
dependencies: []
subtasks: ["T001", "T002", "T003", "T004", "T005"]
created_at: "2026-02-02"
agent: "GitHub Copilot"
shell_pid: "15740"
---

# WP01: Backend Foundation & Database

**Objective**: Establish Express.js project structure, MongoDB connection, foundational middleware, and database schema setup. This is the critical foundation for all backend development.

**Scope**: Project initialization, dependencies, database configuration, core middleware, schema definitions, and initial seeding.

**Success Criteria**:
- Backend server starts on port 5000 without errors
- MongoDB connection established and verified
- All core schemas created in MongoDB
- Health check endpoint returns 200
- Admin user seeded and can authenticate
- All requests follow standard error response format

**Estimated Effort**: 5-7 days (backend developer)

---

## Subtask T001: Initialize Express.js Project with Dependencies

**Purpose**: Set up the Node.js/Express project structure with all required dependencies.

**Files to Create/Modify**:
- `fyp-management-backend/` (new repository)
- `package.json`
- `.gitignore`
- `src/app.js`
- `src/index.js` (entry point)

**Steps**:

1. Create backend project directory and initialize npm:
   ```bash
   mkdir fyp-management-backend
   cd fyp-management-backend
   npm init -y
   ```

2. Install dependencies:
   ```bash
   npm install express mongoose dotenv bcryptjs jsonwebtoken cors express-json-validator-middleware
   npm install --save-dev nodemon jest supertest @types/jest eslint prettier
   ```

3. Create `.env.example`:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/fyp_management
   JWT_SECRET=your-secret-key-min-32-chars
   JWT_EXPIRY=24h
   FRONTEND_URL=http://localhost:5173
   LOG_LEVEL=debug
   ```

4. Create project structure:
   ```
   src/
   ├── app.js (Express app initialization)
   ├── index.js (server startup)
   ├── config/ (configuration files)
   ├── middleware/ (auth, error handler, logging)
   ├── models/ (Mongoose schemas)
   ├── routes/ (API routes)
   ├── controllers/ (business logic)
   ├── services/ (reusable services)
   ├── utils/ (helpers, constants)
   └── tests/ (test files)
   ```

5. Create `src/index.js`:
   ```javascript
   const app = require('./app');
   const PORT = process.env.PORT || 5000;
   app.listen(PORT, () => {
     console.log(`Server running on http://localhost:${PORT}`);
   });
   ```

6. Create `package.json` scripts:
   ```json
   "scripts": {
     "dev": "nodemon src/index.js",
     "start": "node src/index.js",
     "test": "jest --detectOpenHandles",
     "test:watch": "jest --watch",
     "lint": "eslint src/",
     "format": "prettier --write src/"
   }
   ```

7. Initialize ESLint and Prettier:
   - Create `.eslintrc.js` with recommended Node.js rules
   - Create `.prettierrc` with standard formatting

**Validation Checklist**:
- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts server (will fail on DB connection, that's OK)
- [ ] Project structure created as specified
- [ ] ESLint and Prettier configured

**Edge Cases**:
- Node version incompatibility: verify Node.js 18+
- npm lockfile conflicts: delete package-lock.json and reinstall if needed

---

## Subtask T002: Configure MongoDB Connection with Mongoose

**Purpose**: Establish MongoDB connection with proper error handling and connection pooling.

**Files to Create**:
- `src/config/database.js`
- `src/config/env.js` (environment variables)

**Steps**:

1. Create `src/config/env.js` for environment variable validation:
   ```javascript
   const required = ['MONGODB_URI', 'JWT_SECRET', 'PORT'];
   required.forEach(env => {
     if (!process.env[env]) {
       throw new Error(`Missing required environment variable: ${env}`);
     }
   });
   
   module.exports = {
     mongoUri: process.env.MONGODB_URI,
     jwtSecret: process.env.JWT_SECRET,
     port: process.env.PORT || 5000,
     env: process.env.NODE_ENV || 'development',
   };
   ```

2. Create `src/config/database.js` with Mongoose connection:
   ```javascript
   const mongoose = require('mongoose');
   const { mongoUri } = require('./env');
   
   const connectDB = async () => {
     try {
       await mongoose.connect(mongoUri, {
         maxPoolSize: 20,
         minPoolSize: 5,
         socketTimeoutMS: 45000,
       });
       console.log('✓ MongoDB connected:', mongoUri);
     } catch (error) {
       console.error('✗ MongoDB connection failed:', error.message);
       process.exit(1);
     }
   };
   
   mongoose.connection.on('error', (err) => {
     console.error('MongoDB connection error:', err);
   });
   
   module.exports = connectDB;
   ```

3. Update `src/app.js` to connect database on startup:
   ```javascript
   const connectDB = require('./config/database');
   
   // Call after creating Express app
   connectDB();
   ```

4. Test MongoDB connection:
   - Create `tests/config/database.test.js`:
   ```javascript
   describe('Database Connection', () => {
     test('should connect to MongoDB', async () => {
       const connection = mongoose.connection;
       expect(connection.readyState).toBe(1); // 1 = connected
     });
   });
   ```

**Validation Checklist**:
- [ ] Server starts and logs "✓ MongoDB connected"
- [ ] Invalid connection string logs error and exits gracefully
- [ ] Connection pool configured (20 max, 5 min)
- [ ] Test passes (connection readyState === 1)

**Edge Cases**:
- MongoDB not running: Server fails with clear error message
- Invalid connection string: Caught and logged
- Connection timeout: Handled with timeout parameters
- Network issues: Connection retry with exponential backoff (future enhancement)

---

## Subtask T003: Create Base Middleware (CORS, Body Parser, Error Handler, Logging)

**Purpose**: Set up foundational middleware for request handling, logging, and error responses.

**Files to Create**:
- `src/middleware/cors.js`
- `src/middleware/errorHandler.js`
- `src/middleware/logging.js`
- `src/app.js` (main Express configuration)

**Steps**:

1. Create `src/middleware/cors.js`:
   ```javascript
   const cors = require('cors');
   
   module.exports = cors({
     origin: process.env.FRONTEND_URL || 'http://localhost:5173',
     credentials: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE'],
     allowedHeaders: ['Content-Type', 'Authorization'],
   });
   ```

2. Create `src/middleware/errorHandler.js` (last middleware):
   ```javascript
   module.exports = (err, req, res, next) => {
     const status = err.status || 500;
     const code = err.code || 'INTERNAL_ERROR';
     const message = err.message || 'Internal server error';
     
     console.error(`[${status}] ${code}: ${message}`);
     
     res.status(status).json({
       error: message,
       code,
       status,
     });
   };
   ```

3. Create `src/middleware/logging.js`:
   ```javascript
   module.exports = (req, res, next) => {
     const start = Date.now();
     res.on('finish', () => {
       const duration = Date.now() - start;
       console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
     });
     next();
   };
   ```

4. Update `src/app.js` with middleware setup:
   ```javascript
   const express = require('express');
   const corsMiddleware = require('./middleware/cors');
   const loggingMiddleware = require('./middleware/logging');
   const errorHandler = require('./middleware/errorHandler');
   
   const app = express();
   
   // Middleware order matters!
   app.use(corsMiddleware);
   app.use(express.json({ limit: '50mb' }));
   app.use(express.urlencoded({ limit: '50mb', extended: true }));
   app.use(loggingMiddleware);
   
   // Routes will be added here
   app.get('/api/v1/health', (req, res) => {
     res.json({ status: 'ok' });
   });
   
   // Error handler MUST be last
   app.use(errorHandler);
   
   module.exports = app;
   ```

**Validation Checklist**:
- [ ] CORS allows frontend requests from configured URL
- [ ] Body parser handles JSON up to 50MB
- [ ] Health check endpoint returns `{ status: 'ok' }`
- [ ] Error responses formatted as `{ error, code, status }`
- [ ] Request logging shows method, path, status, duration
- [ ] Middleware order correct (CORS first, error handler last)

**Edge Cases**:
- CORS origin mismatch: request blocked
- Oversized payload: rejected with 413 error
- Missing Content-Type header: handled gracefully
- Invalid JSON: returns 400 with error message

---

## Subtask T004: Define Core Mongoose Schemas (User, Topic, Application, Assignment, Submission, Feedback, ActivityLog)

**Purpose**: Create Mongoose schema definitions for all data entities with validation rules.

**Files to Create**:
- `src/models/User.js`
- `src/models/Topic.js`
- `src/models/Application.js`
- `src/models/Assignment.js`
- `src/models/Submission.js`
- `src/models/Feedback.js`
- `src/models/ActivityLog.js`
- `src/models/index.js` (export all models)

**Steps**:

1. Create `src/models/User.js`:
   ```javascript
   const mongoose = require('mongoose');
   const bcrypt = require('bcryptjs');
   
   const userSchema = new mongoose.Schema({
     email: { type: String, required: true, unique: true, lowercase: true },
     passwordHash: { type: String, required: true, minlength: 60 },
     fullName: { type: String, required: true, maxlength: 255 },
     role: { type: String, enum: ['Student', 'Supervisor', 'Admin'], required: true },
     concentration: String,
     phone: String,
     officeHours: String,
     createdAt: { type: Date, default: Date.now },
     updatedAt: { type: Date, default: Date.now },
     deactivatedAt: Date,
   });
   
   userSchema.index({ email: 1 }, { unique: true });
   userSchema.index({ role: 1 });
   
   module.exports = mongoose.model('User', userSchema);
   ```

2. Create `src/models/Topic.js`:
   ```javascript
   const mongoose = require('mongoose');
   
   const topicSchema = new mongoose.Schema({
     title: { type: String, required: true, maxlength: 255 },
     description: { type: String, required: true, maxlength: 5000 },
     supervisor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
     concentration: { type: String, required: true },
     academicYear: { type: Number, min: 1, max: 6 },
     keywords: [String],
     referenceDocuments: [{ name: String, url: String }],
     status: { type: String, enum: ['Draft', 'Active', 'Archived'], default: 'Active' },
     createdAt: { type: Date, default: Date.now },
     updatedAt: { type: Date, default: Date.now },
   });
   
   topicSchema.index({ supervisor_id: 1 });
   topicSchema.index({ concentration: 1 });
   topicSchema.index({ status: 1 });
   
   module.exports = mongoose.model('Topic', topicSchema);
   ```

3. Create `src/models/Application.js`:
   ```javascript
   const mongoose = require('mongoose');
   
   const applicationSchema = new mongoose.Schema({
     student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
     topic_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
     preference_rank: { type: Number, min: 1, max: 5 },
     status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
     supervisorNotes: { type: String, maxlength: 1000 },
     appliedAt: { type: Date, default: Date.now },
     decidedAt: Date,
     createdAt: { type: Date, default: Date.now },
     updatedAt: { type: Date, default: Date.now },
   });
   
   applicationSchema.index({ student_id: 1, topic_id: 1 }, { unique: true });
   applicationSchema.index({ status: 1 });
   
   module.exports = mongoose.model('Application', applicationSchema);
   ```

4. Create `src/models/Assignment.js`:
   ```javascript
   const mongoose = require('mongoose');
   
   const assignmentSchema = new mongoose.Schema({
     student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
     topic_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
     supervisor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
     assigned_at: { type: Date, default: Date.now },
     status: { type: String, enum: ['Active', 'Completed', 'Changed'], default: 'Active' },
     createdAt: { type: Date, default: Date.now },
     updatedAt: { type: Date, default: Date.now },
   });
   
   assignmentSchema.index({ student_id: 1 });
   assignmentSchema.index({ supervisor_id: 1 });
   assignmentSchema.index({ status: 1 });
   
   module.exports = mongoose.model('Assignment', assignmentSchema);
   ```

5. Create `src/models/Submission.js`:
   ```javascript
   const mongoose = require('mongoose');
   
   const submissionSchema = new mongoose.Schema({
     student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
     topic_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
     phase: { type: String, enum: ['Initial Statement', 'Progress Report 1', 'Progress Report 2', 'Final Dissertation'] },
     status: { type: String, enum: ['Not Submitted', 'Submitted', 'Overdue', 'Declared Not Needed'], default: 'Not Submitted' },
     submittedAt: Date,
     files: [{
       filename: String,
       originalName: String,
       mimetype: String,
       size: Number,
       uploadedAt: { type: Date, default: Date.now },
       url: String,
     }],
     declarationReason: { type: String, maxlength: 1000 },
     declaredAt: Date,
     dueDate: Date,
     createdAt: { type: Date, default: Date.now },
     updatedAt: { type: Date, default: Date.now },
   });
   
   submissionSchema.index({ student_id: 1, phase: 1 }, { unique: true });
   submissionSchema.index({ status: 1 });
   
   module.exports = mongoose.model('Submission', submissionSchema);
   ```

6. Create `src/models/Feedback.js`:
   ```javascript
   const mongoose = require('mongoose');
   
   const feedbackSchema = new mongoose.Schema({
     submission_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true },
     supervisor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
     feedbackText: { type: String, required: true, maxlength: 5000 },
     createdAt: { type: Date, default: Date.now },
     updatedAt: { type: Date, default: Date.now },
   });
   
   feedbackSchema.index({ submission_id: 1 });
   feedbackSchema.index({ supervisor_id: 1 });
   
   module.exports = mongoose.model('Feedback', feedbackSchema);
   ```

7. Create `src/models/ActivityLog.js`:
   ```javascript
   const mongoose = require('mongoose');
   
   const activityLogSchema = new mongoose.Schema({
     user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
     action: { type: String, required: true, maxlength: 100 },
     entityType: { type: String, required: true },
     entityId: mongoose.Schema.Types.ObjectId,
     details: mongoose.Schema.Types.Mixed,
     timestamp: { type: Date, default: Date.now, immutable: true },
     ipAddress: String,
   });
   
   activityLogSchema.index({ user_id: 1, timestamp: -1 });
   activityLogSchema.index({ entityType: 1, entityId: 1 });
   
   module.exports = mongoose.model('ActivityLog', activityLogSchema);
   ```

8. Create `src/models/index.js`:
   ```javascript
   module.exports = {
     User: require('./User'),
     Topic: require('./Topic'),
     Application: require('./Application'),
     Assignment: require('./Assignment'),
     Submission: require('./Submission'),
     Feedback: require('./Feedback'),
     ActivityLog: require('./ActivityLog'),
   };
   ```

**Validation Checklist**:
- [ ] All schemas created with correct field types and constraints
- [ ] Unique indexes on email (User) and application pairs
- [ ] All foreign keys reference correct collections
- [ ] Enum values match specification
- [ ] Field length limits enforced
- [ ] Timestamps auto-set on create and update
- [ ] Models exported from index.js

**Edge Cases**:
- Duplicate emails: Unique constraint prevents
- Invalid enum values: Mongoose validation error
- Oversized strings: Maxlength validation error
- Missing required fields: Validation error on save

---

## Subtask T005: Write Database Initialization Script and Seed Initial Admin User

**Purpose**: Create database setup script and seed initial admin user for system bootstrap.

**Files to Create**:
- `scripts/init-db.js`
- `scripts/seed-admin.js`
- `package.json` (add scripts)

**Steps**:

1. Create `scripts/init-db.js`:
   ```javascript
   const mongoose = require('mongoose');
   const { mongoUri } = require('../src/config/env');
   
   const initDB = async () => {
     try {
       await mongoose.connect(mongoUri);
       console.log('✓ Connected to MongoDB');
       
       // Collections will auto-create with first insert
       // Just verify connection
       const collections = await mongoose.connection.db.listCollections().toArray();
       console.log('✓ Database initialized');
       
       process.exit(0);
     } catch (error) {
       console.error('✗ Error initializing database:', error.message);
       process.exit(1);
     }
   };
   
   initDB();
   ```

2. Create `scripts/seed-admin.js`:
   ```javascript
   require('dotenv').config();
   const mongoose = require('mongoose');
   const bcrypt = require('bcryptjs');
   const { mongoUri } = require('../src/config/env');
   const User = require('../src/models/User');
   
   const seedAdmin = async () => {
     try {
       await mongoose.connect(mongoUri);
       console.log('✓ Connected to MongoDB');
       
       const adminEmail = 'admin@university.edu';
       const tempPassword = 'TempAdmin123!';
       
       const existingAdmin = await User.findOne({ email: adminEmail });
       if (existingAdmin) {
         console.log('✓ Admin user already exists:', adminEmail);
         process.exit(0);
       }
       
       const passwordHash = await bcrypt.hash(tempPassword, 10);
       const admin = new User({
         email: adminEmail,
         passwordHash,
         fullName: 'System Administrator',
         role: 'Admin',
       });
       
       await admin.save();
       console.log('✓ Admin user created');
       console.log(`  Email: ${adminEmail}`);
       console.log(`  Temp Password: ${tempPassword}`);
       console.log('  ⚠️  Change password after first login!');
       
       process.exit(0);
     } catch (error) {
       console.error('✗ Error seeding admin:', error.message);
       process.exit(1);
     }
   };
   
   seedAdmin();
   ```

3. Update `package.json` scripts:
   ```json
   "scripts": {
     "dev": "nodemon src/index.js",
     "start": "node src/index.js",
     "db:init": "node scripts/init-db.js",
     "seed:admin": "node scripts/seed-admin.js",
     "test": "jest --detectOpenHandles",
     "test:watch": "jest --watch",
     "lint": "eslint src/",
     "format": "prettier --write src/"
   }
   ```

**Validation Checklist**:
- [ ] `npm run db:init` connects and initializes database
- [ ] `npm run seed:admin` creates admin user
- [ ] Admin user can login with temp password
- [ ] Duplicate admin creation prevented (idempotent)
- [ ] Password hashed with bcrypt 10 rounds

**Edge Cases**:
- MongoDB not running: Connection fails gracefully
- Admin already exists: Skips creation
- Invalid MongoDB URI: Clear error message
- Database permission issues: Caught and logged

---

## Definition of Done

- [x] All subtasks T001-T005 completed
- [x] Server starts without errors on `npm run dev`
- [x] MongoDB connection established
- [x] Health check endpoint returns 200
- [x] Admin user seeded and can authenticate
- [x] All errors follow standard format `{ error, code, status }`
- [x] ESLint and Prettier configured
- [x] Code follows project constitution (ESLint + Prettier)
- [x] Unit tests for critical paths (database connection, error handler)

## Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| MongoDB connection issues | Medium | High | Test with local MongoDB, document Atlas setup, clear error messages |
| Node/npm version conflicts | Low | High | Document required versions (18.0.0+), verify early in setup |
| Environment variable misconfiguration | Medium | Medium | Create `.env.example` with all required vars, validate on startup |
| Schema changes later | Low | High | Design schemas carefully now, document each field's purpose |

## Reviewer Guidance

- Verify all models match data-model.md specification
- Check indexes are created for query performance
- Ensure error handler catches all thrown errors
- Verify CORS configuration matches frontend URL
- Check environment variables are validated on startup
- Ensure admin seeding is idempotent (can run multiple times safely)

---

**Next Work Package**: WP02 (User Authentication API)  
**Estimated Start**: After WP01 completion  
**Command**: `spec-kitty implement WP02 --base WP01`

## Activity Log

- 2026-02-07T05:27:50Z – GitHub Copilot – shell_pid=15740 – lane=doing – Started implementation via workflow command
- 2026-02-07T05:32:49Z – GitHub Copilot – shell_pid=15740 – lane=for_review – Ready for review: Backend foundation implemented with Express.js, MongoDB schemas, middleware setup, and admin seeding. Server tested and running on port 5000.
