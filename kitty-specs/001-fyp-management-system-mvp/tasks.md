# Work Packages: FYP Management System MVP

**Feature**: 001-fyp-management-system-mvp  
**Date**: 2026-02-02  
**Total Work Packages**: 13  
**Phase**: Task Generation

---

## Work Package Overview

| WP | Title | Subtasks | Est. Lines | Priority | Status |
|---|-------|----------|-----------|----------|--------|
| WP01 | Backend Foundation & Database | 5 | 300 | P0 | Planned |
| WP02 | User Authentication API | 6 | 400 | P0 | Planned |
| WP03 | Topic Management API | 7 | 450 | P0 | Planned |
| WP04 | Application & Matching API | 6 | 400 | P0 | Planned |
| WP05 | Submission & Document Management | 7 | 450 | P0 | Planned |
| WP06 | Feedback System | 4 | 250 | P1 | Planned |
| WP07 | Activity Logging & Audit Trail | 4 | 250 | P1 | Planned |
| WP08 | Admin Dashboards & Reporting | 5 | 320 | P1 | Planned |
| WP09 | Frontend Project Setup | 4 | 220 | P0 | Planned |
| WP10 | Frontend Auth UI & Login Flow | 6 | 380 | P0 | Planned |
| WP11 | Topic Discovery & Search UI | 7 | 440 | P0 | Planned |
| WP12 | Submission Tracking UI | 7 | 450 | P0 | Planned |
| WP13 | Dashboard & Feedback UI | 6 | 400 | P0 | Planned |

**Total Subtasks**: 74  
**Total Est. Lines**: 4,840  
**Average WP Size**: 5.7 subtasks, 373 lines

---

## Phase 1: Backend Foundation & Infrastructure

### WP01: Backend Foundation & Database

**Goal**: Establish Express.js project structure, MongoDB connection, schema setup, and foundational middleware.

**Priority**: P0 (Blocking)  
**Estimated Size**: 5 subtasks, ~300 lines  
**Independent Test**: Backend server starts, connects to MongoDB, health check endpoint works

**Subtasks**:
- [x] T001: Initialize Express.js project with dependencies (express, mongoose, dotenv, bcrypt, jsonwebtoken)
- [x] T002: Configure MongoDB connection with Mongoose (Atlas or local)
- [x] T003: Create base middleware (CORS, body parser, error handler, logging)
- [x] T004: Define core Mongoose schemas (User, Topic, Application, Assignment, Submission, Feedback, ActivityLog)
- [x] T005: Write database initialization script and seed initial admin user

**Dependencies**: None  
**Parallelization**: T001 → (T002, T003) in parallel → (T004, T005) in parallel

**Implementation Notes**:
- Use environment variables for DB connection, JWT secret, API key
- Error handler must format all responses as `{ error, code, status }`
- Create `/src/middleware/`, `/src/models/`, `/src/config/` directories
- Health check endpoint: `GET /api/v1/health` returns `{ status: ok }`

**Risks**: Database connectivity, environment configuration

---

### WP02: User Authentication API

**Goal**: Implement complete authentication system with login, logout, JWT token management, password hashing, and role-based access control.

**Priority**: P0 (Blocking)  
**Estimated Size**: 6 subtasks, ~400 lines  
**Independent Test**: Login with valid credentials returns JWT, invalid credentials return 401, logout invalidates session

**Subtasks**:
- [x] T006: Implement POST `/api/v1/auth/login` endpoint (email/password validation, bcrypt hashing, JWT generation)
- [x] T007: Implement POST `/api/v1/auth/logout` endpoint (token invalidation)
- [x] T008: Create authentication middleware for protected routes (JWT verification, role check)
- [x] T009: Implement user profile endpoints (GET, PUT `/api/v1/users/profile`)
- [x] T010: Create admin user management endpoints (POST create user, GET list users with filtering)
- [x] T011: Write comprehensive auth tests (Jest + Supertest covering happy path, edge cases, security)

**Dependencies**: WP01  
**Command**: `spec-kitty implement WP02 --base WP01`  
**Parallelization**: T006-T010 can be developed in parallel; T011 after endpoints complete

**Implementation Notes**:
- Password: bcrypt 10 rounds (constitution requirement)
- JWT: HS256, 24-hour expiry, issued_at + expires_at claims
- Rate limiting: 5 failed attempts per IP per 15 minutes (future: integrate rate-limit middleware)
- Role validation: Student | Supervisor | Admin
- All errors return consistent format with `code` field

**Test Coverage**: Login success/failure, token expiry, concurrent requests, SQL injection prevention

**Risks**: Token hijacking, weak password validation, timing attacks (use constant-time comparison)

---

## Phase 2: Topic & Application Management

### WP03: Topic Management API

**Goal**: Implement topic publishing, discovery, filtering, and retrieval endpoints for supervisors and students.

**Priority**: P0 (Blocking)  
**Estimated Size**: 7 subtasks, ~450 lines  
**Independent Test**: Supervisor can publish topic, students can search by concentration/year/keyword, full list returns in <2 seconds

**Subtasks**:
- [x] T012: Implement POST `/api/v1/topics` endpoint (supervisor publishes topic with description, keywords, concentration, year)
- [x] T013: Implement GET `/api/v1/topics` with filtering (concentration, academic_year, keyword search, pagination)
- [x] T014: Implement GET `/api/v1/topics/:topicId` endpoint (full details, supervisor info, reference documents)
- [x] T015: Implement topic archive feature (GET `/api/v1/topics/archive` with same filtering)
- [x] T016: Add full-text search capability (MongoDB text indexes on title, description)
- [x] T017: Implement supervisor topic management (PUT `/api/v1/topics/:id`, DELETE/archive)
- [x] T018: Write comprehensive topic tests (search performance, filtering accuracy, pagination)

**Dependencies**: WP02  
**Command**: `spec-kitty implement WP03 --base WP02`  
**Parallelization**: [P] T012, T013, T014, T015 can be developed independently

**Implementation Notes**:
- Full list must load immediately (no pagination requirement, but implement pagination option)
- Filtering must work without page reload
- Supervisor can only edit/delete their own topics
- Archive topics (soft delete) remain searchable
- Search performance target: <200ms for 100+ topics

**Database**: Create indexes on (supervisor_id, status), (concentration), (academicYear), (createdAt)

**Test Coverage**: Search performance, filter combinations, pagination, authorization, edge cases (empty results, special characters)

**Risks**: Search performance with large datasets, supervisor authorization bypass

---

### WP04: Application & Matching API

**Goal**: Implement student application submission and supervisor approval/rejection workflows.

**Priority**: P0 (Blocking)  
**Estimated Size**: 6 subtasks, ~400 lines  
**Independent Test**: Student applies for topic with preference, supervisor approves/rejects, assignment created on approval

**Subtasks**:
- [ ] T019: Implement POST `/api/v1/applications` endpoint (student applies with preference_rank)
- [ ] T020: Implement GET `/api/v1/applications/my-applications` (student views their applications)
- [ ] T021: Implement GET `/api/v1/applications/topic/:topicId` (supervisor views applicants for topic)
- [ ] T022: Implement POST `/api/v1/applications/:id/approve` (supervisor approves, creates Assignment, notifies student)
- [ ] T023: Implement POST `/api/v1/applications/:id/reject` (supervisor rejects with optional notes)
- [x] T024: Write comprehensive application tests (permissions, workflow state transitions, duplicate prevention)

**Dependencies**: WP03  
**Command**: `spec-kitty implement WP04 --base WP03`  
**Parallelization**: [P] T019-T021 can be developed in parallel; T022-T023 depend on initial endpoints

**Implementation Notes**:
- Student cannot apply twice for same topic (unique constraint)
- Approval creates Assignment record automatically
- Preference ranking (1st, 2nd, 3rd choice) supported
- Supervisor notes captured for both approval and rejection
- Only assigned topics visible to students initially

**Database**: Unique constraint on (student_id, topic_id) in Applications

**Test Coverage**: Duplicate application prevention, assignment creation on approval, permission checks, state transitions

**Risks**: Race condition on assignment creation, cascade deletion if topic deleted

---

## Phase 3: Document Submission & Tracking

### WP05: Submission & Document Management

**Goal**: Implement multi-phase submission tracking, file upload handling, declaration system, and status management.

**Priority**: P0 (Blocking)  
**Estimated Size**: 7 subtasks, ~450 lines  
**Independent Test**: Student uploads document for phase, status updates to "Submitted", can resubmit, can declare not needed

**Subtasks**:
- [x] T025: Implement POST `/api/v1/submissions/:phase/upload` (file upload, validation, storage)
- [x] T026: Implement file validation (MIME type whitelist, size limit 50MB, virus scan placeholder)
- [x] T027: Implement GET `/api/v1/submissions/my-submissions` (student views all submissions with status, due dates)
- [x] T028: Implement POST `/api/v1/submissions/:phase/declare-not-needed` (declaration with justification)
- [x] T029: Implement resubmission logic (update existing submission, maintain version history)
- [x] T030: Create submission status tracking (Not Submitted, Submitted, Overdue, Declared Not Needed)
- [x] T031: Write comprehensive submission tests (upload validation, resubmission, declarations, permission checks)

**Dependencies**: WP04  
**Command**: `spec-kitty implement WP05 --base WP04`  
**Parallelization**: [P] T025-T027 can be developed in parallel; T028-T031 follow

**Implementation Notes**:
- File storage: Local `/uploads/` directory (MVP); phase 2 migrate to S3/Azure
- Submission phases: Initial Statement, Progress Report 1, Progress Report 2, Final Dissertation
- No hard blocking: students can move to next phase without completing current
- Declaration requires justification (max 1000 chars)
- Status: Not Submitted → Submitted OR Declared Not Needed
- Resubmission appends to files array, updates submittedAt
- Supervisor can see submission status for assigned students

**Database**: Indexes on (student_id, phase), (student_id, status)

**Test Coverage**: MIME validation, size limits, resubmission workflow, declaration approval, permission isolation

**Risks**: File storage exhaustion, malicious file uploads, concurrent submissions, declaration spam

---

### WP06: Feedback System

**Goal**: Implement supervisor feedback on student submissions and student feedback viewing.

**Priority**: P1  
**Estimated Size**: 4 subtasks, ~250 lines  
**Independent Test**: Supervisor adds feedback to submission, student views feedback, feedback visible with timestamp

**Subtasks**:
- [x] T032: Implement POST `/api/v1/feedback/submission/:submissionId` (supervisor adds text feedback)
- [x] T033: Implement GET `/api/v1/feedback/submission/:submissionId` (student views feedback with supervisor name)
- [x] T034: Create feedback history (maintain all feedback versions, timestamps)
- [x] T035: Write feedback tests (permission checks, timestamp accuracy, retrieval)

**Dependencies**: WP05  
**Command**: `spec-kitty implement WP06 --base WP05`  
**Parallelization**: [P] T032-T033 can be developed in parallel

**Implementation Notes**:
- Feedback is student-visible (confidential feedback deferred to Phase 2)
- Supervisor can only feedback on their assigned students
- Students can only view feedback on their own submissions
- Feedback text max 5000 chars
- Future enhancement: rubric-based scoring, multiple feedback tiers (student-visible, supervisor-only, admin-only)

**Database**: Indexes on (submission_id, supervisor_id), (createdAt)

**Test Coverage**: Permission isolation, feedback visibility, supervisor ownership

**Risks**: Feedback leakage to unauthorized users, accidental deletion of feedback

---

### WP07: Activity Logging & Audit Trail

**Goal**: Implement immutable audit logging for compliance and system monitoring.

**Priority**: P1  
**Estimated Size**: 4 subtasks, ~250 lines  
**Independent Test**: All user actions logged with timestamps and user info, logs are immutable, admin can query by user/action

**Subtasks**:
- [x] T036: Create ActivityLog model and middleware to capture all actions (submissions, approvals, feedback)
- [x] T037: Implement activity log queries (GET `/api/v1/admin/activity-log` with filtering by user, action, date)
- [x] T038: Add audit trail validation (ensure logs are immutable, no deletions)
- [x] T039: Write activity logging tests (log completeness, immutability, filtering accuracy)

**Dependencies**: WP02  
**Command**: `spec-kitty implement WP07 --base WP02`  
**Parallelization**: [P] T036-T037 can be developed in parallel; T038-T039 follow

**Implementation Notes**:
- Log every action: submissions, approvals, rejections, feedback, topic changes
- Fields: user_id, action, entityType, entityId, details (JSON), timestamp (immutable), ipAddress (optional)
- Actions: submission_created, application_approved, application_rejected, feedback_given, declaration_submitted, etc.
- Admin-only access to logs
- Logs cannot be updated or deleted (write-only after creation)
- Query by user, date range, action type, entity type

**Database**: Append-only collection, indexes on (user_id, timestamp), (entityType, entityId)

**Test Coverage**: Log creation, query accuracy, immutability, filtering

**Risks**: Log storage growth, query performance with large logs

---

### WP08: Admin Dashboards & Reporting

**Goal**: Implement admin dashboard with system overview, student status tracking, and reporting endpoints.

**Priority**: P1  
**Estimated Size**: 5 subtasks, ~320 lines  
**Independent Test**: Admin dashboard loads <3 seconds, shows accurate student count/status, submission completion rates

**Subtasks**:
- [x] T040: Implement GET `/api/v1/dashboard/admin` (statistics: total students, supervisors, topics, assignments, submission rates)
- [x] T041: Implement student list view with filtering (by concentration, supervisor, status)
- [x] T042: Implement submission status reporting (completion rates per phase)
- [x] T043: Implement activity summary (recent actions, email tracking)
- [x] T044: Write admin dashboard tests (data accuracy, permission checks, performance)

**Dependencies**: WP01, WP05, WP07  
**Command**: `spec-kitty implement WP08 --base WP07`  
**Parallelization**: [P] T040-T042 can be developed in parallel

**Implementation Notes**:
- Dashboard must load within 3 seconds (optimize queries with aggregation)
- Show: total students, supervisors, active topics, assignments (pending/active), submission completion by phase
- Filter students by: concentration, supervisor, submission status
- Admin bulk operations: export to CSV, mark status, etc. (deferred to Phase 2)
- Recent activity log preview (last 20 actions)
- Email tracking placeholder for future reminders

**Database**: Use MongoDB aggregation for statistics (avoid expensive scans)

**Test Coverage**: Dashboard load time, accuracy of statistics, filtering, permission checks

**Risks**: Dashboard performance with large datasets, data staleness

---

## Phase 4: Frontend - Core Infrastructure

### WP09: Frontend Project Setup

**Goal**: Initialize Vue 3 project with Vite, router, state management (Pinia), and foundational structure.

**Priority**: P0 (Blocking)  
**Estimated Size**: 4 subtasks, ~220 lines  
**Independent Test**: Frontend dev server starts on port 5173, hot reload works, Axios configured for backend API

**Subtasks**:
- [x] T045: Initialize Vue 3 + Vite project with dependencies (vite, vue, vue-router, pinia, axios, vitest, playwright)
- [x] T046: Configure Vite for development (port 5173, hot reload, environment variables)
- [x] T047: Setup Pinia stores structure (authStore, topicStore, submissionStore) with basic state
- [x] T048: Create project directory structure (/src/components, /src/pages, /src/stores, /src/services, /tests)

**Dependencies**: None  
**Parallelization**: [P] T045-T048 can be developed in parallel

**Implementation Notes**:
- Use Composition API + `<script setup>` syntax (modern Vue 3)
- Pinia stores use defineStore with composition syntax
- Axios baseURL: VITE_API_URL environment variable
- Add ESLint + Prettier for code quality
- Router with guards for authentication

**Test Coverage**: Dev server startup, hot reload, API client initialization

**Risks**: Dependency conflicts, build issues

---

## Phase 5: Frontend - Authentication & Navigation

### WP10: Frontend Auth UI & Login Flow

**Goal**: Implement login/logout pages, auth state management, navigation guards, and session handling.

**Priority**: P0 (Blocking)  
**Estimated Size**: 6 subtasks, ~380 lines  
**Independent Test**: User can login with credentials, token stored in localStorage, redirect to dashboard, logout clears token

**Subtasks**:
- [x] T049: Create LoginForm component (email/password inputs, validation, error messages)
- [x] T050: Implement auth service (login API call, token storage, logout)
- [x] T051: Create authStore with Pinia (user state, login/logout actions, computed properties for roles)
- [x] T052: Implement route guards (auth check, redirect to login if not authenticated, role-based redirects)
- [x] T053: Create layout components (Navbar with user menu, logout button, role-based navigation)
- [x] T054: Write component tests (login validation, auth state updates, token management)

**Dependencies**: WP09  
**Command**: `spec-kitty implement WP10 --base WP09`  
**Parallelization**: [P] T049-T051 can be developed in parallel; T052-T054 follow

**Implementation Notes**:
- Login form: email, password inputs with Vue validation (email format, required fields)
- Token storage: localStorage (httpOnly cookies future improvement)
- Auth guard: check token validity, redirect to login if expired
- Role-based navigation: Student/Supervisor/Admin see different menu options
- Error handling: 401 → redirect to login, show error message for other errors
- User profile in navbar: name, role, logout button

**Test Coverage**: Login flow, token storage, navigation guards, error handling, logout

**Risks**: XSS via localStorage, token theft, hardcoded URLs

---

## Phase 6: Frontend - Topic & Application Discovery

### WP11: Topic Discovery & Search UI

**Goal**: Implement topic listing, filtering, search, and application workflow UI.

**Priority**: P0 (Blocking)  
**Estimated Size**: 7 subtasks, ~440 lines  
**Independent Test**: Full topic list loads immediately, filters work without page reload, student can apply with preference ranking

**Subtasks**:
- [x] T055: Create TopicList component (display all topics with pagination options)
- [x] T056: Create TopicFilter component (inline filters: concentration, year, keyword search)
- [x] T057: Implement topic search service (Axios call with query params)
- [ ] T058: Create TopicDetail modal/page (supervisor info, requirements, reference docs, apply button)
- [ ] T059: Implement application form (preference ranking 1-5, submit application)
- [ ] T060: Create topicStore with Pinia (topics state, search actions, filters)
- [ ] T061: Write component tests (list rendering, filter accuracy, application submission)

**Dependencies**: WP10  
**Command**: `spec-kitty implement WP11 --base WP10`  
**Parallelization**: [P] T055-T057 can be developed in parallel; T058-T061 follow

**Implementation Notes**:
- Topic list: display full list immediately (no submit-then-show workflow)
- Filters: concentration (dropdown), year (checkbox), keyword (text input)
- Filters update URL params for bookmarkability
- Search performance: return results in <2 seconds
- Topic detail: supervisor name/email, description, reference documents, apply button
- Application: preference ranking (1st, 2nd, 3rd choice), confirmation dialog
- Student can view their applications status
- Supervisor can view applicants for their topics (different view)

**Test Coverage**: List rendering, filter combinations, search performance, application validation, pagination

**Risks**: Search performance, filter state management, race conditions in search

---

## Phase 7: Frontend - Submissions & Status Tracking

### WP12: Submission Tracking UI

**Goal**: Implement submission phases display, document upload, declaration form, and status visualization.

**Priority**: P0 (Blocking)  
**Estimated Size**: 7 subtasks, ~450 lines  
**Independent Test**: Student sees all submission phases with status, can upload document, can declare not needed, resubmit works

**Subtasks**:
- [x] T062: Create SubmissionPhases component (display 4 phases with status: Not Submitted, Submitted, Overdue, Declared)
- [x] T063: Create FileUpload component (drag-drop, file validation, progress indicator)
- [x] T064: Create DeclarationForm component (reason text, justification, submit)
- [x] T065: Create submission service (upload API call, status polling, error handling)
- [ ] T066: Implement submissionStore with Pinia (submissions state, upload/declare actions)
- [ ] T067: Create StatusBadge component (visual indicators for each status)
- [ ] T068: Write component tests (upload validation, status updates, declaration flow)

**Dependencies**: WP10  
**Command**: `spec-kitty implement WP12 --base WP10`  
**Parallelization**: [P] T062-T065 can be developed in parallel; T066-T068 follow

**Implementation Notes**:
- Phases: Initial Statement, Progress Report 1, Progress Report 2, Final Dissertation
- Status display: Not Submitted (red), Submitted (green), Overdue (orange), Declared (yellow)
- File upload: drag-drop or click, progress bar, size validation (max 50MB)
- No hard blocking: visual warning if required phase missing, but allow progression
- Declaration: justify why document not needed (max 1000 chars)
- Resubmission: replace previous file, keep version history
- Supervisor feedback visible below submission status

**Test Coverage**: Upload validation, file type checking, resubmission, declaration flow, status accuracy

**Risks**: Large file uploads, concurrent submissions, UI freezing during upload

---

## Phase 8: Frontend - Dashboards & Feedback

### WP13: Dashboard & Feedback UI

**Goal**: Implement role-specific dashboards (Student, Supervisor, Admin) and feedback viewing.

**Priority**: P0 (Blocking)  
**Estimated Size**: 6 subtasks, ~400 lines  
**Independent Test**: Student dashboard shows topic/supervisor/submissions, Supervisor dashboard shows students list, Admin dashboard shows statistics

**Subtasks**:
- [ ] T069: Create StudentDashboard component (assigned topic, supervisor, submissions status, feedback history)
- [ ] T070: Create SupervisorDashboard component (list of students, their submission status, pending applications)
- [ ] T071: Create AdminDashboard component (statistics, student list with filtering, activity log)
- [ ] T072: Create FeedbackView component (display feedback from supervisor with timestamp)
- [ ] T073: Implement dashboard service (fetch dashboard data, students list, statistics)
- [ ] T074: Write dashboard tests (permission checks, data accuracy, filtering)

**Dependencies**: WP11, WP12  
**Command**: `spec-kitty implement WP13 --base WP12`  
**Parallelization**: [P] T069-T072 can be developed in parallel; T073-T074 follow

**Implementation Notes**:
- Student dashboard: topic title, supervisor name/email, submission phases with status, reference documents, feedback history
- Supervisor dashboard: students list (sortable), submission status per student, pending approvals, feedback interface
- Admin dashboard: total counts (students, supervisors, topics), assignment status, completion rates per phase, user list with filters
- Feedback view: supervisor name, feedback text, creation date, read-only
- Dashboard performance: load within 3 seconds
- Role-based routing: auth guard redirects to correct dashboard

**Test Coverage**: Dashboard loading, data accuracy, permission isolation, role-based rendering

**Risks**: Dashboard performance with large datasets, data staleness, role-based access bypass

---

## Dependencies Summary

```
WP01 (Foundation)
  ├── WP02 (Auth)
  │   ├── WP03 (Topics)
  │   │   └── WP04 (Applications)
  │   │       └── WP05 (Submissions)
  │   │           ├── WP06 (Feedback)
  │   │           └── WP08 (Admin Dashboard)
  │   └── WP07 (Activity Logging) ← Can parallelize with WP03
  │
  └── WP09 (Frontend Setup)
      └── WP10 (Auth UI)
          ├── WP11 (Topic Discovery)
          ├── WP12 (Submissions UI)
          └── WP13 (Dashboards)
```

**Parallelization Opportunities**:
- Backend: WP02, WP09 can start immediately after WP01
- Backend: WP03, WP07 can parallelize (both depend on WP02)
- Backend: WP06, WP08 can parallelize (different concerns)
- Frontend: WP10 can parallelize with backend development
- Frontend: WP11, WP12, WP13 can parallelize after WP10

---

## Success Criteria by Work Package

**WP01**: Server starts, DB connected, health check works  
**WP02**: Login returns JWT, invalid credentials return 401, auth middleware blocks unauth requests  
**WP03**: Topic list returns <200ms, filtering works, search finds all matching topics  
**WP04**: Student can apply, supervisor can approve, assignment created  
**WP05**: Files uploaded, status updates, resubmission works, declarations recorded  
**WP06**: Feedback visible to student, supervisor can add feedback  
**WP07**: All actions logged with timestamps, logs immutable  
**WP08**: Dashboard loads <3 seconds, statistics accurate  
**WP09**: Dev server runs, Pinia stores initialized  
**WP10**: Login form validates, token stored, logout clears session  
**WP11**: Topic list renders, filters work, student can apply  
**WP12**: Files upload, status displays, declarations recorded  
**WP13**: Dashboards load, data displays correctly, permissions enforced  

---

## Estimated Total Effort

**Total Work Packages**: 13  
**Total Subtasks**: 74  
**Total Est. Lines**: 4,840  
**Average Lines per WP**: 373  

**Distribution**:
- Backend: 8 WPs (40 subtasks, ~2,600 lines)
- Frontend: 5 WPs (34 subtasks, ~2,240 lines)

**Parallelization**: Can reduce timeline by ~40% with parallel development of backend and frontend

---

## Next Steps

1. Generate individual WP prompt files (WP01-WP13)
2. Finalize tasks with dependency parsing
3. Begin implementation with MVP-critical path: WP01 → WP02 → (WP03 | WP09) → ...
