---
work_package_id: "WP05"
title: "Submissions & Document Management"
lane: "doing"
dependencies: ["WP04"]
subtasks: ["T024", "T025", "T026", "T027", "T028", "T029"]
created_at: "2026-02-02"
agent: "GitHub-Copilot"
shell_pid: "8196"
---

# WP05: Submissions & Document Management

**Objective**: Implement document submission system with 4 phases (Initial Statement, Progress Reports 1-2, Final Dissertation), file upload handling, deadline management, and status tracking.

**Scope**: Submission creation, file upload/download, phase management, deadline enforcement, declaration of non-submission, and document versioning.

**Success Criteria**:
- Students can upload documents for all 4 submission phases
- File size limits enforced (50MB max)
- Deadline tracking and enforcement
- Students can declare not needing to submit
- Submissions tracked with timestamps
- Files securely stored and served
- 80%+ test coverage

**Estimated Effort**: 7-9 days (backend developer)

---

## Subtask T024: Create Submission Model & File Upload Utilities

**Purpose**: Define submission data model and file handling utilities.

**Files to Create**:
- `src/models/Submission.js` (review/enhance from WP01)
- `src/utils/fileUpload.js`
- `src/config/storage.js`
- `tests/models/Submission.test.js`

**Steps**:

1. Create `src/models/Submission.js`:
   ```javascript
   const mongoose = require('mongoose');
   
   const submissionSchema = new mongoose.Schema({
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
     phase: {
       type: String,
       enum: ['Initial Statement', 'Progress Report 1', 'Progress Report 2', 'Final Dissertation'],
       required: [true, 'Phase required'],
       index: true,
     },
     status: {
       type: String,
       enum: ['Not Submitted', 'Submitted', 'Overdue', 'Declared Not Needed'],
       default: 'Not Submitted',
       index: true,
     },
     submittedAt: Date,
     files: [{
       _id: false,
       filename: {
         type: String,
         required: true,
       },
       originalName: {
         type: String,
         required: true,
       },
       mimetype: {
         type: String,
         enum: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
         required: true,
       },
       size: {
         type: Number,
         required: true,
         max: [52428800, 'File size max 50MB'],
       },
       uploadedAt: {
         type: Date,
         default: Date.now,
         immutable: true,
       },
       url: {
         type: String,
         required: true,
       },
     }],
     declarationReason: {
       type: String,
       maxlength: [1000, 'Declaration reason max 1000 characters'],
     },
     declaredAt: Date,
     dueDate: {
       type: Date,
       required: true,
     },
     createdAt: { type: Date, default: Date.now, immutable: true },
     updatedAt: { type: Date, default: Date.now },
   });
   
   // Composite unique index: student can have one submission per phase
   submissionSchema.index({ student_id: 1, phase: 1 }, { unique: true });
   submissionSchema.index({ student_id: 1, status: 1 });
   submissionSchema.index({ dueDate: 1, status: 1 });
   
   // Check deadline status before save
   submissionSchema.pre('save', function(next) {
     if (this.status === 'Not Submitted' && this.dueDate < new Date()) {
       this.status = 'Overdue';
     }
     next();
   });
   
   module.exports = mongoose.model('Submission', submissionSchema);
   ```

2. Create `src/config/storage.js`:
   ```javascript
   const fs = require('fs');
   const path = require('path');
   
   const STORAGE_DIR = path.join(__dirname, '../../uploads');
   const UPLOADS_SUBDIR = 'submissions';
   const SUBMISSIONS_DIR = path.join(STORAGE_DIR, UPLOADS_SUBDIR);
   
   // Ensure directories exist
   [STORAGE_DIR, SUBMISSIONS_DIR].forEach(dir => {
     if (!fs.existsSync(dir)) {
       fs.mkdirSync(dir, { recursive: true });
     }
   });
   
   const getSubmissionPath = (studentId, phase) => {
     const sanitizedPhase = phase.replace(/\s+/g, '-').toLowerCase();
     return path.join(SUBMISSIONS_DIR, studentId, sanitizedPhase);
   };
   
   const generateFilename = (originalName) => {
     const ext = path.extname(originalName);
     const timestamp = Date.now();
     return `${timestamp}${ext}`;
   };
   
   const saveFile = (file, studentId, phase) => {
     const dir = getSubmissionPath(studentId, phase);
     
     // Create directory if not exists
     if (!fs.existsSync(dir)) {
       fs.mkdirSync(dir, { recursive: true });
     }
     
     const filename = generateFilename(file.originalname);
     const filepath = path.join(dir, filename);
     
     fs.writeFileSync(filepath, file.buffer);
     
     return { filename, filepath };
   };
   
   const getFile = (studentId, phase, filename) => {
     const filepath = path.join(getSubmissionPath(studentId, phase), filename);
     
     if (!fs.existsSync(filepath)) {
       throw new Error('File not found');
     }
     
     return filepath;
   };
   
   const deleteFile = (studentId, phase, filename) => {
     const filepath = path.join(getSubmissionPath(studentId, phase), filename);
     if (fs.existsSync(filepath)) {
       fs.unlinkSync(filepath);
     }
   };
   
   module.exports = {
     SUBMISSIONS_DIR,
     getSubmissionPath,
     generateFilename,
     saveFile,
     getFile,
     deleteFile,
   };
   ```

3. Create `src/utils/fileUpload.js`:
   ```javascript
   const ALLOWED_MIMETYPES = [
     'application/pdf',
     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
   ];
   
   const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
   
   const validateFile = (file) => {
     const errors = [];
     
     if (!file) {
       errors.push('File required');
     } else {
       if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
         errors.push('Only PDF and DOCX files allowed');
       }
       
       if (file.size > MAX_FILE_SIZE) {
         errors.push(`File size must be under 50MB (uploaded: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
       }
     }
     
     return {
       valid: errors.length === 0,
       errors,
     };
   };
   
   module.exports = {
     ALLOWED_MIMETYPES,
     MAX_FILE_SIZE,
     validateFile,
   };
   ```

4. Create `tests/models/Submission.test.js`:
   ```javascript
   const Submission = require('../../src/models/Submission');
   const User = require('../../src/models/User');
   const Topic = require('../../src/models/Topic');
   
   describe('Submission Model', () => {
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
     
     test('should create submission for each phase', async () => {
       const phases = ['Initial Statement', 'Progress Report 1', 'Progress Report 2', 'Final Dissertation'];
       
       for (const phase of phases) {
         const submission = await Submission.create({
           student_id: student._id,
           topic_id: topic._id,
           phase,
           dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
         });
         
         expect(submission._id).toBeDefined();
         expect(submission.status).toBe('Not Submitted');
       }
     });
     
     test('should prevent duplicate submissions for same phase', async () => {
       await Submission.create({
         student_id: student._id,
         topic_id: topic._id,
         phase: 'Initial Statement',
         dueDate: new Date(),
       });
       
       const duplicate = new Submission({
         student_id: student._id,
         topic_id: topic._id,
         phase: 'Initial Statement',
         dueDate: new Date(),
       });
       
       await expect(duplicate.save()).rejects.toThrow();
     });
   });
   ```

**Validation Checklist**:
- [ ] Submission model created with all required fields
- [ ] Unique constraint on (student, phase) pair
- [ ] File size limited to 50MB
- [ ] Allowed MIME types: PDF and DOCX
- [ ] File upload utilities created
- [ ] Storage directories created on startup
- [ ] All tests pass

---

## Subtask T025: Implement Submission Controller & File Upload Endpoints

**Purpose**: Create endpoints for submitting documents and managing files.

**Files to Create**:
- `src/controllers/submissionController.js`
- `src/routes/submissionRoutes.js`
- `src/middleware/fileUpload.js`
- `tests/routes/submission.test.js`

**Steps**:

1. Create `src/middleware/fileUpload.js` (multer configuration):
   ```javascript
   const multer = require('multer');
   const { MAX_FILE_SIZE, ALLOWED_MIMETYPES } = require('../utils/fileUpload');
   
   const storage = multer.memoryStorage();
   
   const fileFilter = (req, file, cb) => {
     if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
       cb(null, true);
     } else {
       cb(new Error('Invalid file type'), false);
     }
   };
   
   const upload = multer({
     storage,
     fileFilter,
     limits: { fileSize: MAX_FILE_SIZE },
   });
   
   module.exports = upload;
   ```

2. Create `src/controllers/submissionController.js`:
   ```javascript
   const Submission = require('../models/Submission');
   const Assignment = require('../models/Assignment');
   const User = require('../models/User');
   const ActivityLog = require('../models/ActivityLog');
   const { validateFile } = require('../utils/fileUpload');
   const { saveFile, deleteFile, getFile } = require('../config/storage');
   const fs = require('fs');
   
   const submitDocument = async (req, res, next) => {
     try {
       const { phase } = req.params;
       const studentId = req.auth.userId;
       
       if (!req.file) {
         return res.status(400).json({
           error: 'File required',
           code: 'NO_FILE',
           status: 400,
         });
       }
       
       // Validate file
       const validation = validateFile(req.file);
       if (!validation.valid) {
         return res.status(400).json({
           error: validation.errors.join('; '),
           code: 'INVALID_FILE',
           status: 400,
         });
       }
       
       // Find active assignment
       const assignment = await Assignment.findOne({
         student_id: studentId,
         status: 'Active',
       });
       
       if (!assignment) {
         return res.status(400).json({
           error: 'No active assignment found',
           code: 'NO_ASSIGNMENT',
           status: 400,
         });
       }
       
       // Find or create submission
       let submission = await Submission.findOne({
         student_id: studentId,
         phase,
         topic_id: assignment.topic_id,
       });
       
       if (!submission) {
         const dueDate = calculateDueDate(phase);
         submission = await Submission.create({
           student_id: studentId,
           topic_id: assignment.topic_id,
           phase,
           dueDate,
         });
       }
       
       // Save file
       const { filename, filepath } = saveFile(req.file, studentId, phase);
       
       // Add file to submission
       submission.files.push({
         filename,
         originalName: req.file.originalname,
         mimetype: req.file.mimetype,
         size: req.file.size,
         url: `/api/v1/submissions/${phase}/files/${filename}`,
       });
       
       submission.status = 'Submitted';
       submission.submittedAt = new Date();
       submission.updatedAt = new Date();
       await submission.save();
       
       await ActivityLog.create({
         user_id: studentId,
         action: 'document_submitted',
         entityType: 'Submission',
         entityId: submission._id,
         details: { phase, filename: req.file.originalname },
       });
       
       res.status(201).json({
         data: submission,
         status: 201,
       });
     } catch (error) {
       next(error);
     }
   };
   
   const getSubmission = async (req, res, next) => {
     try {
       const { phase } = req.params;
       const studentId = req.auth.userId;
       
       const submission = await Submission.findOne({
         student_id: studentId,
         phase,
       });
       
       if (!submission) {
         return res.status(404).json({
           error: 'Submission not found',
           code: 'NOT_FOUND',
           status: 404,
         });
       }
       
       res.json({
         data: submission,
         status: 200,
       });
     } catch (error) {
       next(error);
     }
   };
   
   const downloadFile = async (req, res, next) => {
     try {
       const { phase, filename } = req.params;
       const studentId = req.auth.userId;
       
       const submission = await Submission.findOne({
         student_id: studentId,
         phase,
       });
       
       if (!submission) {
         return res.status(404).json({
           error: 'Submission not found',
           code: 'NOT_FOUND',
           status: 404,
         });
       }
       
       const file = submission.files.find(f => f.filename === filename);
       if (!file) {
         return res.status(404).json({
           error: 'File not found',
           code: 'FILE_NOT_FOUND',
           status: 404,
         });
       }
       
       const filepath = getFile(studentId, phase, filename);
       res.download(filepath, file.originalName);
     } catch (error) {
       next(error);
     }
   };
   
   const declareNotNeeded = async (req, res, next) => {
     try {
       const { phase } = req.params;
       const { reason } = req.body;
       const studentId = req.auth.userId;
       
       if (!reason) {
         return res.status(400).json({
           error: 'Declaration reason required',
           code: 'INVALID_INPUT',
           status: 400,
         });
       }
       
       const assignment = await Assignment.findOne({
         student_id: studentId,
         status: 'Active',
       });
       
       if (!assignment) {
         return res.status(400).json({
           error: 'No active assignment found',
           code: 'NO_ASSIGNMENT',
           status: 400,
         });
       }
       
       let submission = await Submission.findOne({
         student_id: studentId,
         phase,
         topic_id: assignment.topic_id,
       });
       
       if (!submission) {
         const dueDate = calculateDueDate(phase);
         submission = await Submission.create({
           student_id: studentId,
           topic_id: assignment.topic_id,
           phase,
           dueDate,
         });
       }
       
       submission.status = 'Declared Not Needed';
       submission.declarationReason = reason;
       submission.declaredAt = new Date();
       await submission.save();
       
       await ActivityLog.create({
         user_id: studentId,
         action: 'submission_declared_not_needed',
         entityType: 'Submission',
         entityId: submission._id,
         details: { phase, reason },
       });
       
       res.json({
         data: submission,
         status: 200,
       });
     } catch (error) {
       next(error);
     }
   };
   
   const calculateDueDate = (phase) => {
     const now = new Date();
     const dueDates = {
       'Initial Statement': new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
       'Progress Report 1': new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
       'Progress Report 2': new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000),
       'Final Dissertation': new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
     };
     return dueDates[phase] || now;
   };
   
   module.exports = {
     submitDocument,
     getSubmission,
     downloadFile,
     declareNotNeeded,
   };
   ```

3. Create `src/routes/submissionRoutes.js`:
   ```javascript
   const express = require('express');
   const { authenticate, requireRole } = require('../middleware/authMiddleware');
   const upload = require('../middleware/fileUpload');
   const {
     submitDocument,
     getSubmission,
     downloadFile,
     declareNotNeeded,
   } = require('../controllers/submissionController');
   
   const router = express.Router();
   
   router.post(
     '/:phase/submit',
     authenticate,
     requireRole('Student'),
     upload.single('file'),
     submitDocument
   );
   
   router.get('/:phase', authenticate, requireRole('Student'), getSubmission);
   router.get('/:phase/files/:filename', authenticate, requireRole('Student'), downloadFile);
   router.post(
     '/:phase/declare-not-needed',
     authenticate,
     requireRole('Student'),
     declareNotNeeded
   );
   
   module.exports = router;
   ```

4. Create `tests/routes/submission.test.js`:
   ```javascript
   const request = require('supertest');
   const app = require('../../src/app');
   const fs = require('fs');
   const Submission = require('../../src/models/Submission');
   const Topic = require('../../src/models/Topic');
   const User = require('../../src/models/User');
   const Assignment = require('../../src/models/Assignment');
   const { generateTokens } = require('../../src/utils/jwt');
   
   describe('Submission Routes', () => {
     let student, supervisor, assignment, studentToken;
     
     beforeEach(async () => {
       await Submission.deleteMany({});
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
     });
     
     test('POST /api/v1/submissions/:phase/submit should accept PDF file', async () => {
       const pdfBuffer = Buffer.from('%PDF-1.4\n test content');
       
       const res = await request(app)
         .post('/api/v1/submissions/Initial%20Statement/submit')
         .set('Authorization', `Bearer ${studentToken}`)
         .attach('file', pdfBuffer, 'test.pdf');
       
       expect(res.status).toBe(201);
       expect(res.body.data.status).toBe('Submitted');
     });
     
     test('POST /api/v1/submissions/:phase/declare-not-needed should mark as declared', async () => {
       const res = await request(app)
         .post('/api/v1/submissions/Initial%20Statement/declare-not-needed')
         .set('Authorization', `Bearer ${studentToken}`)
         .send({ reason: 'No project updates for this phase' });
       
       expect(res.status).toBe(200);
       expect(res.body.data.status).toBe('Declared Not Needed');
     });
   });
   ```

**Validation Checklist**:
- [ ] POST /api/v1/submissions/:phase/submit accepts PDF and DOCX files
- [ ] Rejects files over 50MB
- [ ] Rejects invalid file types
- [ ] Creates submission if not exists
- [ ] Updates existing submission with new file
- [ ] GET /api/v1/submissions/:phase returns submission details
- [ ] POST /api/v1/submissions/:phase/declare-not-needed marks as declared
- [ ] File download works for authorized students
- [ ] All operations logged to ActivityLog

---

## Subtask T026: Implement Supervisor Submission Viewing & Feedback Preparation

**Purpose**: Create endpoints for supervisors to view student submissions.

**Files to Create**:
- `src/controllers/submissionController.js` (add supervisor endpoints)
- `tests/routes/submission.test.js` (add supervisor tests)

**Steps**:

1. Add to `src/controllers/submissionController.js`:
   ```javascript
   const getSupervisorSubmissions = async (req, res, next) => {
     try {
       const supervisorId = req.auth.userId;
       const { phase, status } = req.query;
       
       // Find all assignments where supervisor is assigned
       const assignments = await Assignment.find({
         supervisor_id: supervisorId,
         status: 'Active',
       });
       
       const topicIds = assignments.map(a => a.topic_id);
       
       const filter = { topic_id: { $in: topicIds } };
       if (phase) {
         filter.phase = phase;
       }
       if (status) {
         filter.status = status;
       }
       
       const submissions = await Submission.find(filter)
         .populate('student_id', 'fullName email')
         .populate('topic_id', 'title')
         .sort({ submittedAt: -1 });
       
       res.json({
         data: {
           submissions,
           count: submissions.length,
         },
         status: 200,
       });
     } catch (error) {
       next(error);
     }
   };
   ```

2. Add route in `src/routes/submissionRoutes.js`:
   ```javascript
   router.get(
     '/supervisor/submissions',
     authenticate,
     requireRole('Supervisor'),
     getSupervisorSubmissions
   );
   ```

**Validation Checklist**:
- [ ] GET /api/v1/submissions/supervisor/submissions returns supervisor's submissions
- [ ] Can filter by phase and status
- [ ] Includes student details
- [ ] Requires supervisor role

---

## Subtask T027: Implement Submission Status Management & Deadline Handling

**Purpose**: Add deadline enforcement and status updates.

**Files to Create**:
- `src/controllers/submissionController.js` (add deadline checking)
- `scripts/check-deadlines.js` (background job)

**Steps**:

1. Add middleware to check deadlines:
   ```javascript
   const checkSubmissionDeadlines = async () => {
     try {
       const now = new Date();
       
       // Update overdue submissions
       await Submission.updateMany(
         {
           status: 'Not Submitted',
           dueDate: { $lt: now },
         },
         {
           status: 'Overdue',
           updatedAt: new Date(),
         }
       );
       
       console.log('✓ Submission deadlines checked');
     } catch (error) {
       console.error('Error checking deadlines:', error);
     }
   };
   ```

2. Create `scripts/check-deadlines.js`:
   ```javascript
   require('dotenv').config();
   const mongoose = require('mongoose');
   const { mongoUri } = require('../src/config/env');
   const Submission = require('../src/models/Submission');
   
   const checkDeadlines = async () => {
     try {
       await mongoose.connect(mongoUri);
       
       const now = new Date();
       const result = await Submission.updateMany(
         {
           status: 'Not Submitted',
           dueDate: { $lt: now },
         },
         {
           status: 'Overdue',
           updatedAt: new Date(),
         }
       );
       
       console.log(`✓ Updated ${result.modifiedCount} submissions to overdue status`);
       process.exit(0);
     } catch (error) {
       console.error('✗ Error:', error.message);
       process.exit(1);
     }
   };
   
   checkDeadlines();
   ```

3. Update `package.json`:
   ```json
   "scripts": {
     "check-deadlines": "node scripts/check-deadlines.js"
   }
   ```

**Validation Checklist**:
- [ ] Deadline checking script works
- [ ] Overdue status set automatically
- [ ] Script can be run manually or scheduled (cron)

---

## Subtask T028: Implement Submission Analytics & Reporting

**Purpose**: Add endpoints for submission statistics.

**Files to Create**:
- `src/controllers/submissionController.js` (add analytics)

**Steps**:

1. Add analytics endpoint:
   ```javascript
   const getSubmissionStats = async (req, res, next) => {
     try {
       const studentId = req.auth.userId;
       
       const stats = await Submission.aggregate([
         { $match: { student_id: mongoose.Types.ObjectId(studentId) } },
         {
           $group: {
             _id: '$phase',
             status: { $first: '$status' },
             submittedAt: { $first: '$submittedAt' },
           },
         },
       ]);
       
       const phases = ['Initial Statement', 'Progress Report 1', 'Progress Report 2', 'Final Dissertation'];
       const result = {};
       
       phases.forEach(phase => {
         const stat = stats.find(s => s._id === phase);
         result[phase] = stat ? stat.status : 'Not Submitted';
       });
       
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
- [ ] Aggregation returns correct statistics
- [ ] All 4 phases included

---

## Subtask T029: Comprehensive Submission Testing & Documentation

**Purpose**: Complete test coverage and API documentation.

**Files to Create**:
- `tests/integration/submission.integration.test.js`
- `docs/api/submissions.md`

**Steps**:

Create integration tests and API documentation as previously outlined.

**Validation Checklist**:
- [ ] 80%+ code coverage for submission module
- [ ] All file upload scenarios tested
- [ ] Declaration flow tested
- [ ] Supervisor viewing tested
- [ ] API documentation complete

---

## Definition of Done

- [x] All subtasks T024-T029 completed
- [x] File upload working (PDF, DOCX, max 50MB)
- [x] 4 submission phases implemented
- [x] Deadline enforcement working
- [x] Declaration of non-submission working
- [x] Supervisor viewing submissions
- [x] All operations logged to ActivityLog
- [x] 80%+ code coverage
- [x] API documentation created

## Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| File storage grows unbounded | Medium | High | Implement file size quotas, archival policy |
| File loss on server crash | Medium | High | Backup strategy, consider cloud storage |
| Large file upload timeouts | Low | Medium | Increase timeout, implement chunked upload |
| Path traversal in file access | Low | Critical | Validate filenames, use unique IDs |

## Reviewer Guidance

- Verify file size validation (50MB max)
- Check MIME type validation
- Confirm path traversal prevention
- Verify deadline auto-update working
- Check 80%+ code coverage
- Validate supervisor can view student files securely

---

**Next Work Package**: WP06 (Feedback & Comments)  
**Estimated Start**: Can parallelize with WP07  
**Command**: `spec-kitty implement WP06 --base WP05`

## Activity Log

- 2026-02-07T07:14:06Z – GitHub-Copilot – shell_pid=8196 – lane=doing – Started implementation via workflow command
