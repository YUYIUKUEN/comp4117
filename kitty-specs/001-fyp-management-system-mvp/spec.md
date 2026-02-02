# FYP Management System - MVP

**Feature #**: 001  
**Friendly Name**: FYP Management System - MVP  
**Mission**: software-dev  
**Status**: Specification  
**Created**: 2026-02-02

---

## Executive Summary

The Final Year Project (FYP) Management System is a web-based platform enabling universities to manage the complete FYP lifecycle: from topic discovery and student-supervisor matching, through submission tracking, to feedback and grading. The MVP establishes core infrastructure for authentication, topic browsing/application, document management, and dashboards to replace manual Excel-based processes and email coordination.

**Target Users**: Students, Supervisors/Professors, Admin/Staff  
**Primary Use Cases**: Topic selection, student-supervisor matching, document submission tracking, progress monitoring

---

## User Actors

1. **Student**
   - Browses published topics, filters by year/concentration/keywords
   - Applies for topics with preference ranking
   - Submits required documents through phases (Initial Statement, Progress Reports, Final Dissertation)
   - Views assigned supervisor, topic details, and feedback
   - Can declare specific documents not required for their project
   - Monitors submission status and upcoming deadlines

2. **Supervisor (Professor)**
   - Publishes and updates FYP project topics with descriptions
   - Reviews and approves student applications, selects/ranks students
   - Monitors submission status of assigned students
   - Provides feedback on submitted documents
   - Accesses personal dashboard with student list and tracking

3. **Admin/Staff**
   - Manages user accounts (create, activate, role assignments)
   - Oversees all projects, students, supervisors, and submission statuses
   - Generates reports and tracks system activity
   - Monitors email reminders sent (future phase)
   - Provides oversight and compliance tracking

---

## User Scenarios

### Scenario 1: Student Discovers and Applies for a Topic

**Actor**: Student  
**Precondition**: Student is authenticated and not yet assigned a topic  
**Main Flow**:

1. Student navigates to Topic Discovery page
2. System displays full list of available topics (immediate load, no pagination required initially)
3. Student applies inline filters:
   - Academic year (e.g., Year 4)
   - Concentration (e.g., Software Engineering, Data Science)
   - Keyword search (e.g., "machine learning")
4. Topics list updates to show matching results
5. Student clicks on topic title to view full details:
   - Topic description and requirements
   - Supervisor name and contact
   - Keywords/research area
   - Reference documents (if attached)
6. Student ranks preferences (e.g., Select as 1st choice, 2nd choice, etc.)
7. Student confirms application
8. System shows confirmation: "Application submitted to Supervisor [Name]"
9. Student is notified of status on dashboard

**Success Criteria**:
- Student can search and filter topics in under 10 seconds
- Application preferences are recorded and visible to supervisor
- Student receives confirmation of application
- Student can modify preferences before supervisor reviews

---

### Scenario 2: Supervisor Reviews Applications and Assigns Topics

**Actor**: Supervisor  
**Precondition**: Supervisor has published topics and students have applied  
**Main Flow**:

1. Supervisor logs in to dashboard
2. Dashboard shows list of topics they've published
3. For each topic, supervisor can see number of applications and applicant list
4. Supervisor reviews applicant profiles (name, email, GPA if available, past project notes if any)
5. Supervisor approves/rejects applications or ranks students
6. Once approved, system assigns student to topic
7. Both student and supervisor receive notifications of assignment
8. Student can now view: assigned topic, supervisor details, submission timeline

**Success Criteria**:
- Supervisor can view all applicants within 5 seconds
- Assignment decision is recorded with timestamp
- Student immediately sees assignment in their dashboard
- Supervisor can modify assignments until soft deadline (configurable)

---

### Scenario 3: Student Submits Initial Statement and Tracks Progress

**Actor**: Student  
**Precondition**: Student is assigned a topic and logged in  
**Main Flow**:

1. Student navigates to Submissions page
2. System displays submission phases:
   - Initial Statement (Due: [Date]) — Status: "Not Submitted"
   - Progress Report 1 + REC Form (Due: Late November) — Status: "Pending"
   - Progress Report 2 (Due: January) — Status: "Pending"
   - Final Dissertation + Presentation (Due: April) — Status: "Pending"
3. Student clicks "Submit Initial Statement"
4. Form opens with fields for:
   - Project title
   - Project objectives and scope
   - Methodology
   - Timeline/milestones
   - Resource requirements
5. Student uploads supporting documents (e.g., proposal PDF, references)
6. System validates submission (file size, format, required fields)
7. Student submits; system records timestamp and marks as "Submitted"
8. Supervisor receives notification of submission
9. Student can view past submissions and any feedback from supervisor

**Success Criteria**:
- Submission form is intuitive and completes in under 5 minutes
- Clear visual status for each document phase (submitted/pending/overdue/declared not needed)
- Student receives submission confirmation with timestamp
- Submission history is preserved for audit trail

---

### Scenario 4: Student Declares Document Not Required

**Actor**: Student  
**Precondition**: Student is assigned topic, on Submissions page  
**Main Flow**:

1. Student is viewing submission phases
2. For example, REC (Research Ethics Clearance) Form is required in Progress Report 1 phase
3. Student's research does not require REC approval (e.g., literature review, no human subjects)
4. Student clicks "Declare Not Required" for REC form
5. System prompts for justification (text field):
   - "Explain why this document is not applicable to your project"
6. Student submits: "My project is a literature review, no human subjects or external data collection required"
7. System marks status as "Declared Not Needed" with timestamp and reason visible
8. Supervisor sees this declaration and can approve/challenge it
9. Admin has full audit trail of declarations

**Success Criteria**:
- Declaration process takes under 2 minutes
- Reason is recorded and visible to supervisor and admin
- Declaration status is visually distinct from submitted/pending/missing
- Supervisor can flag suspicious declarations

---

### Scenario 5: Admin Views System Activity and Submission Status

**Actor**: Admin/Staff  
**Precondition**: Admin is logged in with admin credentials  
**Main Flow**:

1. Admin navigates to Admin Dashboard
2. System displays overview:
   - Total student count, supervisor count
   - Topic assignments summary (assigned, pending, unassigned)
   - Submission completion rates per phase
   - List of all students with columns: Name, ID, Topic, Supervisor, Current Status
3. Admin can click on student row to expand details:
   - All submissions (submitted dates, files, feedback given)
   - Topic change history (if any)
   - Activity log (dates of actions)
4. Admin can use filters:
   - Academic year
   - Concentration
   - Status (on track, overdue, missing key submissions)
5. Admin can search by student name or ID
6. Admin can generate a status report (e.g., "All Initial Statements submitted")

**Success Criteria**:
- Dashboard loads within 3 seconds with current data
- Admin can locate any student and their submission status in under 30 seconds
- Filters and search work without page reload
- Data is accurate and reflects real-time system state

---

## Functional Requirements

### 1. Authentication & Authorization

| ID | Requirement | Details |
|----|-------------|---------|
| AUTH-1 | User Registration | Admin can create user accounts with email, name, role, concentration |
| AUTH-2 | Email/Password Login | Users log in with email and password (bcrypt hashed, no plaintext storage) |
| AUTH-3 | Role-Based Access Control | Three roles: Student, Supervisor, Admin; each has different UI/permissions |
| AUTH-4 | Session Management | Sessions expire after 30 minutes of inactivity; users can manually log out |
| AUTH-5 | User Profile | Each user has profile with name, email, contact info, role, concentration |
| AUTH-6 | Profile Management | Users can update their own email and contact information |

### 2. Topic Discovery & Application

| ID | Requirement | Details |
|----|-------------|---------|
| TOPIC-1 | Topic Publishing | Supervisors can create topics with title, description, keywords, concentration, year |
| TOPIC-2 | Topic Listing (Immediate Load) | All available topics displayed as full list on page load (no pagination initially; implement pagination option for UX) |
| TOPIC-3 | Inline Filtering | Topics can be filtered by academic year, concentration, and keyword search without page reload |
| TOPIC-4 | Pagination Options | UI provides dropdown to choose items per page (10, 25, 50) |
| TOPIC-5 | Topic Details View | Clicking a topic shows full description, supervisor name/email, requirements, reference documents |
| TOPIC-6 | Topic Application | Student can apply with preference ranking (1st choice, 2nd choice, etc.) |
| TOPIC-7 | Application Confirmation | System confirms application submission with timestamp |
| TOPIC-8 | Preference Management | Student can modify application preferences before supervisor reviews (soft deadline) |
| TOPIC-9 | Past Topics Archive | System maintains searchable list of all past and current FYP topics with supervisors |

### 3. Topic-Supervisor Matching

| ID | Requirement | Details |
|----|-------------|---------|
| MATCH-1 | Application Review | Supervisor can view all applicants for their published topics |
| MATCH-2 | Student Profile View | Supervisor can view applicant profile (name, email, background if available) |
| MATCH-3 | Application Approval | Supervisor approves/rejects applications or ranks students by preference |
| MATCH-4 | Topic Assignment | Once approved, system assigns student to topic; notifications sent to both parties |
| MATCH-5 | Assignment Edit Window | Supervisor can modify assignments until configurable soft deadline |
| MATCH-6 | Group Projects | System allows two students to apply as a pair for the same topic (future enhancement) |

### 4. Submission Phases & Document Management

| ID | Requirement | Details |
|----|-------------|---------|
| SUBMIT-1 | Submission Phases | Four phases: Initial Statement, Progress Report 1 + REC, Progress Report 2, Final Submission |
| SUBMIT-2 | Phase Display | Each phase shows title, due date, and current status (Not Submitted, Submitted, Overdue, Declared Not Needed) |
| SUBMIT-3 | Document Upload | Student can upload documents (PDF, Word, images); system validates file type and size (max 50MB per file) |
| SUBMIT-4 | Form Submission | Initial Statement and Progress Reports include guided form fields (not free-text only) |
| SUBMIT-5 | Declaration System | Student can declare a document not needed with written justification |
| SUBMIT-6 | Declaration Audit Trail | Reason for declaration is recorded and visible to supervisor and admin |
| SUBMIT-7 | No Hard Blocking | Students can proceed to next phase even without completing current phase (avoids system deadlock) |
| SUBMIT-8 | Soft Warnings | UI shows clear overdue/missing indicators but does not prevent progression |
| SUBMIT-9 | Submission Timestamp | System records exact submission date/time for audit purposes |
| SUBMIT-10 | Resubmission | Student can resubmit documents after first submission (updates records, maintains version history) |

### 5. Status Tracking & Visibility

| ID | Requirement | Details |
|----|-------------|---------|
| STATUS-1 | Student View | Student can see submission status for all phases (submitted, pending, overdue, declared) |
| STATUS-2 | Supervisor View | Supervisor can see submission status for all assigned students |
| STATUS-3 | Admin Overview | Admin can see submission status across all students, filterable by year/concentration/supervisor |
| STATUS-4 | Status Indicators | Clear visual indicators (colors, badges, icons) for each status |
| STATUS-5 | Due Date Countdown | Students see days remaining until deadline (or "Overdue by X days") |

### 6. Feedback & Comments

| ID | Requirement | Details |
|----|-------------|---------|
| FEEDBACK-1 | Supervisor Feedback | Supervisor can add text feedback to submitted documents (attached to specific submission) |
| FEEDBACK-2 | Student Access | Students can view feedback from supervisors on their submissions |
| FEEDBACK-3 | Feedback History | System maintains history of all feedback given with timestamps |
| FEEDBACK-4 | Feedback Visibility | Feedback is student-visible (not confidential notes); confidential feedback deferred to future phase |

### 7. Dashboards

| ID | Requirement | Details |
|----|-------------|---------|
| DASH-1 | Student Dashboard | Shows current topic, supervisor, reference docs, submission status, due dates, feedback history |
| DASH-2 | Supervisor Dashboard | Shows list of supervised students, their topics, submission status, pending approvals |
| DASH-3 | Admin Dashboard | Shows all students with topics/supervisors, submission completion rates, system activity overview |
| DASH-4 | Dashboard Performance | Dashboards load within 3 seconds with current data |

### 8. Activity Logging & Audit Trail

| ID | Requirement | Details |
|----|-------------|---------|
| LOG-1 | Action Logging | System logs all user actions: submissions, approvals, topic changes, feedback given |
| LOG-2 | Timestamp Recording | Each action includes exact timestamp (YYYY-MM-DD HH:MM:SS UTC) |
| LOG-3 | Actor Identification | Log includes user ID/email of who performed the action |
| LOG-4 | Admin Audit Access | Admin can view activity log filtered by user, date, or action type |
| LOG-5 | Data Immutability | Logged actions are immutable (not editable or deletable) |

### 9. User Management (Admin)

| ID | Requirement | Details |
|----|-------------|---------|
| ADMIN-1 | User Creation | Admin can create new user accounts with email, name, role, concentration |
| ADMIN-2 | Role Assignment | Admin can assign roles: Student, Supervisor, Admin |
| ADMIN-3 | User Listing | Admin can view all users with roles, concentrations, and status |
| ADMIN-4 | Account Deactivation | Admin can deactivate inactive accounts (soft delete, preserves data) |
| ADMIN-5 | Bulk Actions | Admin can perform bulk operations (e.g., assign concentration, reset defaults) |

### 10. Data Validation & Error Handling

| ID | Requirement | Details |
|----|-------------|---------|
| DATA-1 | Input Validation | All forms validate required fields before submission |
| DATA-2 | File Validation | Uploaded files checked for type and size; malicious files rejected |
| DATA-3 | Email Uniqueness | System ensures email addresses are unique across users |
| DATA-4 | User-Friendly Errors | Error messages are clear and actionable (not technical jargon) |

---

## Success Criteria

1. **User Authentication & Access**
   - All users can log in with email/password within 5 seconds
   - Role-based access works correctly; students see only their data, supervisors see their students, admins see all data
   - Session timeout prevents unauthorized access after inactivity

2. **Topic Discovery & Application**
   - Students can browse all available topics and apply within 2 minutes
   - Filters work without page reload and return results in under 2 seconds
   - Supervisors receive application notifications and can approve assignments within 1 minute

3. **Document Submission**
   - Students can submit documents successfully with clear confirmation
   - All submissions are recorded with timestamps for audit purposes
   - Status tracking is accurate and updates in real time
   - Students can declare documents not required with justification

4. **System Reliability**
   - No data loss on failed submissions; drafts are preserved
   - System handles concurrent users (at least 100 simultaneous sessions)
   - Database transactions ensure consistency (no partial updates)

5. **Supervisor & Admin Oversight**
   - Supervisors can monitor assigned students' submission progress in real time
   - Admins can generate accurate status reports covering all students and phases
   - Activity logs are complete and immutable

6. **User Experience**
   - All dashboard pages load within 3 seconds
   - Navigation is intuitive; users can complete core tasks without training
   - Mobile-responsive design (works on tablets; mobile version deferred if needed)

7. **Data Security**
   - Passwords stored using bcrypt (no plaintext)
   - User data protected by role-based access control
   - Audit trail prevents unauthorized modifications

---

## Key Entities & Data Model

### Users
- `id` (UUID)
- `email` (unique)
- `password_hash` (bcrypt)
- `full_name`
- `role` (Student | Supervisor | Admin)
- `concentration` (Software Engineering | Data Science | etc.)
- `contact_info` (phone, office hours if applicable)
- `created_at`, `updated_at`, `deactivated_at`

### Topics
- `id` (UUID)
- `title`
- `description`
- `supervisor_id` (FK to Users)
- `concentration`
- `academic_year`
- `keywords`
- `reference_documents` (links/file paths)
- `status` (Active | Archived | Draft)
- `created_at`, `updated_at`

### Applications
- `id` (UUID)
- `student_id` (FK to Users)
- `topic_id` (FK to Topics)
- `preference_rank` (1st choice, 2nd choice, etc.)
- `status` (Pending | Approved | Rejected)
- `applied_at`, `decided_at`
- `supervisor_notes` (optional)

### Assignments
- `id` (UUID)
- `student_id` (FK to Users)
- `topic_id` (FK to Topics)
- `supervisor_id` (FK to Users)
- `assigned_at`
- `status` (Active | Completed | Changed)

### Submissions
- `id` (UUID)
- `student_id` (FK to Users)
- `phase` (Initial Statement | Progress Report 1 | Progress Report 2 | Final Dissertation)
- `submission_date`
- `file_path` (or document_url)
- `status` (Not Submitted | Submitted | Overdue | Declared Not Needed)
- `declaration_reason` (if declared not needed)
- `created_at`, `updated_at`

### Feedback
- `id` (UUID)
- `submission_id` (FK to Submissions)
- `supervisor_id` (FK to Users)
- `feedback_text`
- `created_at`, `updated_at`

### Activity Logs
- `id` (UUID)
- `user_id` (FK to Users)
- `action` (submission_created | application_approved | feedback_given | etc.)
- `entity_type` (Submission | Application | Assignment, etc.)
- `entity_id` (ID of affected record)
- `timestamp`
- `details` (JSON: changes made, if applicable)

---

## Assumptions

1. **No SSID Integration in MVP**: MVP uses email/password authentication; SSID integration deferred to Phase 2
2. **Single Supervisor per Topic**: Each topic has one primary supervisor (co-supervisors deferred)
3. **No External Communications Initially**: Email reminders deferred to Phase 2; manual notifications sufficient for MVP
4. **No Grading System in MVP**: Feedback is text-based comments; formal rubrics and grades deferred to Phase 2
5. **No Topic Change Workflow in MVP**: Once assigned, topic is fixed; topic change requests deferred to Phase 2
6. **Pagination is Optional UX**: Full list loads first; pagination dropdown added for performance optimization
7. **No Two-Person Teams in MVP**: Group projects deferred; only individual students initially
8. **In-Memory File Storage (MVP)**: Files stored locally on server; cloud storage (S3, Azure) deferred to Phase 2
9. **Basic Role Model**: Three roles (Student, Supervisor, Admin); fine-grained permissions (e.g., "can edit own submissions") handled in implementation

---

## Acceptance Scenarios

### Acceptance Test 1: Student Can Browse and Apply for Topics
**Given**: Student is logged in and topics are published  
**When**: Student navigates to Topic Discovery and filters by concentration  
**Then**: Matching topics appear in under 2 seconds and student can apply with preferences  
**AND**: Supervisor receives notification of application

### Acceptance Test 2: Submission Status is Accurate
**Given**: Student submits an Initial Statement on 2026-02-01  
**When**: Admin views dashboard  
**Then**: Submission status shows "Submitted" with timestamp 2026-02-01 HH:MM:SS  
**AND**: Status is visible to supervisor

### Acceptance Test 3: Declaration Reason is Recorded
**Given**: Student declares REC form not required with written reason  
**When**: Supervisor and admin view submission status  
**Then**: Both see "Declared Not Needed" status with the student's justification  
**AND**: Admin can query audit log to see declaration with timestamp

### Acceptance Test 4: Dashboard Performance
**Given**: System has 500 students, 50 supervisors, 100 topics  
**When**: Admin loads Admin Dashboard  
**Then**: Dashboard loads within 3 seconds with accurate data

---

## Notes & Constraints

- **Scope**: This specification covers MVP only; future phases will add automated reminders, grading rubrics, topic change workflows, and analytics
- **No Blocking**: System is designed to avoid blocking students at any phase; soft warnings replace hard restrictions
- **Audit Trail**: All actions logged for compliance and dispute resolution
- **Extensibility**: Data model designed to support future features (e.g., multiple supervisors, team projects, rubric-based grading)
