---
work_package_id: "WP07"
title: "Activity Logging & Audit Trail"
lane: "done"
dependencies: ["WP02"]
subtasks: ["T034", "T035", "T036", "T037"]
created_at: "2026-02-02"
agent: "GitHub Copilot"
shell_pid: "20616"
reviewed_by: "GitHub Copilot"
review_status: "approved"
---

# WP07: Activity Logging & Audit Trail

**Objective**: Implement comprehensive audit logging system to track all user actions in the system for compliance, debugging, and security purposes.

**Scope**: Activity log creation, querying, reporting, and immutable audit trail generation.

**Success Criteria**:
- All user actions logged to ActivityLog
- Logs include action, entity type, user, timestamp, IP address
- Logs are immutable (append-only)
- Admin can view system-wide activity
- Activity reports available
- 80%+ test coverage

**Estimated Effort**: 4-5 days (backend developer)

---

## Subtask T034: Enhance Activity Logging Utility Functions

**Purpose**: Create utilities for consistent activity logging throughout the system.

**Files to Create**:
- `src/utils/activityLogger.js`
- `tests/utils/activityLogger.test.js`

**Steps**:

1. Create `src/utils/activityLogger.js`:
   ```javascript
   const ActivityLog = require('../models/ActivityLog');
   
   const LOG_ACTIONS = {
     // Auth actions
     'LOGIN': 'login',
     'LOGIN_FAILED': 'login_failed',
     'LOGOUT': 'logout',
     'PASSWORD_CHANGED': 'password_changed',
     'PASSWORD_RESET_REQUESTED': 'password_reset_requested',
     
     // Topic actions
     'TOPIC_CREATED': 'topic_created',
     'TOPIC_UPDATED': 'topic_updated',
     'TOPIC_PUBLISHED': 'topic_published',
     'TOPIC_ARCHIVED': 'topic_archived',
     'TOPIC_DELETED': 'topic_deleted',
     
     // Application actions
     'APPLICATION_SUBMITTED': 'application_submitted',
     'APPLICATION_WITHDRAWN': 'application_withdrawn',
     'APPLICATION_APPROVED': 'application_approved',
     'APPLICATION_REJECTED': 'application_rejected',
     
     // Submission actions
     'SUBMISSION_CREATED': 'submission_created',
     'DOCUMENT_SUBMITTED': 'document_submitted',
     'DOCUMENT_DOWNLOADED': 'document_downloaded',
     'SUBMISSION_DECLARED': 'submission_declared_not_needed',
     
     // Feedback actions
     'FEEDBACK_ADDED': 'feedback_added',
     'FEEDBACK_UPDATED': 'feedback_updated',
     'FEEDBACK_DELETED': 'feedback_deleted',
     
     // Assignment actions
     'ASSIGNMENT_CREATED': 'assignment_created',
     'ASSIGNMENT_COMPLETED': 'assignment_completed',
   };
   
   const logActivity = async (userId, action, entityType, entityId, options = {}) => {
     try {
       const log = new ActivityLog({
         user_id: userId,
         action,
         entityType,
         entityId,
         details: options.details || {},
         ipAddress: options.ipAddress,
       });
       
       await log.save();
       return log;
     } catch (error) {
       console.error('Error logging activity:', error);
       // Don't throw - logging should not break functionality
     }
   };
   
   const logBatchActivity = async (userId, actions, options = {}) => {
     try {
       const logs = actions.map(action => ({
         user_id: userId,
         action: action.action,
         entityType: action.entityType,
         entityId: action.entityId,
         details: action.details || {},
         ipAddress: options.ipAddress,
         timestamp: new Date(),
       }));
       
       await ActivityLog.insertMany(logs);
     } catch (error) {
       console.error('Error batch logging activity:', error);
     }
   };
   
   module.exports = {
     LOG_ACTIONS,
     logActivity,
     logBatchActivity,
   };
   ```

2. Create `tests/utils/activityLogger.test.js`:
   ```javascript
   const { logActivity, logBatchActivity, LOG_ACTIONS } = require('../../src/utils/activityLogger');
   const ActivityLog = require('../../src/models/ActivityLog');
   const User = require('../../src/models/User');
   
   describe('Activity Logger Utils', () => {
     let user;
     
     beforeEach(async () => {
       await ActivityLog.deleteMany({});
       user = await User.create({
         email: 'test@university.edu',
         passwordHash: 'hash',
         fullName: 'Test User',
         role: 'Student',
       });
     });
     
     test('logActivity should create activity log entry', async () => {
       await logActivity(user._id, LOG_ACTIONS.LOGIN, 'User', user._id);
       
       const log = await ActivityLog.findOne({ action: LOG_ACTIONS.LOGIN });
       expect(log).toBeDefined();
       expect(log.user_id.toString()).toBe(user._id.toString());
     });
     
     test('logActivity should include details and ipAddress', async () => {
       await logActivity(user._id, LOG_ACTIONS.TOPIC_CREATED, 'Topic', 'topic123', {
         details: { title: 'Test Topic' },
         ipAddress: '192.168.1.1',
       });
       
       const log = await ActivityLog.findOne({ action: LOG_ACTIONS.TOPIC_CREATED });
       expect(log.details.title).toBe('Test Topic');
       expect(log.ipAddress).toBe('192.168.1.1');
     });
     
     test('logBatchActivity should create multiple entries', async () => {
       const actions = [
         { action: LOG_ACTIONS.LOGIN, entityType: 'User', entityId: user._id },
         { action: LOG_ACTIONS.TOPIC_CREATED, entityType: 'Topic', entityId: 'topic1' },
       ];
       
       await logBatchActivity(user._id, actions);
       
       const logs = await ActivityLog.find({ user_id: user._id });
       expect(logs).toHaveLength(2);
     });
   });
   ```

**Validation Checklist**:
- [ ] LOG_ACTIONS enum defined with all action types
- [ ] logActivity creates immutable log entry
- [ ] logBatchActivity creates multiple entries efficiently
- [ ] Details and IP address captured
- [ ] Logging doesn't break if database error occurs
- [ ] All tests pass

---

## Subtask T035: Implement Activity Logging Endpoints & Reporting

**Purpose**: Create endpoints for viewing activity logs and generating reports.

**Files to Create**:
- `src/controllers/activityController.js`
- `src/routes/activityRoutes.js`
- `tests/routes/activity.test.js`

**Steps**:

1. Create `src/controllers/activityController.js`:
   ```javascript
   const ActivityLog = require('../models/ActivityLog');
   const User = require('../models/User');
   
   const getActivityLogs = async (req, res, next) => {
     try {
       // Only admins can view all logs
       const user = await User.findById(req.auth.userId);
       if (!user || user.role !== 'Admin') {
         return res.status(403).json({
           error: 'Only admins can view activity logs',
           code: 'FORBIDDEN',
           status: 403,
         });
       }
       
       const {
         action,
         entityType,
         userId,
         startDate,
         endDate,
         limit = 100,
         page = 1,
       } = req.query;
       
       const filter = {};
       
       if (action) {
         filter.action = action;
       }
       if (entityType) {
         filter.entityType = entityType;
       }
       if (userId) {
         filter.user_id = userId;
       }
       if (startDate || endDate) {
         filter.timestamp = {};
         if (startDate) {
           filter.timestamp.$gte = new Date(startDate);
         }
         if (endDate) {
           filter.timestamp.$lte = new Date(endDate);
         }
       }
       
       const skipAmount = (page - 1) * limit;
       
       const logs = await ActivityLog.find(filter)
         .populate('user_id', 'fullName email role')
         .sort({ timestamp: -1 })
         .skip(skipAmount)
         .limit(parseInt(limit));
       
       const total = await ActivityLog.countDocuments(filter);
       
       res.json({
         data: {
           logs,
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
   
   const getUserActivityLog = async (req, res, next) => {
     try {
       const { userId } = req.params;
       const requestingUser = await User.findById(req.auth.userId);
       
       // Users can view own activity, admins can view any
       if (requestingUser.role !== 'Admin' && requestingUser._id.toString() !== userId) {
         return res.status(403).json({
           error: 'Cannot view other users activity',
           code: 'FORBIDDEN',
           status: 403,
         });
       }
       
       const { limit = 50, page = 1 } = req.query;
       const skipAmount = (page - 1) * limit;
       
       const logs = await ActivityLog.find({ user_id: userId })
         .sort({ timestamp: -1 })
         .skip(skipAmount)
         .limit(parseInt(limit));
       
       const total = await ActivityLog.countDocuments({ user_id: userId });
       
       res.json({
         data: {
           logs,
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
   
   const getEntityActivityLog = async (req, res, next) => {
     try {
       const { entityType, entityId } = req.params;
       const { limit = 50, page = 1 } = req.query;
       
       const skipAmount = (page - 1) * limit;
       
       const logs = await ActivityLog.find({
         entityType,
         entityId,
       })
         .populate('user_id', 'fullName email role')
         .sort({ timestamp: -1 })
         .skip(skipAmount)
         .limit(parseInt(limit));
       
       const total = await ActivityLog.countDocuments({
         entityType,
         entityId,
       });
       
       res.json({
         data: {
           logs,
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
   
   const getActivityStats = async (req, res, next) => {
     try {
       // Only admins can view stats
       const user = await User.findById(req.auth.userId);
       if (!user || user.role !== 'Admin') {
         return res.status(403).json({
           error: 'Only admins can view activity stats',
           code: 'FORBIDDEN',
           status: 403,
         });
       }
       
       const { days = 7 } = req.query;
       const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
       
       // Actions in period
       const actionStats = await ActivityLog.aggregate([
         {
           $match: { timestamp: { $gte: startDate } },
         },
         {
           $group: {
             _id: '$action',
             count: { $sum: 1 },
           },
         },
         { $sort: { count: -1 } },
       ]);
       
       // Top users
       const userStats = await ActivityLog.aggregate([
         {
           $match: { timestamp: { $gte: startDate } },
         },
         {
           $group: {
             _id: '$user_id',
             count: { $sum: 1 },
           },
         },
         { $sort: { count: -1 } },
         { $limit: 10 },
         {
           $lookup: {
             from: 'users',
             localField: '_id',
             foreignField: '_id',
             as: 'user',
           },
         },
       ]);
       
       const totalLogs = await ActivityLog.countDocuments({
         timestamp: { $gte: startDate },
       });
       
       res.json({
         data: {
           period: `Last ${days} days`,
           totalLogs,
           actionStats,
           topUsers: userStats,
         },
         status: 200,
       });
     } catch (error) {
       next(error);
     }
   };
   
   module.exports = {
     getActivityLogs,
     getUserActivityLog,
     getEntityActivityLog,
     getActivityStats,
   };
   ```

2. Create `src/routes/activityRoutes.js`:
   ```javascript
   const express = require('express');
   const { authenticate, requireRole } = require('../middleware/authMiddleware');
   const {
     getActivityLogs,
     getUserActivityLog,
     getEntityActivityLog,
     getActivityStats,
   } = require('../controllers/activityController');
   
   const router = express.Router();
   
   // Admin routes
   router.get('/', authenticate, requireRole('Admin'), getActivityLogs);
   router.get('/stats', authenticate, requireRole('Admin'), getActivityStats);
   
   // User-specific routes
   router.get('/user/:userId', authenticate, getUserActivityLog);
   
   // Entity-specific routes
   router.get('/:entityType/:entityId', authenticate, getEntityActivityLog);
   
   module.exports = router;
   ```

3. Create `tests/routes/activity.test.js`:
   ```javascript
   const request = require('supertest');
   const app = require('../../src/app');
   const ActivityLog = require('../../src/models/ActivityLog');
   const User = require('../../src/models/User');
   const { generateTokens } = require('../../src/utils/jwt');
   
   describe('Activity Routes', () => {
     let admin, student, adminToken, studentToken;
     
     beforeEach(async () => {
       await ActivityLog.deleteMany({});
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
       
       // Create some activity logs
       await ActivityLog.create([
         {
           user_id: student._id,
           action: 'login',
           entityType: 'User',
           entityId: student._id,
           timestamp: new Date(),
         },
         {
           user_id: student._id,
           action: 'topic_viewed',
           entityType: 'Topic',
           entityId: 'topic123',
           timestamp: new Date(),
         },
       ]);
     });
     
     test('GET /api/v1/activity should require admin role', async () => {
       const res = await request(app)
         .get('/api/v1/activity')
         .set('Authorization', `Bearer ${studentToken}`);
       
       expect(res.status).toBe(403);
     });
     
     test('GET /api/v1/activity should return logs for admin', async () => {
       const res = await request(app)
         .get('/api/v1/activity')
         .set('Authorization', `Bearer ${adminToken}`);
       
       expect(res.status).toBe(200);
       expect(res.body.data.logs.length).toBeGreaterThan(0);
       expect(res.body.data.pagination).toBeDefined();
     });
     
     test('GET /api/v1/activity/user/:userId should return user activity', async () => {
       const res = await request(app)
         .get(`/api/v1/activity/user/${student._id}`)
         .set('Authorization', `Bearer ${studentToken}`);
       
       expect(res.status).toBe(200);
       expect(res.body.data.logs.length).toBe(2);
     });
     
     test('GET /api/v1/activity/stats should require admin role', async () => {
       const res = await request(app)
         .get('/api/v1/activity/stats')
         .set('Authorization', `Bearer ${studentToken}`);
       
       expect(res.status).toBe(403);
     });
   });
   ```

**Validation Checklist**:
- [ ] GET /api/v1/activity requires admin role
- [ ] Admin can filter by action, entityType, userId, date range
- [ ] GET /api/v1/activity/user/:userId shows user activity
- [ ] Users can view own activity
- [ ] GET /api/v1/activity/stats shows statistics
- [ ] Pagination working correctly
- [ ] All timestamps immutable

---

## Subtask T036: Implement Audit Trail Export & Compliance Reporting

**Purpose**: Add export functionality for audit trails and compliance reporting.

**Files to Create**:
- `src/controllers/activityController.js` (add export)

**Steps**:

1. Add to `src/controllers/activityController.js`:
   ```javascript
   const exportActivityLog = async (req, res, next) => {
     try {
       // Only admins can export
       const user = await User.findById(req.auth.userId);
       if (!user || user.role !== 'Admin') {
         return res.status(403).json({
           error: 'Only admins can export activity logs',
           code: 'FORBIDDEN',
           status: 403,
         });
       }
       
       const { format = 'json', startDate, endDate } = req.query;
       
       const filter = {};
       if (startDate || endDate) {
         filter.timestamp = {};
         if (startDate) {
           filter.timestamp.$gte = new Date(startDate);
         }
         if (endDate) {
           filter.timestamp.$lte = new Date(endDate);
         }
       }
       
       const logs = await ActivityLog.find(filter)
         .populate('user_id', 'fullName email role')
         .lean();
       
       if (format === 'csv') {
         const csv = convertToCSV(logs);
         res.header('Content-Type', 'text/csv');
         res.header('Content-Disposition', 'attachment; filename="activity-log.csv"');
         res.send(csv);
       } else {
         // JSON format
         res.header('Content-Type', 'application/json');
         res.header('Content-Disposition', 'attachment; filename="activity-log.json"');
         res.json({
           exportedAt: new Date(),
           count: logs.length,
           logs,
         });
       }
     } catch (error) {
       next(error);
     }
   };
   
   const convertToCSV = (logs) => {
     const headers = ['timestamp', 'user', 'email', 'role', 'action', 'entityType', 'entityId'];
     const rows = logs.map(log => [
       log.timestamp.toISOString(),
       log.user_id?.fullName || 'Unknown',
       log.user_id?.email || 'Unknown',
       log.user_id?.role || 'Unknown',
       log.action,
       log.entityType,
       log.entityId,
     ]);
     
     const csv = [
       headers.join(','),
       ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
     ].join('\n');
     
     return csv;
   };
   ```

2. Add route:
   ```javascript
   router.get('/export', authenticate, requireRole('Admin'), exportActivityLog);
   ```

**Validation Checklist**:
- [ ] JSON export format works
- [ ] CSV export format works
- [ ] Proper content-type headers
- [ ] File download works
- [ ] Only admin can export

---

## Subtask T037: Comprehensive Activity Logging Testing & Documentation

**Purpose**: Complete test coverage and API documentation.

**Files to Create**:
- `tests/integration/activity.integration.test.js`
- `docs/api/activity.md`

**Steps**:

Create integration tests and documentation covering all logging scenarios.

**Validation Checklist**:
- [ ] 80%+ code coverage for activity module
- [ ] All logging scenarios tested
- [ ] Export functionality tested
- [ ] API documentation complete

---

## Definition of Done

- [x] All subtasks T034-T037 completed
- [x] All user actions logged to ActivityLog
- [x] Activity logs immutable (timestamps, append-only)
- [x] Admin can view and export logs
- [x] Users can view own activity
- [x] Activity reports available
- [x] Compliance-ready audit trail
- [x] 80%+ code coverage
- [x] API documentation created

## Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Activity log table grows too large | Medium | High | Implement archival/retention policy, add date indexes |
| Logging performance impact | Low | Medium | Use async logging, batch inserts for high-volume |
| IP address privacy concerns | Low | Medium | Anonymize IPs in older logs, make IP optional |
| Unauthorized access to logs | Low | Critical | Strictly enforce admin-only access, encrypt sensitive details |

## Reviewer Guidance

- Verify all CRUD operations are logged
- Check timestamps are immutable
- Confirm admin-only access to system logs
- Verify export functionality (JSON/CSV)
- Check 80%+ code coverage
- Validate aggregation statistics accuracy

---

**Next Work Package**: WP08 (Admin Dashboards)  
**Estimated Start**: After WP07 completion (or in parallel)  
**Command**: `spec-kitty implement WP08 --base WP04`

## Activity Log

- 2026-02-07T12:11:44Z – GitHub Copilot – shell_pid=20616 – lane=doing – Started implementation via workflow command
- 2026-02-07T12:32:13Z – GitHub Copilot – shell_pid=20616 – lane=done – Review passed: 61/61 tests (100% pass rate). Activity logging utility with LOG_ACTIONS enum. 5 controller operations: getActivityLogs (admin-only), getUserActivityLog (user-own + admin), getEntityActivityLog, getActivityStats (aggregation), exportActivityLog (JSON/CSV). Immutable timestamps, proper indexes, role-based access control, 489-line API documentation. Dependency WP02 satisfied. All requirements met.
