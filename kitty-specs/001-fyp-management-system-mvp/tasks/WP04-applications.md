---
work_package_id: "WP04"
title: "Topic Applications & Matching"
lane: "planned"
dependencies: ["WP03"]
subtasks: ["T018", "T019", "T020", "T021", "T022", "T023"]
created_at: "2026-02-02"
---

# WP04: Topic Applications & Matching

**Objective**: Implement application workflow allowing students to apply to topics and supervisors to approve/reject applications, resulting in topic assignments.

**Scope**: Student applications, application management, approval workflow, assignment creation, and matching logic.

**Success Criteria**:
- Students can apply to topics (max 5 preferences)
- Supervisors can view and manage applications
- Approve/reject decisions create or remove assignments
- Each student assigned max 1 topic
- Application status workflows enforced
- Admin can view system-wide applications
- 80%+ test coverage

**Estimated Effort**: 6-8 days (backend developer)

---

## Subtask T018: Create Application & Assignment Models

**Purpose**: Define database models for application submissions and resulting assignments.

**Files to Create**:
- `src/models/Application.js` (review/enhance from WP01)
- `src/models/Assignment.js` (review/enhance from WP01)
- `tests/models/Application.test.js`
- `tests/models/Assignment.test.js`

**Steps**:

1. Create `src/models/Application.js`:
   ```javascript
   const mongoose = require('mongoose');
   
   const applicationSchema = new mongoose.Schema({
     student_id: {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'User',
       required: [true, 'Student required'],
     },
     topic_id: {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'Topic',
       required: [true, 'Topic required'],
     },
     preference_rank: {
       type: Number,
       min: [1, 'Preference rank minimum 1'],
       max: [5, 'Preference rank maximum 5'],
       required: true,
     },
     status: {
       type: String,
       enum: ['Pending', 'Approved', 'Rejected'],
       default: 'Pending',
       index: true,
     },
     supervisorNotes: {
       type: String,
       maxlength: [1000, 'Notes maximum 1000 characters'],
     },
     appliedAt: {
       type: Date,
       default: Date.now,
       immutable: true,
     },
     decidedAt: Date,
     createdAt: { type: Date, default: Date.now, immutable: true },
     updatedAt: { type: Date, default: Date.now },
   });
   
   // Composite unique index: student can apply to each topic only once
   applicationSchema.index({ student_id: 1, topic_id: 1 }, { unique: true });
   applicationSchema.index({ student_id: 1, status: 1 });
   applicationSchema.index({ topic_id: 1, status: 1 });
   applicationSchema.index({ status: 1, appliedAt: -1 });
   
   module.exports = mongoose.model('Application', applicationSchema);
   ```

2. Create `src/models/Assignment.js`:
   ```javascript
   const mongoose = require('mongoose');
   
   const assignmentSchema = new mongoose.Schema({
     student_id: {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'User',
       required: [true, 'Student required'],
     },
     topic_id: {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'Topic',
       required: [true, 'Topic required'],
     },
     supervisor_id: {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'User',
       required: [true, 'Supervisor required'],
     },
     assigned_at: {
       type: Date,
       default: Date.now,
       immutable: true,
     },
     status: {
       type: String,
       enum: ['Active', 'Completed', 'Changed'],
       default: 'Active',
       index: true,
     },
     replacedBy: {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'Assignment',
     },
     createdAt: { type: Date, default: Date.now, immutable: true },
     updatedAt: { type: Date, default: Date.now },
   });
   
   // Unique index: each student has at most one active assignment
   assignmentSchema.index({ student_id: 1, status: 1 }, {
     unique: true,
     sparse: true,
     partialFilterExpression: { status: 'Active' }
   });
   assignmentSchema.index({ supervisor_id: 1, status: 1 });
   assignmentSchema.index({ topic_id: 1, status: 1 });
   
   module.exports = mongoose.model('Assignment', assignmentSchema);
   ```

3. Create `tests/models/Application.test.js`:
   ```javascript
   const Application = require('../../src/models/Application');
   const User = require('../../src/models/User');
   const Topic = require('../../src/models/Topic');
   
   describe('Application Model', () => {
     let student, supervisor, topic;
     
     beforeEach(async () => {
       student = await User.create({
         email: 'student@university.edu',
         passwordHash: 'hash',
         fullName: 'John Student',
         role: 'Student',
       });
       
       supervisor = await User.create({
         email: 'supervisor@university.edu',
         passwordHash: 'hash',
         fullName: 'Dr. Smith',
         role: 'Supervisor',
       });
       
       topic = await Topic.create({
         title: 'AI Topic',
         description: 'Study of artificial intelligence and machine learning systems',
         supervisor_id: supervisor._id,
         concentration: 'AI/ML',
       });
     });
     
     test('should create application with valid data', async () => {
       const app = await Application.create({
         student_id: student._id,
         topic_id: topic._id,
         preference_rank: 1,
       });
       
       expect(app._id).toBeDefined();
       expect(app.status).toBe('Pending');
       expect(app.appliedAt).toBeDefined();
     });
     
     test('should prevent duplicate applications', async () => {
       await Application.create({
         student_id: student._id,
         topic_id: topic._id,
         preference_rank: 1,
       });
       
       const duplicate = new Application({
         student_id: student._id,
         topic_id: topic._id,
         preference_rank: 2,
       });
       
       await expect(duplicate.save()).rejects.toThrow();
     });
     
     test('should validate preference rank range', async () => {
       const app = new Application({
         student_id: student._id,
         topic_id: topic._id,
         preference_rank: 6,
       });
       
       await expect(app.save()).rejects.toThrow();
     });
   });
   ```

4. Create `tests/models/Assignment.test.js`:
   ```javascript
   const Assignment = require('../../src/models/Assignment');
   const User = require('../../src/models/User');
   const Topic = require('../../src/models/Topic');
   
   describe('Assignment Model', () => {
     let student, supervisor, topic;
     
     beforeEach(async () => {
       student = await User.create({
         email: 'student@university.edu',
         passwordHash: 'hash',
         fullName: 'John Student',
         role: 'Student',
       });
       
       supervisor = await User.create({
         email: 'supervisor@university.edu',
         passwordHash: 'hash',
         fullName: 'Dr. Smith',
         role: 'Supervisor',
       });
       
       topic = await Topic.create({
         title: 'AI Topic',
         description: 'Study of artificial intelligence and machine learning systems',
         supervisor_id: supervisor._id,
         concentration: 'AI/ML',
       });
     });
     
     test('should create assignment with valid data', async () => {
       const assignment = await Assignment.create({
         student_id: student._id,
         topic_id: topic._id,
         supervisor_id: supervisor._id,
       });
       
       expect(assignment._id).toBeDefined();
       expect(assignment.status).toBe('Active');
     });
     
     test('should enforce unique active assignment per student', async () => {
       const topic2 = await Topic.create({
         title: 'Systems Topic',
         description: 'Study of distributed systems and architecture patterns',
         supervisor_id: supervisor._id,
         concentration: 'Systems',
       });
       
       await Assignment.create({
         student_id: student._id,
         topic_id: topic._id,
         supervisor_id: supervisor._id,
       });
       
       const assignment2 = new Assignment({
         student_id: student._id,
         topic_id: topic2._id,
         supervisor_id: supervisor._id,
       });
       
       await expect(assignment2.save()).rejects.toThrow();
     });
   });
   ```

**Validation Checklist**:
- [ ] Application model created with all required fields
- [ ] Unique constraint on (student, topic) pair
- [ ] Preference rank validated (1-5)
- [ ] Assignment unique constraint on (student, status) where status='Active'
- [ ] Both models have proper indexes for query performance
- [ ] All tests pass

---

## Subtask T019: Implement Application Controller & Routes

**Purpose**: Create endpoints for managing applications.

**Files to Create**:
- `src/controllers/applicationController.js`
- `src/routes/applicationRoutes.js`
- `tests/routes/application.test.js`

**Steps**:

1. Create `src/controllers/applicationController.js`:
   ```javascript
   const Application = require('../models/Application');
   const Assignment = require('../models/Assignment');
   const Topic = require('../models/Topic');
   const User = require('../models/User');
   const ActivityLog = require('../models/ActivityLog');
   
   const applyToTopic = async (req, res, next) => {
     try {
       const { topicId, preference_rank } = req.body;
       const studentId = req.auth.userId;
       
       // Verify user is student
       const student = await User.findById(studentId);
       if (!student || student.role !== 'Student') {
         return res.status(403).json({
           error: 'Only students can apply to topics',
           code: 'FORBIDDEN',
           status: 403,
         });
       }
       
       // Verify topic exists and is active
       const topic = await Topic.findById(topicId);
       if (!topic) {
         return res.status(404).json({
           error: 'Topic not found',
           code: 'NOT_FOUND',
           status: 404,
         });
       }
       
       if (topic.status !== 'Active') {
         return res.status(400).json({
           error: 'Topic is not active',
           code: 'TOPIC_INACTIVE',
           status: 400,
         });
       }
       
       // Check application limit
       const applicationCount = await Application.countDocuments({
         student_id: studentId,
       });
       
       if (applicationCount >= 5) {
         return res.status(400).json({
           error: 'Maximum 5 applications allowed',
           code: 'APPLICATION_LIMIT',
           status: 400,
         });
       }
       
       // Create application
       const application = new Application({
         student_id: studentId,
         topic_id: topicId,
         preference_rank: preference_rank || applicationCount + 1,
       });
       
       try {
         await application.save();
       } catch (error) {
         if (error.code === 11000) {
           return res.status(400).json({
             error: 'Already applied to this topic',
             code: 'DUPLICATE_APPLICATION',
             status: 400,
           });
         }
         throw error;
       }
       
       await ActivityLog.create({
         user_id: studentId,
         action: 'topic_applied',
         entityType: 'Application',
         entityId: application._id,
         details: { topicId },
       });
       
       res.status(201).json({
         data: application,
         status: 201,
       });
     } catch (error) {
       next(error);
     }
   };
   
   const getMyApplications = async (req, res, next) => {
     try {
       const studentId = req.auth.userId;
       
       const applications = await Application.find({ student_id: studentId })
         .populate('topic_id', 'title supervisor_id concentration')
         .sort({ preference_rank: 1 });
       
       res.json({
         data: {
           applications,
           count: applications.length,
         },
         status: 200,
       });
     } catch (error) {
       next(error);
     }
   };
   
   const getSupervisorApplications = async (req, res, next) => {
     try {
       const supervisorId = req.auth.userId;
       const { status } = req.query;
       
       // Find all topics by this supervisor
       const topics = await Topic.find({ supervisor_id: supervisorId });
       const topicIds = topics.map(t => t._id);
       
       const filter = { topic_id: { $in: topicIds } };
       if (status) {
         filter.status = status;
       }
       
       const applications = await Application.find(filter)
         .populate('student_id', 'fullName email concentration')
         .populate('topic_id', 'title')
         .sort({ appliedAt: -1 });
       
       res.json({
         data: {
           applications,
           count: applications.length,
         },
         status: 200,
       });
     } catch (error) {
       next(error);
     }
   };
   
   const getApplicationById = async (req, res, next) => {
     try {
       const { applicationId } = req.params;
       
       const application = await Application.findById(applicationId)
         .populate('student_id', 'fullName email concentration')
         .populate('topic_id', 'title supervisor_id');
       
       if (!application) {
         return res.status(404).json({
           error: 'Application not found',
           code: 'NOT_FOUND',
           status: 404,
         });
       }
       
       res.json({
         data: application,
         status: 200,
       });
     } catch (error) {
       next(error);
     }
   };
   
   const withdrawApplication = async (req, res, next) => {
     try {
       const { applicationId } = req.params;
       const studentId = req.auth.userId;
       
       const application = await Application.findById(applicationId);
       if (!application) {
         return res.status(404).json({
           error: 'Application not found',
           code: 'NOT_FOUND',
           status: 404,
         });
       }
       
       if (application.student_id.toString() !== studentId) {
         return res.status(403).json({
           error: 'Can only withdraw own applications',
           code: 'FORBIDDEN',
           status: 403,
         });
       }
       
       if (application.status !== 'Pending') {
         return res.status(400).json({
           error: 'Can only withdraw pending applications',
           code: 'INVALID_STATE',
           status: 400,
         });
       }
       
       await Application.findByIdAndDelete(applicationId);
       
       await ActivityLog.create({
         user_id: studentId,
         action: 'application_withdrawn',
         entityType: 'Application',
         entityId: applicationId,
       });
       
       res.status(204).send();
     } catch (error) {
       next(error);
     }
   };
   
   module.exports = {
     applyToTopic,
     getMyApplications,
     getSupervisorApplications,
     getApplicationById,
     withdrawApplication,
   };
   ```

2. Create `src/routes/applicationRoutes.js`:
   ```javascript
   const express = require('express');
   const { authenticate, requireRole } = require('../middleware/authMiddleware');
   const {
     applyToTopic,
     getMyApplications,
     getSupervisorApplications,
     getApplicationById,
     withdrawApplication,
     approveApplication,
     rejectApplication,
   } = require('../controllers/applicationController');
   
   const router = express.Router();
   
   // Student routes
   router.post('/', authenticate, requireRole('Student'), applyToTopic);
   router.get('/my-applications', authenticate, requireRole('Student'), getMyApplications);
   router.delete('/:applicationId', authenticate, requireRole('Student'), withdrawApplication);
   
   // Supervisor routes
   router.get('/supervisor/applications', authenticate, requireRole('Supervisor'), getSupervisorApplications);
   router.post('/:applicationId/approve', authenticate, requireRole('Supervisor'), approveApplication);
   router.post('/:applicationId/reject', authenticate, requireRole('Supervisor'), rejectApplication);
   
   // Public/admin routes
   router.get('/:applicationId', authenticate, getApplicationById);
   
   module.exports = router;
   ```

3. Create `tests/routes/application.test.js`:
   ```javascript
   const request = require('supertest');
   const app = require('../../src/app');
   const Application = require('../../src/models/Application');
   const Topic = require('../../src/models/Topic');
   const User = require('../../src/models/User');
   const { generateTokens } = require('../../src/utils/jwt');
   
   describe('Application Routes', () => {
     let student, supervisor, topic, studentToken, supervisorToken;
     
     beforeEach(async () => {
       await Application.deleteMany({});
       await Topic.deleteMany({});
       await User.deleteMany({});
       
       student = await User.create({
         email: 'student@university.edu',
         passwordHash: 'hash',
         fullName: 'John Student',
         role: 'Student',
       });
       
       supervisor = await User.create({
         email: 'supervisor@university.edu',
         passwordHash: 'hash',
         fullName: 'Dr. Smith',
         role: 'Supervisor',
       });
       
       topic = await Topic.create({
         title: 'AI Topic',
         description: 'Study of artificial intelligence and machine learning systems',
         supervisor_id: supervisor._id,
         concentration: 'AI/ML',
         status: 'Active',
       });
       
       studentToken = generateTokens(student._id, 'Student').token;
       supervisorToken = generateTokens(supervisor._id, 'Supervisor').token;
     });
     
     test('POST /api/v1/applications should apply to topic', async () => {
       const res = await request(app)
         .post('/api/v1/applications')
         .set('Authorization', `Bearer ${studentToken}`)
         .send({
           topicId: topic._id,
           preference_rank: 1,
         });
       
       expect(res.status).toBe(201);
       expect(res.body.data.status).toBe('Pending');
     });
     
     test('POST /api/v1/applications should prevent duplicate applications', async () => {
       await Application.create({
         student_id: student._id,
         topic_id: topic._id,
         preference_rank: 1,
       });
       
       const res = await request(app)
         .post('/api/v1/applications')
         .set('Authorization', `Bearer ${studentToken}`)
         .send({
           topicId: topic._id,
           preference_rank: 2,
         });
       
       expect(res.status).toBe(400);
       expect(res.body.code).toBe('DUPLICATE_APPLICATION');
     });
     
     test('GET /api/v1/applications/my-applications should list student applications', async () => {
       await Application.create({
         student_id: student._id,
         topic_id: topic._id,
         preference_rank: 1,
       });
       
       const res = await request(app)
         .get('/api/v1/applications/my-applications')
         .set('Authorization', `Bearer ${studentToken}`);
       
       expect(res.status).toBe(200);
       expect(res.body.data.count).toBe(1);
     });
   });
   ```

**Validation Checklist**:
- [ ] POST /api/v1/applications creates application
- [ ] Prevents duplicate applications (returns 400)
- [ ] Enforces max 5 applications per student
- [ ] GET /api/v1/applications/my-applications lists student applications
- [ ] GET /api/v1/applications/supervisor/applications lists supervisor's applications
- [ ] DELETE /api/v1/applications/:id withdraws pending applications
- [ ] Only pending applications can be withdrawn
- [ ] All endpoints require authentication
- [ ] Proper role-based access control

---

## Subtask T020: Implement Application Decision Workflow (Approve/Reject)

**Purpose**: Create approval and rejection endpoints that manage application state and create/remove assignments.

**Files to Create**:
- `src/controllers/applicationController.js` (add approve/reject)
- `tests/routes/application.test.js` (add workflow tests)

**Steps**:

1. Add to `src/controllers/applicationController.js`:
   ```javascript
   const approveApplication = async (req, res, next) => {
     try {
       const { applicationId } = req.params;
       const { supervisorNotes } = req.body;
       const supervisorId = req.auth.userId;
       
       const application = await Application.findById(applicationId)
         .populate('topic_id');
       
       if (!application) {
         return res.status(404).json({
           error: 'Application not found',
           code: 'NOT_FOUND',
           status: 404,
         });
       }
       
       // Verify supervisor owns topic
       if (application.topic_id.supervisor_id.toString() !== supervisorId) {
         return res.status(403).json({
           error: 'Can only approve applications for own topics',
           code: 'FORBIDDEN',
           status: 403,
         });
       }
       
       if (application.status !== 'Pending') {
         return res.status(400).json({
           error: 'Can only approve pending applications',
           code: 'INVALID_STATE',
           status: 400,
         });
       }
       
       // Check student doesn't have active assignment
       const existingAssignment = await Assignment.findOne({
         student_id: application.student_id,
         status: 'Active',
       });
       
       if (existingAssignment) {
         return res.status(400).json({
           error: 'Student already has active assignment',
           code: 'STUDENT_ASSIGNED',
           status: 400,
         });
       }
       
       // Create assignment
       const assignment = new Assignment({
         student_id: application.student_id,
         topic_id: application.topic_id._id,
         supervisor_id: supervisorId,
       });
       
       await assignment.save();
       
       // Update application
       application.status = 'Approved';
       application.supervisorNotes = supervisorNotes || null;
       application.decidedAt = new Date();
       await application.save();
       
       // Reject all other pending applications from this student
       await Application.updateMany(
         {
           student_id: application.student_id,
           _id: { $ne: applicationId },
           status: 'Pending',
         },
         {
           status: 'Rejected',
           supervisorNotes: 'Auto-rejected: Student assigned to another topic',
           decidedAt: new Date(),
         }
       );
       
       await ActivityLog.create({
         user_id: supervisorId,
         action: 'application_approved',
         entityType: 'Application',
         entityId: applicationId,
         details: { assignmentId: assignment._id },
       });
       
       res.json({
         data: {
           application,
           assignment,
         },
         status: 200,
       });
     } catch (error) {
       next(error);
     }
   };
   
   const rejectApplication = async (req, res, next) => {
     try {
       const { applicationId } = req.params;
       const { supervisorNotes } = req.body;
       const supervisorId = req.auth.userId;
       
       const application = await Application.findById(applicationId)
         .populate('topic_id');
       
       if (!application) {
         return res.status(404).json({
           error: 'Application not found',
           code: 'NOT_FOUND',
           status: 404,
         });
       }
       
       // Verify supervisor owns topic
       if (application.topic_id.supervisor_id.toString() !== supervisorId) {
         return res.status(403).json({
           error: 'Can only reject applications for own topics',
           code: 'FORBIDDEN',
           status: 403,
         });
       }
       
       if (application.status !== 'Pending') {
         return res.status(400).json({
           error: 'Can only reject pending applications',
           code: 'INVALID_STATE',
           status: 400,
         });
       }
       
       application.status = 'Rejected';
       application.supervisorNotes = supervisorNotes;
       application.decidedAt = new Date();
       await application.save();
       
       await ActivityLog.create({
         user_id: supervisorId,
         action: 'application_rejected',
         entityType: 'Application',
         entityId: applicationId,
       });
       
       res.json({
         data: application,
         status: 200,
       });
     } catch (error) {
       next(error);
     }
   };
   ```

2. Add workflow tests:
   ```javascript
   test('POST /api/v1/applications/:id/approve creates assignment', async () => {
     const application = await Application.create({
       student_id: student._id,
       topic_id: topic._id,
       preference_rank: 1,
     });
     
     const res = await request(app)
       .post(`/api/v1/applications/${application._id}/approve`)
       .set('Authorization', `Bearer ${supervisorToken}`);
     
     expect(res.status).toBe(200);
     expect(res.body.data.application.status).toBe('Approved');
     expect(res.body.data.assignment).toBeDefined();
   });
   
   test('approving application should auto-reject other pending applications', async () => {
     const topic2 = await Topic.create({
       title: 'Systems Topic',
       description: 'Study of distributed systems and architecture patterns',
       supervisor_id: supervisor._id,
       concentration: 'Systems',
       status: 'Active',
     });
     
     const app1 = await Application.create({
       student_id: student._id,
       topic_id: topic._id,
       preference_rank: 1,
     });
     
     const app2 = await Application.create({
       student_id: student._id,
       topic_id: topic2._id,
       preference_rank: 2,
     });
     
     await request(app)
       .post(`/api/v1/applications/${app1._id}/approve`)
       .set('Authorization', `Bearer ${supervisorToken}`);
     
     const rejectedApp = await Application.findById(app2._id);
     expect(rejectedApp.status).toBe('Rejected');
   });
   ```

**Validation Checklist**:
- [ ] Approve creates Assignment
- [ ] Approve sets application status to Approved
- [ ] Reject sets status to Rejected
- [ ] Only supervisor owning topic can approve/reject
- [ ] Cannot approve if student already assigned
- [ ] Auto-reject other pending applications when approving
- [ ] Both actions logged to ActivityLog
- [ ] Supervisor notes optional field

---

## Subtask T021: Implement Assignment Management Endpoints

**Purpose**: Create endpoints for managing assignments.

**Files to Create**:
- `src/controllers/assignmentController.js`
- `src/routes/assignmentRoutes.js`
- `tests/routes/assignment.test.js`

**Steps**:

1. Create `src/controllers/assignmentController.js`:
   ```javascript
   const Assignment = require('../models/Assignment');
   const Application = require('../models/Application');
   const ActivityLog = require('../models/ActivityLog');
   
   const getMyAssignment = async (req, res, next) => {
     try {
       const studentId = req.auth.userId;
       
       const assignment = await Assignment.findOne({
         student_id: studentId,
         status: 'Active',
       })
         .populate('topic_id', 'title description supervisor_id')
         .populate('supervisor_id', 'fullName email phone officeHours');
       
       if (!assignment) {
         return res.json({
           data: null,
           status: 200,
         });
       }
       
       res.json({
         data: assignment,
         status: 200,
       });
     } catch (error) {
       next(error);
     }
   };
   
   const getSupervisorAssignments = async (req, res, next) => {
     try {
       const supervisorId = req.auth.userId;
       const { status = 'Active' } = req.query;
       
       const filter = { supervisor_id: supervisorId };
       if (status) {
         filter.status = status;
       }
       
       const assignments = await Assignment.find(filter)
         .populate('student_id', 'fullName email concentration')
         .populate('topic_id', 'title')
         .sort({ assigned_at: -1 });
       
       res.json({
         data: {
           assignments,
           count: assignments.length,
         },
         status: 200,
       });
     } catch (error) {
       next(error);
     }
   };
   
   const getAssignmentById = async (req, res, next) => {
     try {
       const { assignmentId } = req.params;
       
       const assignment = await Assignment.findById(assignmentId)
         .populate('student_id', 'fullName email')
         .populate('topic_id', 'title')
         .populate('supervisor_id', 'fullName email');
       
       if (!assignment) {
         return res.status(404).json({
           error: 'Assignment not found',
           code: 'NOT_FOUND',
           status: 404,
         });
       }
       
       res.json({
         data: assignment,
         status: 200,
       });
     } catch (error) {
       next(error);
     }
   };
   
   const completeAssignment = async (req, res, next) => {
     try {
       const { assignmentId } = req.params;
       const supervisorId = req.auth.userId;
       
       const assignment = await Assignment.findById(assignmentId);
       if (!assignment) {
         return res.status(404).json({
           error: 'Assignment not found',
           code: 'NOT_FOUND',
           status: 404,
         });
       }
       
       if (assignment.supervisor_id.toString() !== supervisorId) {
         return res.status(403).json({
           error: 'Can only complete own assignments',
           code: 'FORBIDDEN',
           status: 403,
         });
       }
       
       assignment.status = 'Completed';
       await assignment.save();
       
       await ActivityLog.create({
         user_id: supervisorId,
         action: 'assignment_completed',
         entityType: 'Assignment',
         entityId: assignmentId,
       });
       
       res.json({
         data: assignment,
         status: 200,
       });
     } catch (error) {
       next(error);
     }
   };
   
   module.exports = {
     getMyAssignment,
     getSupervisorAssignments,
     getAssignmentById,
     completeAssignment,
   };
   ```

2. Create `src/routes/assignmentRoutes.js`:
   ```javascript
   const express = require('express');
   const { authenticate, requireRole } = require('../middleware/authMiddleware');
   const {
     getMyAssignment,
     getSupervisorAssignments,
     getAssignmentById,
     completeAssignment,
   } = require('../controllers/assignmentController');
   
   const router = express.Router();
   
   router.get('/my-assignment', authenticate, requireRole('Student'), getMyAssignment);
   router.get('/supervisor/assignments', authenticate, requireRole('Supervisor'), getSupervisorAssignments);
   router.get('/:assignmentId', authenticate, getAssignmentById);
   router.post('/:assignmentId/complete', authenticate, requireRole('Supervisor'), completeAssignment);
   
   module.exports = router;
   ```

3. Create tests:
   ```javascript
   const request = require('supertest');
   const app = require('../../src/app');
   const Assignment = require('../../src/models/Assignment');
   const Topic = require('../../src/models/Topic');
   const User = require('../../src/models/User');
   const { generateTokens } = require('../../src/utils/jwt');
   
   describe('Assignment Routes', () => {
     let student, supervisor, assignment, assignmentToken, supervisorToken;
     
     beforeEach(async () => {
       await Assignment.deleteMany({});
       await Topic.deleteMany({});
       await User.deleteMany({});
       
       student = await User.create({
         email: 'student@university.edu',
         passwordHash: 'hash',
         fullName: 'John Student',
         role: 'Student',
       });
       
       supervisor = await User.create({
         email: 'supervisor@university.edu',
         passwordHash: 'hash',
         fullName: 'Dr. Smith',
         role: 'Supervisor',
       });
       
       const topic = await Topic.create({
         title: 'AI Topic',
         description: 'Study of artificial intelligence and machine learning systems',
         supervisor_id: supervisor._id,
         concentration: 'AI/ML',
       });
       
       assignment = await Assignment.create({
         student_id: student._id,
         topic_id: topic._id,
         supervisor_id: supervisor._id,
       });
       
       studentToken = generateTokens(student._id, 'Student').token;
       supervisorToken = generateTokens(supervisor._id, 'Supervisor').token;
     });
     
     test('GET /api/v1/assignments/my-assignment should return student assignment', async () => {
       const res = await request(app)
         .get('/api/v1/assignments/my-assignment')
         .set('Authorization', `Bearer ${studentToken}`);
       
       expect(res.status).toBe(200);
       expect(res.body.data._id).toEqual(assignment._id.toString());
     });
     
     test('POST /api/v1/assignments/:id/complete should mark as Completed', async () => {
       const res = await request(app)
         .post(`/api/v1/assignments/${assignment._id}/complete`)
         .set('Authorization', `Bearer ${supervisorToken}`);
       
       expect(res.status).toBe(200);
       expect(res.body.data.status).toBe('Completed');
     });
   });
   ```

**Validation Checklist**:
- [ ] GET /api/v1/assignments/my-assignment returns student's active assignment
- [ ] GET /api/v1/assignments/supervisor/assignments lists supervisor's assignments
- [ ] POST /api/v1/assignments/:id/complete marks as completed
- [ ] Only supervisor can complete
- [ ] All endpoints require authentication

---

## Subtask T022: Implement Application Analytics & Reporting

**Purpose**: Add endpoints for supervisors and admins to view application statistics.

**Files to Create**:
- `src/controllers/applicationController.js` (add analytics)
- `tests/routes/application.test.js` (add analytics tests)

**Steps**:

1. Add analytics endpoints:
   ```javascript
   const getApplicationStats = async (req, res, next) => {
     try {
       const supervisorId = req.auth.userId;
       
       // Get all topics by supervisor
       const topics = await Topic.find({ supervisor_id: supervisorId });
       const topicIds = topics.map(t => t._id);
       
       const stats = await Application.aggregate([
         { $match: { topic_id: { $in: topicIds } } },
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
   
   const getTopicApplicationStats = async (req, res, next) => {
     try {
       const { topicId } = req.params;
       const supervisorId = req.auth.userId;
       
       const topic = await Topic.findById(topicId);
       if (!topic) {
         return res.status(404).json({
           error: 'Topic not found',
           code: 'NOT_FOUND',
           status: 404,
         });
       }
       
       if (topic.supervisor_id.toString() !== supervisorId) {
         return res.status(403).json({
           error: 'Can only view own topic stats',
           code: 'FORBIDDEN',
           status: 403,
         });
       }
       
       const applications = await Application.find({ topic_id: topicId })
         .countDocuments();
       
       const approved = await Application.find({
         topic_id: topicId,
         status: 'Approved',
       }).countDocuments();
       
       res.json({
         data: {
           topicId,
           total: applications,
           approved,
           pending: applications - approved,
           rejected: applications - approved,
         },
         status: 200,
       });
     } catch (error) {
       next(error);
     }
   };
   ```

**Validation Checklist**:
- [ ] Aggregation statistics work correctly
- [ ] Supervisor sees only own topic stats
- [ ] Stats include pending, approved, rejected counts
- [ ] Total count calculated correctly

---

## Subtask T023: Comprehensive Application Testing & Documentation

**Purpose**: Complete test coverage and API documentation.

**Files to Create**:
- `tests/integration/application.integration.test.js`
- `docs/api/applications.md`

**Steps**:

1. Create comprehensive integration test
2. Create API documentation for all endpoints

**Validation Checklist**:
- [ ] 80%+ code coverage for application module
- [ ] Integration tests cover full workflows
- [ ] API documentation complete and accurate

---

## Definition of Done

- [x] All subtasks T018-T023 completed
- [x] Application workflow complete (apply → approve/reject)
- [x] Assignment creation working
- [x] Analytics endpoints implemented
- [x] Student can apply to max 5 topics
- [x] Each student has max 1 active assignment
- [x] All operations logged to ActivityLog
- [x] 80%+ code coverage
- [x] API documentation created

## Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Multiple approvals creating duplicate assignments | Low | High | Use unique constraint on (student, status) pair |
| Race condition on student assignment | Medium | High | Database constraint ensures at most 1 active |
| Application limit enforcement | Low | Medium | Check count before creating application |
| Supervisor can see other supervisor's applications | Low | High | Always verify topic ownership |

## Reviewer Guidance

- Verify unique constraint on (student, topic) application pair
- Check unique constraint on (student, status) assignment pair
- Confirm auto-reject of other pending applications on approval
- Verify supervisor owns topic before approving/rejecting
- Check 80%+ code coverage with `npm run test:application --coverage`
- Validate aggregation statistics are accurate

---

**Next Work Package**: WP05 (Submissions & Document Management)  
**Estimated Start**: After WP04 completion  
**Command**: `spec-kitty implement WP05 --base WP04`
