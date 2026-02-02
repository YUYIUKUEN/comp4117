# Data Model: FYP Management System MVP

**Feature**: 001-fyp-management-system-mvp  
**Date**: 2026-02-02  
**Phase**: 1 (Design & Contracts)

---

## Entity-Relationship Overview

```
User
├─ Student (applies for topics, submits documents)
├─ Supervisor (publishes topics, reviews applications, assigns students, gives feedback)
└─ Admin (manages users, views all data)

Topic
└─ published_by: Supervisor
   ├─ has_many: Applications (students applying)
   ├─ has_many: Assignments (approved student-supervisor bindings)
   └─ has_many: Submissions (student submissions per topic)

Application
├─ student_id: Student
├─ topic_id: Topic
└─ status: Pending | Approved | Rejected

Assignment
├─ student_id: Student
├─ topic_id: Topic
├─ supervisor_id: Supervisor
└─ status: Active | Completed | Changed

Submission
├─ student_id: Student
├─ phase: Initial Statement | Progress Report 1 | Progress Report 2 | Final Dissertation
├─ has_many: Files (uploaded documents)
├─ has_many: Feedback (supervisor feedback)
└─ status: Not Submitted | Submitted | Overdue | Declared Not Needed

Feedback
├─ submission_id: Submission
├─ supervisor_id: Supervisor
└─ text: String

ActivityLog
├─ user_id: User (who performed action)
├─ action: String
├─ entity_type: String (Topic, Application, Submission, etc.)
├─ entity_id: String
└─ timestamp: DateTime
```

---

## Detailed Entity Schemas

### User

```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  passwordHash: String (bcrypt, 10 rounds),
  fullName: String (required),
  role: Enum ['Student', 'Supervisor', 'Admin'] (required),
  concentration: String (optional, for students: 'Software Engineering', 'Data Science', etc.),
  phone: String (optional),
  officeHours: String (optional, for supervisors),
  createdAt: DateTime,
  updatedAt: DateTime,
  deactivatedAt: DateTime (optional, soft delete)
}
```

**Indexes**:
- `email` (unique)
- `role`
- `concentration`

**Validation Rules**:
- email: Valid email format, unique
- passwordHash: Min 60 characters (bcrypt output)
- fullName: Non-empty string, max 255 chars
- role: One of [Student, Supervisor, Admin]

---

### Topic

```javascript
{
  _id: ObjectId,
  title: String (required, max 255),
  description: String (required, max 5000),
  supervisor_id: ObjectId (FK to User, required),
  concentration: String (required: 'Software Engineering', 'Data Science'),
  academic_year: Integer (e.g., 4, 5),
  keywords: [String] (max 10 keywords),
  referenceDocuments: [
    {
      name: String,
      url: String
    }
  ],
  status: Enum ['Draft', 'Active', 'Archived'] (default: 'Active'),
  createdAt: DateTime,
  updatedAt: DateTime
}
```

**Indexes**:
- `supervisor_id`
- `concentration`
- `academic_year`
- `status`
- `createdAt` (for sorting by newest topics)

**Validation Rules**:
- title: Non-empty, max 255 chars
- description: Non-empty, max 5000 chars
- supervisor_id: Valid ObjectId of existing Supervisor user
- concentration: Valid concentration value
- academic_year: 1-6 range (typical university years)
- keywords: Array of 0-10 unique strings

---

### Application

```javascript
{
  _id: ObjectId,
  student_id: ObjectId (FK to User, required),
  topic_id: ObjectId (FK to Topic, required),
  preference_rank: Integer (1st choice, 2nd choice, etc., 1-5 typically),
  status: Enum ['Pending', 'Approved', 'Rejected'] (default: 'Pending'),
  supervisorNotes: String (optional, max 1000),
  appliedAt: DateTime,
  decidedAt: DateTime (optional, when supervisor approved/rejected),
  createdAt: DateTime,
  updatedAt: DateTime
}
```

**Indexes**:
- `student_id`
- `topic_id`
- `status`
- `appliedAt`
- Compound: `(student_id, topic_id)` (unique: student cannot apply twice for same topic)

**Validation Rules**:
- student_id: Valid ObjectId of existing Student user
- topic_id: Valid ObjectId of existing Topic
- preference_rank: Integer 1-5
- status: One of [Pending, Approved, Rejected]
- supervisorNotes: Max 1000 chars

---

### Assignment

```javascript
{
  _id: ObjectId,
  student_id: ObjectId (FK to User, required),
  topic_id: ObjectId (FK to Topic, required),
  supervisor_id: ObjectId (FK to User, required),
  assigned_at: DateTime,
  status: Enum ['Active', 'Completed', 'Changed'] (default: 'Active'),
  createdAt: DateTime,
  updatedAt: DateTime
}
```

**Indexes**:
- `student_id` (unique: one active assignment per student at a time)
- `topic_id`
- `supervisor_id`
- `status`

**Validation Rules**:
- student_id: Valid ObjectId of existing Student user
- topic_id: Valid ObjectId of existing Topic
- supervisor_id: Valid ObjectId of existing Supervisor user
- status: One of [Active, Completed, Changed]
- Constraint: Only one Active assignment per student

---

### Submission

```javascript
{
  _id: ObjectId,
  student_id: ObjectId (FK to User, required),
  topic_id: ObjectId (FK to Topic, required),
  phase: Enum [
    'Initial Statement',
    'Progress Report 1',
    'Progress Report 2',
    'Final Dissertation'
  ] (required),
  status: Enum [
    'Not Submitted',
    'Submitted',
    'Overdue',
    'Declared Not Needed'
  ] (default: 'Not Submitted'),
  submittedAt: DateTime (optional),
  files: [
    {
      filename: String,
      originalName: String,
      mimetype: String,
      size: Integer,
      uploadedAt: DateTime,
      url: String (file storage path/URL)
    }
  ],
  declarationReason: String (optional, max 1000, populated if status is 'Declared Not Needed'),
  declaredAt: DateTime (optional),
  dueDate: DateTime (optional, for future reminder functionality),
  createdAt: DateTime,
  updatedAt: DateTime
}
```

**Indexes**:
- `student_id`
- `topic_id`
- `phase`
- `status`
- `submittedAt`
- Compound: `(student_id, phase)` (unique: one submission per phase per student)

**Validation Rules**:
- student_id: Valid ObjectId of existing Student
- topic_id: Valid ObjectId of existing Topic
- phase: One of valid phase values
- status: One of valid status values
- files[].mimetype: Restricted to allowed types (PDF, Word, etc.)
- files[].size: Max 50MB per file
- declarationReason: Max 1000 chars (required if status is 'Declared Not Needed')

**File Storage Strategy** (MVP):
- Files stored on local server in `uploads/` directory
- Path format: `uploads/<student_id>/<topic_id>/<phase>/<filename>`
- Future Phase 2: Migrate to cloud storage (S3, Azure Blob)

---

### Feedback

```javascript
{
  _id: ObjectId,
  submission_id: ObjectId (FK to Submission, required),
  supervisor_id: ObjectId (FK to User, required),
  feedbackText: String (required, max 5000),
  createdAt: DateTime,
  updatedAt: DateTime
}
```

**Indexes**:
- `submission_id`
- `supervisor_id`
- `createdAt`

**Validation Rules**:
- submission_id: Valid ObjectId of existing Submission
- supervisor_id: Valid ObjectId of existing Supervisor user
- feedbackText: Non-empty, max 5000 chars

**Future Enhancements** (Phase 2):
- Add `visibility` field: 'Student Visible' | 'Supervisor Only' | 'Admin Only'
- Add `rubricScore` field for structured grading
- Add `attachments` field for rubric templates

---

### ActivityLog

```javascript
{
  _id: ObjectId,
  user_id: ObjectId (FK to User, required),
  action: String (required, e.g., 'submission_created', 'application_approved', 'feedback_given'),
  entityType: String (required, e.g., 'Submission', 'Application', 'Topic'),
  entityId: ObjectId (ID of affected entity, required),
  details: {
    // Variable JSON object depending on action type
    // Examples:
    // { submittedPhase: 'Initial Statement' }
    // { approvalDecision: 'Approved', reason: '...' }
    // { changedFrom: 'value1', changedTo: 'value2' }
  },
  timestamp: DateTime (immutable, set at creation),
  ipAddress: String (optional, for audit trail)
}
```

**Indexes**:
- `user_id`
- `entityType`
- `entityId`
- `timestamp` (for audit trail queries)
- Compound: `(user_id, timestamp)` (for per-user activity reports)

**Validation Rules**:
- user_id: Valid ObjectId of existing User
- action: Non-empty string, max 100 chars
- entityType: One of [User, Topic, Application, Assignment, Submission, Feedback]
- entityId: Valid ObjectId
- timestamp: Auto-set to current time, immutable

**Immutability**: ActivityLog records cannot be updated or deleted (append-only)

---

## Database Design Patterns

### State Transitions

**Submission States**:
```
Not Submitted
├─→ Submitted (via upload)
└─→ Declared Not Needed (via declaration)

Submitted
└─→ Submitted (resubmission allowed, updates files array)

Overdue (auto-managed during phase deadline checks)
```

**Application States**:
```
Pending
├─→ Approved (supervisor approval)
└─→ Rejected (supervisor rejection)
```

**Assignment States**:
```
Active
├─→ Completed (at end of FYP)
└─→ Changed (topic change, deferred to Phase 2)
```

### Soft Deletes

User accounts support soft deletion:
- Set `deactivatedAt` timestamp instead of hard delete
- Queries filter out deactivated users by default
- Preserves historical data for audit trail

---

## Data Consistency & Integrity

### Referential Integrity

- All foreign keys validated at application level (Mongoose pre-save hooks)
- No foreign key constraints in MongoDB (not supported), but schema validation enforces them
- Cascade behavior:
  - When Topic is deleted: Mark associated Applications/Assignments as inactive
  - When User (Supervisor) is deactivated: Topics remain but mark as archived
  - When Student is deactivated: Submissions are preserved for audit

### Unique Constraints

- User.email (unique index)
- Application: (student_id, topic_id) - student cannot apply twice
- Submission: (student_id, phase) - one submission per phase per student
- Assignment: Only one active assignment per student

### Validation Rules Enforced

- Email format validation
- Password hash length (bcrypt output: 60+ chars)
- File MIME type whitelist
- File size limits (max 50MB per file)
- Concentration values (whitelisted)
- Role values (whitelisted)

---

## Indexing Strategy

**Frequently Queried Combinations**:
- Find topics by supervisor: `db.topics.find({supervisor_id, status: 'Active'})`
- Find applications by student: `db.applications.find({student_id})`
- Find submissions by student and phase: `db.submissions.find({student_id, phase})`
- Find active assignment for student: `db.assignments.findOne({student_id, status: 'Active'})`
- Audit trail by user: `db.activityLogs.find({user_id}).sort({timestamp: -1})`

**Index Summary**:
```javascript
// Users
db.users.createIndex({email: 1}, {unique: true});
db.users.createIndex({role: 1});
db.users.createIndex({concentration: 1});

// Topics
db.topics.createIndex({supervisor_id: 1});
db.topics.createIndex({concentration: 1});
db.topics.createIndex({academic_year: 1});
db.topics.createIndex({status: 1});
db.topics.createIndex({createdAt: -1});

// Applications
db.applications.createIndex({student_id: 1});
db.applications.createIndex({topic_id: 1});
db.applications.createIndex({status: 1});
db.applications.createIndex({appliedAt: -1});
db.applications.createIndex({student_id: 1, topic_id: 1}, {unique: true});

// Assignments
db.assignments.createIndex({student_id: 1}, {unique: true, sparse: true}); // Only for Active
db.assignments.createIndex({topic_id: 1});
db.assignments.createIndex({supervisor_id: 1});
db.assignments.createIndex({status: 1});

// Submissions
db.submissions.createIndex({student_id: 1});
db.submissions.createIndex({topic_id: 1});
db.submissions.createIndex({phase: 1});
db.submissions.createIndex({status: 1});
db.submissions.createIndex({submittedAt: -1});
db.submissions.createIndex({student_id: 1, phase: 1}, {unique: true});

// Feedback
db.feedback.createIndex({submission_id: 1});
db.feedback.createIndex({supervisor_id: 1});
db.feedback.createIndex({createdAt: -1});

// ActivityLog
db.activityLog.createIndex({user_id: 1});
db.activityLog.createIndex({entityType: 1});
db.activityLog.createIndex({entityId: 1});
db.activityLog.createIndex({timestamp: -1});
db.activityLog.createIndex({user_id: 1, timestamp: -1});
```

---

## Migration & Seeding Strategy

### Initial Data Setup

1. **Create admin user**: Hardcoded initial admin account for system bootstrap
2. **Create concentrations**: Seed concentration list (Software Engineering, Data Science)
3. **Create supervisors**: Admin creates supervisor accounts
4. **Create student accounts**: Bulk import from CSV (future) or manual creation

### Future Migrations (Phase 2+)

- Add `rubricScore` field to Submission for grading system
- Add `visibility` field to Feedback for confidential feedback
- Add `refreshToken` table for token refresh mechanism
- Add indexes for new queries as feature expand

---

## Data Privacy & Retention

### Student Privacy

- Students cannot view other students' submissions
- Students cannot view supervisor private notes (deferred to Phase 2)
- Supervisors can only see submissions from their assigned students

### Data Retention

- All submissions retained indefinitely (audit trail requirement)
- Activity logs retained indefinitely (compliance)
- Soft-deleted user accounts retain associated data
- Topic archive maintains historical records for student reference

---

## Query Performance Targets

| Query | Expected Performance | Index Used |
|-------|----------------------|-----------|
| Get active topics by concentration | < 50ms | concentration, status |
| Get student's applications | < 20ms | student_id |
| Get supervisor's students | < 30ms | supervisor_id |
| Get submission status for phase | < 20ms | student_id, phase |
| Get audit trail for user | < 100ms | user_id, timestamp |

---

## Conclusion

The data model supports all MVP features with clear separation of concerns, role-based access control, and immutable audit trails. Schema validation prevents invalid data at the source. Indexing strategy optimizes common queries.

**Ready for API contract generation in Phase 1**.
