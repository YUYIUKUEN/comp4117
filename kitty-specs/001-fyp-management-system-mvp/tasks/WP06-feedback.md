---
work_package_id: "WP06"
title: "Feedback & Comments Management"
lane: "doing"
dependencies: ["WP05"]
subtasks: ["T030", "T031", "T032", "T033"]
created_at: "2026-02-02"
agent: "GitHub-Copilot"
shell_pid: "12464"
---

# WP06: Feedback & Comments Management

**Objective**: Implement supervisor feedback system on student submissions with support for detailed comments and revision tracking.

**Scope**: Feedback creation, feedback viewing, revision history, and comment management.

**Success Criteria**:
- Supervisors can add feedback to submissions
- Students can view feedback on their submissions
- Feedback linked to specific submissions
- Feedback timestamps tracked
- Students notified of feedback (future integration)
- 80%+ test coverage

**Estimated Effort**: 4-5 days (backend developer)

---

## Subtask T030: Create Feedback Model & Controller

**Purpose**: Define feedback data model and create controller for feedback operations.

**Files to Create**:
- `src/models/Feedback.js` (review/enhance from WP01)
- `src/controllers/feedbackController.js`
- `tests/models/Feedback.test.js`

**Steps**:

1. Create/enhance `src/models/Feedback.js`:
   ```javascript
   const mongoose = require('mongoose');
   
   const feedbackSchema = new mongoose.Schema({
     submission_id: {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'Submission',
       required: [true, 'Submission required'],
     },
     supervisor_id: {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'User',
       required: [true, 'Supervisor required'],
     },
     feedbackText: {
       type: String,
       required: [true, 'Feedback text required'],
       minlength: [10, 'Feedback must be at least 10 characters'],
       maxlength: [5000, 'Feedback must be 5000 characters or less'],
     },
     rating: {
       type: Number,
       min: [1, 'Rating minimum 1'],
       max: [5, 'Rating maximum 5'],
     },
     isPrivate: {
       type: Boolean,
       default: false,
     },
     createdAt: { type: Date, default: Date.now, immutable: true },
     updatedAt: { type: Date, default: Date.now },
   });
   
   feedbackSchema.index({ submission_id: 1 });
   feedbackSchema.index({ supervisor_id: 1 });
   feedbackSchema.index({ createdAt: -1 });
   
   module.exports = mongoose.model('Feedback', feedbackSchema);
   ```

2. Create `src/controllers/feedbackController.js`:
   ```javascript
   const Feedback = require('../models/Feedback');
   const Submission = require('../models/Submission');
   const Assignment = require('../models/Assignment');
   const User = require('../models/User');
   const ActivityLog = require('../models/ActivityLog');
   
   const addFeedback = async (req, res, next) => {
     try {
       const { submissionId } = req.params;
       const { feedbackText, rating, isPrivate } = req.body;
       const supervisorId = req.auth.userId;
       
       // Verify supervisor role
       const supervisor = await User.findById(supervisorId);
       if (!supervisor || supervisor.role !== 'Supervisor') {
         return res.status(403).json({
           error: 'Only supervisors can add feedback',
           code: 'FORBIDDEN',
           status: 403,
         });
       }
       
       // Find submission and verify supervisor is assigned
       const submission = await Submission.findById(submissionId)
         .populate('topic_id');
       
       if (!submission) {
         return res.status(404).json({
           error: 'Submission not found',
           code: 'NOT_FOUND',
           status: 404,
         });
       }
       
       // Verify supervisor owns topic
       if (submission.topic_id.supervisor_id.toString() !== supervisorId) {
         return res.status(403).json({
           error: 'Can only provide feedback on own assignments',
           code: 'FORBIDDEN',
           status: 403,
         });
       }
       
       // Validation
       if (!feedbackText) {
         return res.status(400).json({
           error: 'Feedback text required',
           code: 'INVALID_INPUT',
           status: 400,
         });
       }
       
       const feedback = new Feedback({
         submission_id: submissionId,
         supervisor_id: supervisorId,
         feedbackText,
         rating: rating || null,
         isPrivate: isPrivate || false,
       });
       
       await feedback.save();
       
       await ActivityLog.create({
         user_id: supervisorId,
         action: 'feedback_added',
         entityType: 'Feedback',
         entityId: feedback._id,
         details: { submissionId, hasRating: !!rating },
       });
       
       res.status(201).json({
         data: feedback,
         status: 201,
       });
     } catch (error) {
       next(error);
     }
   };
   
   const getFeedback = async (req, res, next) => {
     try {
       const { submissionId } = req.params;
       const userId = req.auth.userId;
       
       const submission = await Submission.findById(submissionId);
       if (!submission) {
         return res.status(404).json({
           error: 'Submission not found',
           code: 'NOT_FOUND',
           status: 404,
         });
       }
       
       // Get user role and verify access
       const user = await User.findById(userId);
       let filter = { submission_id: submissionId };
       
       // Students see only non-private feedback on their submissions
       if (user.role === 'Student') {
         if (submission.student_id.toString() !== userId) {
           return res.status(403).json({
             error: 'Cannot view other students feedback',
             code: 'FORBIDDEN',
             status: 403,
           });
         }
         filter.isPrivate = false;
       }
       
       const feedback = await Feedback.find(filter)
         .populate('supervisor_id', 'fullName email')
         .sort({ createdAt: -1 });
       
       res.json({
         data: {
           feedback,
           count: feedback.length,
         },
         status: 200,
       });
     } catch (error) {
       next(error);
     }
   };
   
   const updateFeedback = async (req, res, next) => {
     try {
       const { feedbackId } = req.params;
       const { feedbackText, rating } = req.body;
       const supervisorId = req.auth.userId;
       
       const feedback = await Feedback.findById(feedbackId);
       if (!feedback) {
         return res.status(404).json({
           error: 'Feedback not found',
           code: 'NOT_FOUND',
           status: 404,
         });
       }
       
       // Verify ownership
       if (feedback.supervisor_id.toString() !== supervisorId) {
         return res.status(403).json({
           error: 'Can only edit own feedback',
           code: 'FORBIDDEN',
           status: 403,
         });
       }
       
       if (feedbackText) {
         feedback.feedbackText = feedbackText;
       }
       if (rating !== undefined) {
         feedback.rating = rating;
       }
       feedback.updatedAt = new Date();
       
       await feedback.save();
       
       await ActivityLog.create({
         user_id: supervisorId,
         action: 'feedback_updated',
         entityType: 'Feedback',
         entityId: feedbackId,
       });
       
       res.json({
         data: feedback,
         status: 200,
       });
     } catch (error) {
       next(error);
     }
   };
   
   const deleteFeedback = async (req, res, next) => {
     try {
       const { feedbackId } = req.params;
       const supervisorId = req.auth.userId;
       
       const feedback = await Feedback.findById(feedbackId);
       if (!feedback) {
         return res.status(404).json({
           error: 'Feedback not found',
           code: 'NOT_FOUND',
           status: 404,
         });
       }
       
       if (feedback.supervisor_id.toString() !== supervisorId) {
         return res.status(403).json({
           error: 'Can only delete own feedback',
           code: 'FORBIDDEN',
           status: 403,
         });
       }
       
       await Feedback.findByIdAndDelete(feedbackId);
       
       await ActivityLog.create({
         user_id: supervisorId,
         action: 'feedback_deleted',
         entityType: 'Feedback',
         entityId: feedbackId,
       });
       
       res.status(204).send();
     } catch (error) {
       next(error);
     }
   };
   
   module.exports = {
     addFeedback,
     getFeedback,
     updateFeedback,
     deleteFeedback,
   };
   ```

3. Create `tests/models/Feedback.test.js`:
   ```javascript
   const Feedback = require('../../src/models/Feedback');
   const Submission = require('../../src/models/Submission');
   const User = require('../../src/models/User');
   const Topic = require('../../src/models/Topic');
   
   describe('Feedback Model', () => {
     let supervisor, student, submission;
     
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
       
       const topic = await Topic.create({
         title: 'AI Topic',
         description: 'Study of artificial intelligence and machine learning systems',
         supervisor_id: supervisor._id,
         concentration: 'AI/ML',
       });
       
       submission = await Submission.create({
         student_id: student._id,
         topic_id: topic._id,
         phase: 'Initial Statement',
         dueDate: new Date(),
       });
     });
     
     test('should create feedback with valid data', async () => {
       const feedback = await Feedback.create({
         submission_id: submission._id,
         supervisor_id: supervisor._id,
         feedbackText: 'Good initial statement with clear research goals',
         rating: 4,
       });
       
       expect(feedback._id).toBeDefined();
       expect(feedback.rating).toBe(4);
       expect(feedback.isPrivate).toBe(false);
     });
     
     test('should require feedback text', async () => {
       const feedback = new Feedback({
         submission_id: submission._id,
         supervisor_id: supervisor._id,
       });
       
       await expect(feedback.save()).rejects.toThrow();
     });
     
     test('should validate rating range', async () => {
       const feedback = new Feedback({
         submission_id: submission._id,
         supervisor_id: supervisor._id,
         feedbackText: 'Good work',
         rating: 6,
       });
       
       await expect(feedback.save()).rejects.toThrow();
     });
   });
   ```

**Validation Checklist**:
- [ ] Feedback model created with all required fields
- [ ] Rating validation (1-5)
- [ ] Feedback text length validation (10-5000 chars)
- [ ] Indexes created for query performance
- [ ] All tests pass

---

## Subtask T031: Implement Feedback Routes & REST Endpoints

**Purpose**: Create REST API routes for feedback operations.

**Files to Create**:
- `src/routes/feedbackRoutes.js`
- `tests/routes/feedback.test.js`

**Steps**:

1. Create `src/routes/feedbackRoutes.js`:
   ```javascript
   const express = require('express');
   const { authenticate, requireRole } = require('../middleware/authMiddleware');
   const {
     addFeedback,
     getFeedback,
     updateFeedback,
     deleteFeedback,
   } = require('../controllers/feedbackController');
   
   const router = express.Router();
   
   // Supervisor routes
   router.post(
     '/submissions/:submissionId/feedback',
     authenticate,
     requireRole('Supervisor'),
     addFeedback
   );
   
   router.put(
     '/:feedbackId',
     authenticate,
     requireRole('Supervisor'),
     updateFeedback
   );
   
   router.delete(
     '/:feedbackId',
     authenticate,
     requireRole('Supervisor'),
     deleteFeedback
   );
   
   // Public routes (authenticated)
   router.get(
     '/submissions/:submissionId/feedback',
     authenticate,
     getFeedback
   );
   
   module.exports = router;
   ```

2. Create `tests/routes/feedback.test.js`:
   ```javascript
   const request = require('supertest');
   const app = require('../../src/app');
   const Feedback = require('../../src/models/Feedback');
   const Submission = require('../../src/models/Submission');
   const Topic = require('../../src/models/Topic');
   const User = require('../../src/models/User');
   const { generateTokens } = require('../../src/utils/jwt');
   
   describe('Feedback Routes', () => {
     let student, supervisor, submission, studentToken, supervisorToken;
     
     beforeEach(async () => {
       await Feedback.deleteMany({});
       await Submission.deleteMany({});
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
       
       submission = await Submission.create({
         student_id: student._id,
         topic_id: topic._id,
         phase: 'Initial Statement',
         dueDate: new Date(),
       });
       
       studentToken = generateTokens(student._id, 'Student').token;
       supervisorToken = generateTokens(supervisor._id, 'Supervisor').token;
     });
     
     test('POST /api/v1/feedback/submissions/:id/feedback should add feedback', async () => {
       const res = await request(app)
         .post(`/api/v1/feedback/submissions/${submission._id}/feedback`)
         .set('Authorization', `Bearer ${supervisorToken}`)
         .send({
           feedbackText: 'Excellent initial statement with clear methodology',
           rating: 5,
         });
       
       expect(res.status).toBe(201);
       expect(res.body.data.rating).toBe(5);
     });
     
     test('GET /api/v1/feedback/submissions/:id/feedback should return feedback', async () => {
       await Feedback.create({
         submission_id: submission._id,
         supervisor_id: supervisor._id,
         feedbackText: 'Good work',
         rating: 4,
         isPrivate: false,
       });
       
       const res = await request(app)
         .get(`/api/v1/feedback/submissions/${submission._id}/feedback`)
         .set('Authorization', `Bearer ${studentToken}`);
       
       expect(res.status).toBe(200);
       expect(res.body.data.count).toBe(1);
     });
     
     test('student should not see private feedback', async () => {
       await Feedback.create({
         submission_id: submission._id,
         supervisor_id: supervisor._id,
         feedbackText: 'Private note',
         isPrivate: true,
       });
       
       const res = await request(app)
         .get(`/api/v1/feedback/submissions/${submission._id}/feedback`)
         .set('Authorization', `Bearer ${studentToken}`);
       
       expect(res.status).toBe(200);
       expect(res.body.data.count).toBe(0);
     });
   });
   ```

**Validation Checklist**:
- [ ] POST /api/v1/feedback/submissions/:id/feedback creates feedback
- [ ] Requires supervisor role
- [ ] GET /api/v1/feedback/submissions/:id/feedback returns feedback
- [ ] Students don't see private feedback
- [ ] PUT /api/v1/feedback/:id updates feedback
- [ ] DELETE /api/v1/feedback/:id removes feedback
- [ ] Only supervisor can update/delete own feedback

---

## Subtask T032: Implement Feedback Analytics & Ratings

**Purpose**: Add endpoints for viewing feedback statistics and ratings.

**Files to Create**:
- `src/controllers/feedbackController.js` (add analytics)

**Steps**:

1. Add analytics endpoints:
   ```javascript
   const getFeedbackStats = async (req, res, next) => {
     try {
       const { submissionId } = req.params;
       
       const stats = await Feedback.aggregate([
         { $match: { submission_id: mongoose.Types.ObjectId(submissionId), isPrivate: false } },
         {
           $group: {
             _id: null,
             count: { $sum: 1 },
             avgRating: { $avg: '$rating' },
             minRating: { $min: '$rating' },
             maxRating: { $max: '$rating' },
           },
         },
       ]);
       
       const result = stats[0] || { count: 0, avgRating: null };
       
       res.json({
         data: result,
         status: 200,
       });
     } catch (error) {
       next(error);
     }
   };
   ```

**Validation Checklist**:
- [ ] Stats include count, avgRating, minRating, maxRating
- [ ] Only non-private feedback included
- [ ] Returns null for avgRating if no ratings

---

## Subtask T033: Comprehensive Feedback Testing & Documentation

**Purpose**: Complete test coverage and API documentation.

**Files to Create**:
- `tests/integration/feedback.integration.test.js`
- `docs/api/feedback.md`

**Steps**:

Create integration tests covering:
- Full feedback workflow (add, view, update, delete)
- Private feedback not shown to students
- Supervisor can only add to own assignments
- Rating validation

**Validation Checklist**:
- [ ] 80%+ code coverage for feedback module
- [ ] All CRUD operations tested
- [ ] Privacy rules tested
- [ ] API documentation complete

---

## Definition of Done

- [x] All subtasks T030-T033 completed
- [x] Feedback creation and retrieval working
- [x] Private feedback support
- [x] Rating system (1-5) implemented
- [x] Supervisor and student access controlled
- [x] All operations logged to ActivityLog
- [x] 80%+ code coverage
- [x] API documentation created

## Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Students see private feedback | Low | High | Test access control thoroughly, validate isPrivate flag |
| Feedback spam | Low | Medium | Rate limit feedback creation (future) |
| Inappropriate feedback content | Low | Medium | Implement content moderation (future) |

## Reviewer Guidance

- Verify students can only see non-private feedback
- Check supervisors can only add to own assignments
- Confirm rating validation (1-5)
- Verify 80%+ code coverage
- Check all access control rules

---

**Parallel Work Package**: WP07 (Activity Logging)  
**Can Start**: Immediately  
**Command**: `spec-kitty implement WP07 --base WP02`

## Activity Log

- 2026-02-07T07:26:50Z – GitHub-Copilot – shell_pid=12464 – lane=doing – Started implementation via workflow command
