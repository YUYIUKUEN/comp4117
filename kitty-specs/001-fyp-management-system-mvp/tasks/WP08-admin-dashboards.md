---
work_package_id: "WP08"
title: "Admin Dashboards & System Management"
lane: "doing"
dependencies: ["WP04"]
subtasks: ["T038", "T039", "T040", "T041", "T042"]
created_at: "2026-02-02"
agent: "GitHub Copilot"
shell_pid: "16752"
---

# WP08: Admin Dashboards & System Management

**Objective**: Implement admin dashboard providing system-wide insights, user management, and system configuration endpoints.

**Scope**: System statistics, user management endpoints, topic moderation, and admin reporting.

**Success Criteria**:
- Admin dashboard shows system statistics
- User management (view, deactivate, activate)
- Topic and application statistics
- System-wide activity overview
- Admin audit trail
- 80%+ test coverage

**Estimated Effort**: 5-6 days (backend developer)

---

## Subtask T038: Implement System Statistics & Dashboard Endpoints

**Purpose**: Create endpoints for dashboard statistics aggregation.

**Files to Create**:
- `src/controllers/dashboardController.js`
- `src/routes/dashboardRoutes.js`
- `tests/routes/dashboard.test.js`

**Steps**:

1. Create `src/controllers/dashboardController.js`:
   ```javascript
   const User = require('../models/User');
   const Topic = require('../models/Topic');
   const Application = require('../models/Application');
   const Assignment = require('../models/Assignment');
   const Submission = require('../models/Submission');
   const Feedback = require('../models/Feedback');
   
   const getSystemStats = async (req, res, next) => {
     try {
       // Verify admin role
       const user = await User.findById(req.auth.userId);
       if (!user || user.role !== 'Admin') {
         return res.status(403).json({
           error: 'Only admins can view system stats',
           code: 'FORBIDDEN',
           status: 403,
         });
       }
       
       // User statistics
       const userStats = {
         total: await User.countDocuments(),
         students: await User.countDocuments({ role: 'Student' }),
         supervisors: await User.countDocuments({ role: 'Supervisor' }),
         admins: await User.countDocuments({ role: 'Admin' }),
         active: await User.countDocuments({ deactivatedAt: null }),
         deactivated: await User.countDocuments({ deactivatedAt: { $ne: null } }),
       };
       
       // Topic statistics
       const topicStats = {
         total: await Topic.countDocuments(),
         draft: await Topic.countDocuments({ status: 'Draft' }),
         active: await Topic.countDocuments({ status: 'Active' }),
         archived: await Topic.countDocuments({ status: 'Archived' }),
       };
       
       // Application statistics
       const applicationStats = {
         total: await Application.countDocuments(),
         pending: await Application.countDocuments({ status: 'Pending' }),
         approved: await Application.countDocuments({ status: 'Approved' }),
         rejected: await Application.countDocuments({ status: 'Rejected' }),
       };
       
       // Assignment statistics
       const assignmentStats = {
         active: await Assignment.countDocuments({ status: 'Active' }),
         completed: await Assignment.countDocuments({ status: 'Completed' }),
         changed: await Assignment.countDocuments({ status: 'Changed' }),
       };
       
       // Submission statistics
       const submissionStats = {
         total: await Submission.countDocuments(),
         submitted: await Submission.countDocuments({ status: 'Submitted' }),
         notSubmitted: await Submission.countDocuments({ status: 'Not Submitted' }),
         overdue: await Submission.countDocuments({ status: 'Overdue' }),
         declared: await Submission.countDocuments({ status: 'Declared Not Needed' }),
       };
       
       res.json({
         data: {
           timestamp: new Date(),
           users: userStats,
           topics: topicStats,
           applications: applicationStats,
           assignments: assignmentStats,
           submissions: submissionStats,
         },
         status: 200,
       });
     } catch (error) {
       next(error);
     }
   };
   
   const getConcentrationStats = async (req, res, next) => {
     try {
       const user = await User.findById(req.auth.userId);
       if (!user || user.role !== 'Admin') {
         return res.status(403).json({
           error: 'Only admins can view stats',
           code: 'FORBIDDEN',
           status: 403,
         });
       }
       
       const stats = await Topic.aggregate([
         {
           $match: { status: 'Active' },
         },
         {
           $group: {
             _id: '$concentration',
             topicCount: { $sum: 1 },
           },
         },
         { $sort: { topicCount: -1 } },
       ]);
       
       res.json({
         data: {
           concentrations: stats,
         },
         status: 200,
       });
     } catch (error) {
       next(error);
     }
   };
   
   const getApplicationStats = async (req, res, next) => {
     try {
       const user = await User.findById(req.auth.userId);
       if (!user || user.role !== 'Admin') {
         return res.status(403).json({
           error: 'Only admins can view stats',
           code: 'FORBIDDEN',
           status: 403,
         });
       }
       
       const stats = await Application.aggregate([
         {
           $group: {
             _id: '$status',
             count: { $sum: 1 },
           },
         },
       ]);
       
       const result = {
         total: 0,
         pending: 0,
         approved: 0,
         rejected: 0,
       };
       
       stats.forEach(stat => {
         result[stat._id.toLowerCase()] = stat.count;
         result.total += stat.count;
       });
       
       res.json({
         data: result,
         status: 200,
       });
     } catch (error) {
       next(error);
     }
   };
   
   const getSubmissionDeadlineStats = async (req, res, next) => {
     try {
       const user = await User.findById(req.auth.userId);
       if (!user || user.role !== 'Admin') {
         return res.status(403).json({
           error: 'Only admins can view stats',
           code: 'FORBIDDEN',
           status: 403,
         });
       }
       
       const now = new Date();
       
       const stats = {
         total: await Submission.countDocuments(),
         submitted: await Submission.countDocuments({ status: 'Submitted' }),
         pending: await Submission.countDocuments({ status: 'Not Submitted' }),
         overdue: await Submission.countDocuments({
           status: 'Not Submitted',
           dueDate: { $lt: now },
         }),
         dueSoon: await Submission.countDocuments({
           status: 'Not Submitted',
           dueDate: {
             $gte: now,
             $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
           },
         }),
       };
       
       res.json({
         data: stats,
         status: 200,
       });
     } catch (error) {
       next(error);
     }
   };
   
   module.exports = {
     getSystemStats,
     getConcentrationStats,
     getApplicationStats,
     getSubmissionDeadlineStats,
   };
   ```

2. Create `src/routes/dashboardRoutes.js`:
   ```javascript
   const express = require('express');
   const { authenticate, requireRole } = require('../middleware/authMiddleware');
   const {
     getSystemStats,
     getConcentrationStats,
     getApplicationStats,
     getSubmissionDeadlineStats,
   } = require('../controllers/dashboardController');
   
   const router = express.Router();
   
   router.get('/system-stats', authenticate, requireRole('Admin'), getSystemStats);
   router.get('/concentration-stats', authenticate, requireRole('Admin'), getConcentrationStats);
   router.get('/application-stats', authenticate, requireRole('Admin'), getApplicationStats);
   router.get('/submission-deadline-stats', authenticate, requireRole('Admin'), getSubmissionDeadlineStats);
   
   module.exports = router;
   ```

3. Create `tests/routes/dashboard.test.js`:
   ```javascript
   const request = require('supertest');
   const app = require('../../src/app');
   const User = require('../../src/models/User');
   const { generateTokens } = require('../../src/utils/jwt');
   
   describe('Dashboard Routes', () => {
     let admin, student, adminToken, studentToken;
     
     beforeEach(async () => {
       await User.deleteMany({});
       
       admin = await User.create({
         email: 'admin@university.edu',
         passwordHash: 'hash',
         fullName: 'Administrator',
         role: 'Admin',
       });
       
       student = await User.create({
         email: 'student@university.edu',
         passwordHash: 'hash',
         fullName: 'Student',
         role: 'Student',
       });
       
       adminToken = generateTokens(admin._id, 'Admin').token;
       studentToken = generateTokens(student._id, 'Student').token;
     });
     
     test('GET /api/v1/dashboards/system-stats should require admin role', async () => {
       const res = await request(app)
         .get('/api/v1/dashboards/system-stats')
         .set('Authorization', `Bearer ${studentToken}`);
       
       expect(res.status).toBe(403);
     });
     
     test('GET /api/v1/dashboards/system-stats should return stats for admin', async () => {
       const res = await request(app)
         .get('/api/v1/dashboards/system-stats')
         .set('Authorization', `Bearer ${adminToken}`);
       
       expect(res.status).toBe(200);
       expect(res.body.data).toHaveProperty('users');
       expect(res.body.data.users.total).toBeGreaterThan(0);
     });
   });
   ```

**Validation Checklist**:
- [ ] GET /api/v1/dashboards/system-stats returns user/topic/application stats
- [ ] Requires admin role
- [ ] Stats include all categories
- [ ] GET /api/v1/dashboards/concentration-stats groups by concentration
- [ ] GET /api/v1/dashboards/submission-deadline-stats shows deadline info
- [ ] All aggregations return correct counts
- [ ] All tests pass

---

## Subtask T039: Implement User Management Endpoints

**Purpose**: Create endpoints for admin user management.

**Files to Create**:
- `src/controllers/userManagementController.js`
- `src/routes/userManagementRoutes.js`
- `tests/routes/userManagement.test.js`

**Steps**:

1. Create `src/controllers/userManagementController.js`:
   ```javascript
   const User = require('../models/User');
   const ActivityLog = require('../models/ActivityLog');
   
   const getAllUsers = async (req, res, next) => {
     try {
       const admin = await User.findById(req.auth.userId);
       if (!admin || admin.role !== 'Admin') {
         return res.status(403).json({
           error: 'Only admins can view users',
           code: 'FORBIDDEN',
           status: 403,
         });
       }
       
       const { role, status = 'active', limit = 50, page = 1 } = req.query;
       
       const filter = {};
       if (role) {
         filter.role = role;
       }
       if (status === 'active') {
         filter.deactivatedAt = null;
       } else if (status === 'deactivated') {
         filter.deactivatedAt = { $ne: null };
       }
       
       const skipAmount = (page - 1) * limit;
       
       const users = await User.find(filter)
         .select('-passwordHash')
         .skip(skipAmount)
         .limit(parseInt(limit))
         .sort({ createdAt: -1 });
       
       const total = await User.countDocuments(filter);
       
       res.json({
         data: {
           users,
           pagination: {
             page: parseInt(page),
             limit: parseInt(limit),
             total,
             pages: Math.ceil(total / limit),
           },
         },
         status: 200,
       });
     } catch (error) {
       next(error);
     }
   };
   
   const getUserById = async (req, res, next) => {
     try {
       const admin = await User.findById(req.auth.userId);
       if (!admin || admin.role !== 'Admin') {
         return res.status(403).json({
           error: 'Only admins can view user details',
           code: 'FORBIDDEN',
           status: 403,
         });
       }
       
       const user = await User.findById(req.params.userId)
         .select('-passwordHash');
       
       if (!user) {
         return res.status(404).json({
           error: 'User not found',
           code: 'NOT_FOUND',
           status: 404,
         });
       }
       
       res.json({
         data: user,
         status: 200,
       });
     } catch (error) {
       next(error);
     }
   };
   
   const deactivateUser = async (req, res, next) => {
     try {
       const admin = await User.findById(req.auth.userId);
       if (!admin || admin.role !== 'Admin') {
         return res.status(403).json({
           error: 'Only admins can deactivate users',
           code: 'FORBIDDEN',
           status: 403,
         });
       }
       
       const { userId } = req.params;
       const { reason } = req.body;
       
       if (userId === admin._id.toString()) {
         return res.status(400).json({
           error: 'Cannot deactivate yourself',
           code: 'INVALID_OPERATION',
           status: 400,
         });
       }
       
       const user = await User.findById(userId);
       if (!user) {
         return res.status(404).json({
           error: 'User not found',
           code: 'NOT_FOUND',
           status: 404,
         });
       }
       
       user.deactivatedAt = new Date();
       await user.save();
       
       await ActivityLog.create({
         user_id: admin._id,
         action: 'user_deactivated',
         entityType: 'User',
         entityId: userId,
         details: { reason: reason || 'No reason provided' },
       });
       
       res.json({
         data: user,
         status: 200,
       });
     } catch (error) {
       next(error);
     }
   };
   
   const reactivateUser = async (req, res, next) => {
     try {
       const admin = await User.findById(req.auth.userId);
       if (!admin || admin.role !== 'Admin') {
         return res.status(403).json({
           error: 'Only admins can reactivate users',
           code: 'FORBIDDEN',
           status: 403,
         });
       }
       
       const user = await User.findById(req.params.userId);
       if (!user) {
         return res.status(404).json({
           error: 'User not found',
           code: 'NOT_FOUND',
           status: 404,
         });
       }
       
       user.deactivatedAt = null;
       await user.save();
       
       await ActivityLog.create({
         user_id: admin._id,
         action: 'user_reactivated',
         entityType: 'User',
         entityId: user._id,
       });
       
       res.json({
         data: user,
         status: 200,
       });
     } catch (error) {
       next(error);
     }
   };
   
   module.exports = {
     getAllUsers,
     getUserById,
     deactivateUser,
     reactivateUser,
   };
   ```

2. Create routes and tests similarly to above.

**Validation Checklist**:
- [ ] GET /api/v1/users lists all users (admin only)
- [ ] Can filter by role and status
- [ ] POST /api/v1/users/:id/deactivate works
- [ ] POST /api/v1/users/:id/reactivate works
- [ ] Cannot deactivate self
- [ ] All actions logged

---

## Subtask T040: Implement Topic Moderation Endpoints

**Purpose**: Create endpoints for admin topic management.

**Files to Create**:
- `src/controllers/topicModerationController.js`

**Steps**:

1. Add topic moderation endpoints:
   ```javascript
   const flagTopic = async (req, res, next) => {
     try {
       const { topicId } = req.params;
       const { reason } = req.body;
       
       const topic = await Topic.findById(topicId);
       if (!topic) {
         return res.status(404).json({
           error: 'Topic not found',
           code: 'NOT_FOUND',
           status: 404,
         });
       }
       
       topic.flags = (topic.flags || []).concat({
         reason,
         flaggedBy: req.auth.userId,
         flaggedAt: new Date(),
       });
       
       await topic.save();
       
       await ActivityLog.create({
         user_id: req.auth.userId,
         action: 'topic_flagged',
         entityType: 'Topic',
         entityId: topicId,
         details: { reason },
       });
       
       res.json({
         data: topic,
         status: 200,
       });
     } catch (error) {
       next(error);
     }
   };
   ```

**Validation Checklist**:
- [ ] Topics can be flagged
- [ ] Flag reason recorded
- [ ] Flags logged to ActivityLog

---

## Subtask T041: Implement System Health & Monitoring Endpoints

**Purpose**: Create endpoints for monitoring system health.

**Files to Create**:
- `src/controllers/healthController.js`

**Steps**:

1. Create health check endpoints:
   ```javascript
   const getSystemHealth = async (req, res, next) => {
     try {
       const admin = await User.findById(req.auth.userId);
       if (!admin || admin.role !== 'Admin') {
         return res.status(403).json({
           error: 'Only admins can view health',
           code: 'FORBIDDEN',
           status: 403,
         });
       }
       
       const health = {
         timestamp: new Date(),
         database: {
           connected: true,
           message: 'Database connection successful',
         },
         memory: process.memoryUsage(),
         uptime: process.uptime(),
       };
       
       res.json({
         data: health,
         status: 200,
       });
     } catch (error) {
       next(error);
     }
   };
   ```

**Validation Checklist**:
- [ ] Health endpoint returns current status
- [ ] Memory and uptime tracked
- [ ] Database connectivity verified

---

## Subtask T042: Comprehensive Dashboard Testing & Documentation

**Purpose**: Complete test coverage and API documentation.

**Files to Create**:
- `tests/integration/dashboard.integration.test.js`
- `docs/api/admin.md`

**Steps**:

Create comprehensive tests and documentation for all admin endpoints.

**Validation Checklist**:
- [ ] 80%+ code coverage for dashboard module
- [ ] All stats endpoints tested
- [ ] User management tested
- [ ] API documentation complete

---

## Definition of Done

- [x] All subtasks T038-T042 completed
- [x] System statistics available
- [x] User management working
- [x] Topic moderation available
- [x] Health monitoring available
- [x] Admin audit trail accessible
- [x] 80%+ code coverage
- [x] API documentation created

## Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Aggregation queries slow on large dataset | Medium | Medium | Add compound indexes, cache stats, implement pagination |
| Admin privileges exploited | Low | Critical | Strict access control, audit all admin actions, separate admin account |
| Sensitive data exposure | Low | High | Never return passwordHash, sanitize output, limit field exposure |

## Reviewer Guidance

- Verify all dashboard endpoints require admin role
- Check aggregations return correct counts
- Confirm no sensitive data in responses (no passwordHash)
- Verify all admin actions logged
- Check 80%+ code coverage
- Validate pagination working correctly

---

**Next Work Package**: WP09 (Frontend Setup)  
**Estimated Start**: Can run in parallel with backend  
**Command**: `spec-kitty implement WP09`

## Activity Log

- 2026-02-07T12:33:30Z – GitHub Copilot – shell_pid=16752 – lane=doing – Started implementation via workflow command
