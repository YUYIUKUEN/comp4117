# FYP Management System - Solution Architecture

## 1. System Overview

The FYP Management System is a three-tier web application designed to manage the complete lifecycle of Final Year Projects (FYP) from topic discovery through grading. The system follows a client-server architecture with clear separation of concerns across presentation, business logic, and data layers.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Client Layer                               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Vue 3 SPA (TypeScript + Tailwind)              │   │
│  │  ┌─────────────┬──────────────┬──────────┬────────────────┐ │   │
│  │  │  Topic UI   │  Dashboard   │ Feedback │ Admin Console  │ │   │
│  │  └─────────────┴──────────────┴──────────┴────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓ HTTP/REST
┌─────────────────────────────────────────────────────────────────────┐
│                      API Gateway / Middleware                        │
│  ┌────────────────┬─────────────────┬──────────────┬──────────────┐ │
│  │ CORS Handler   │ JWT Auth        │ Error Handler│ Logging      │ │
│  │ Rate Limiting  │ Input Validation│ File Upload  │ Middleware   │ │
│  └────────────────┴─────────────────┴──────────────┴──────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                            │
│  ┌──────────────┬──────────────┬──────────────┬──────────────────┐  │
│  │   Controllers│   Services   │  Utilities   │ Scheduler        │  │
│  │              │              │              │ (Email, Cron)    │  │
│  │  • User      │  • Auth      │  • Validators│                  │  │
│  │  • Topic     │  • Topic     │  • Formatters│ Background Tasks:│  │
│  │  • Student   │  • Student   │  • Helpers   │ • Reminders      │  │
│  │  • Grading   │  • Grading   │              │ • Notifications  │  │
│  └──────────────┴──────────────┴──────────────┴──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      Data Access Layer                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Mongoose ORM (Data Models)                      │  │
│  │  ┌──────────┬──────────┬──────────┬──────────┬────────────┐  │  │
│  │  │  User    │  Topic   │  Student │ Submission│ Feedback │  │  │
│  │  │  Model   │  Model   │  Model   │ Model    │ Model    │  │  │
│  │  └──────────┴──────────┴──────────┴──────────┴────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      External Services                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │     ┌───────────────┐        ┌──────────────────────────┐   │  │
│  │     │  Azure Cosmos │        │ Azure Blob Storage (CDN) │   │  │
│  │     │  DB (MongoDB) │        │ (Document Storage)       │   │  │
│  │     └───────────────┘        └──────────────────────────┘   │  │
│  │                    ↓                                          │  │
│  │     ┌──────────────────────────────────────────────┐         │  │
│  │     │ Azure Communication Services (Email)        │         │  │
│  │     └──────────────────────────────────────────────┘         │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Architectural Layers

### 2.1 Presentation Layer (Frontend)

**Technology**: Vue 3 + TypeScript + Tailwind CSS + daisyUI

**Responsibilities**:
- Render user interfaces for Students, Supervisors, and Admins
- Handle user interactions and form submissions
- Display real-time data using Pinia state management
- Manage client-side routing via Vue Router
- Pre-validate inputs before API calls

**Key Components**:
- **Pages**: Topic browsers, dashboards, submission forms, feedback pages
- **Components**: Reusable UI elements (buttons, cards, modals, forms)
- **Store (Pinia)**: Centralized state for user authentication, topic list, student data
- **Router**: Client-side navigation between different views
- **Composables**: Reusable logic hooks (form handling, API calls, filtering)
- **Services**: API client layer (Axios-based) for communication with backend

**Data Flow**:
```
User Action → Component → Pinia Store → API Service → Backend
                ↓
         View Re-renders based on state
```

---

### 2.2 API Gateway & Middleware Layer

**Technology**: Express.js middleware pipeline

**Responsibilities**:
- Route incoming HTTP requests to appropriate controllers
- Authenticate requests using JWT tokens
- Validate input data and file uploads
- Handle Cross-Origin Resource Sharing (CORS)
- Log requests and errors
- Manage file upload operations to Azure Blob Storage

**Key Middleware Components**:

| Middleware | Purpose |
|-----------|---------|
| CORS | Allow cross-origin requests from frontend domain |
| Body Parser | Parse JSON/form data from requests |
| JWT Auth | Verify and validate JWT tokens |
| Input Validation | Validate request data against schemas |
| File Upload (Multer) | Handle file uploads, stream to Azure |
| Error Handler | Catch and format errors for API responses |
| Logging | Log all API requests for debugging |

**Authentication Flow**:
```
Login Request → Validate Credentials → Generate JWT Token
                                            ↓
               Store in HttpOnly Cookie / LocalStorage
                                            ↓
            Include in API Requests (Authorization Header)
                                            ↓
            JWT Middleware Validates Token → Allow/Reject Request
```

---

### 2.3 Business Logic Layer

**Technology**: Node.js + Express.js controllers and services

**Architecture Pattern**: MVC + Service Layer

#### Controllers
Handle HTTP request/response flow:
- Parse request parameters
- Call appropriate service methods
- Format response data
- Handle HTTP status codes

**Example Controllers**:
- **UserController**: Registration, login, role assignment
- **TopicController**: Create, read, update, archive topics
- **StudentController**: Browse topics, apply, view assignments
- **GradingController**: Submit grades, manage rubrics
- **SubmissionController**: Upload, retrieve, track submissions

#### Services
Contain business logic and data manipulation:
- User authentication and JWT generation
- Topic filtering and search logic
- Student-supervisor matching algorithms
- Email notification logic
- Report generation
- Audit trail management

**Example Services**:
```
├── AuthService
│   ├── registerUser()
│   ├── loginUser()
│   └── validateToken()
├── TopicService
│   ├── createTopic()
│   ├── filterTopics()
│   └── archiveTopic()
├── StudentService
│   ├── applyForTopic()
│   ├── getAssignedTopic()
│   └── submitDocument()
└── NotificationService
    ├── sendEmailReminder()
    ├── sendGradeFeedback()
    └── notifyAssignment()
```

#### Utilities
Helper functions for common operations:
- Input validation and sanitization
- Date/time formatting for activity logs
- Password hashing (bcryptjs)
- Email template formatting
- File path management

#### Scheduler (Background Tasks)
**Technology**: node-cron

**Responsibilities**:
- Run periodic tasks (e.g., every hour, daily)
- Check for late submissions and send reminders
- Generate deadline notifications
- Cleanup expired sessions
- Archive old records

**Example Scheduled Tasks**:
```javascript
// Run every hour
Every 1 hour   → Check late submissions → Send email reminders

// Run daily at 9 AM
Daily 9 AM     → Check upcoming deadlines → Notify students

// Run weekly
Every Monday   → Generate progress reports
```

---

### 2.4 Data Access Layer

**Technology**: MongoDB + Mongoose ORM

**Responsibilities**:
- Define data schemas and relationships
- Enforce data validation at schema level
- Provide query interface to business logic
- Handle database transactions
- Manage indexes for query performance

**Data Models**:

#### User Schema
```
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  fullName: String,
  role: Enum [Student, Supervisor, Admin],
  department: String,
  createdAt: Date,
  lastLogin: Date,
  isActive: Boolean,
  metadata: { gpa, specialization, etc. }
}
```

#### Topic Schema
```
{
  _id: ObjectId,
  title: String,
  description: String,
  supervisorId: ObjectId (ref: User),
  keywords: [String],
  concentration: String,
  academicYear: Number,
  capacity: Number,
  status: Enum [Draft, Pending, Approved, Archived],
  createdAt: Date,
  updatedAt: Date,
  submissions: [Enum]  // Required submission phases
}
```

#### Application Schema
```
{
  _id: ObjectId,
  studentId: ObjectId (ref: User),
  topicId: ObjectId (ref: Topic),
  preference: Number (1st, 2nd, 3rd choice),
  status: Enum [Applied, Approved, Rejected, Assigned],
  appliedAt: Date,
  reviewedAt: Date,
  supervisorNotes: String
}
```

#### Submission Schema
```
{
  _id: ObjectId,
  studentId: ObjectId (ref: User),
  topicId: ObjectId (ref: Topic),
  phase: String (Initial Statement, Progress Report, Final Dissertation),
  documentUrl: String (Azure Blob path),
  uploadedAt: Date,
  status: Enum [Pending, Submitted, Graded],
  grade: Number,
  feedback: String
}
```

#### AuditLog Schema
```
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  action: String (Create, Update, Delete, Login, etc.),
  resourceType: String (Topic, User, Submission),
  resourceId: ObjectId,
  timestamp: Date,
  changes: Object (before/after values)
}
```

---

## 3. Deployment Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     User's Browser                           │
│              (Via Internet/Azure CDN)                        │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│              Azure Static Web Apps (Frontend)                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Hosts Vue.js SPA + Serves Static Assets              │  │
│  │  - Automatic HTTPS                                     │  │
│  │  - CDN for global distribution                         │  │
│  │  - Managed CI/CD from GitHub                           │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│              Azure App Service (Backend API)                 │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Runs Express.js Server                               │  │
│  │  - Node.js Runtime                                     │  │
│  │  - Auto-scaling based on demand                        │  │
│  │  - Environment variables for config                   │  │
│  │  - Continuous deployment from GitHub                  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                              ↓
         ┌────────────────────┴────────────────────┐
         ↓                                          ↓
┌──────────────────────────────┐    ┌────────────────────────┐
│ Azure Cosmos DB (MongoDB API)│    │ Azure Blob Storage     │
│  - Primary Data Store        │    │ - Document Repository  │
│  - Replicated for HA         │    │ - Submission files     │
│  - Automatic backups         │    │ - Audit logs export    │
│  - Query performance index   │    │ - CDN enabled          │
└──────────────────────────────┘    └────────────────────────┘
         ↑                                          ↑
         └────────────────────┬────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│        Azure Communication Services (Email)                  │
│  - Sends reminder emails                                     │
│  - Sends feedback notifications                             │
│  - Tracks delivery status                                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Data Flow Scenarios

### Scenario 1: Student Applies for Topic

```
1. Frontend: Student clicks "Apply" on topic card
   └─→ Vue component dispatches Pinia action

2. Pinia Store: Validates form data locally
   └─→ Makes API call to POST /api/applications

3. API Gateway: Express middleware
   └─→ Validates JWT token
   └─→ Validates input body
   └─→ Routes to ApplicationController.create()

4. Business Logic: ApplicationController & StudentService
   └─→ Check student not already assigned
   └─→ Check topic capacity not exceeded
   └─→ Save preference ranking

5. Data Layer: Mongoose saves to MongoDB
   └─→ Application document created
   └─→ Audit log entry created

6. Response: API returns 201 + application ID
   └─→ Pinia updates store
   └─→ Frontend shows success message

7. Background: Scheduler detects new application
   └─→ Sends notification email to supervisor
```

### Scenario 2: Supervisor Grades Submission

```
1. Frontend: Supervisor views submission, enters grade + feedback
   └─→ Submits form to PATCH /api/submissions/{id}/grade

2. API Gateway: Validates JWT, checks supervisor is assigned
   └─→ Routes to SubmissionController.gradeSubmission()

3. Business Logic: SubmissionService
   └─→ Calculate rubric score
   └─→ Format feedback text
   └─→ Create audit log: "Grade submitted by Supervisor X"

4. Data Layer: Update Submission document
   └─→ Set status: "Graded"
   └─→ Store grade, feedback, timestamp

5. Response: API returns updated submission

6. Notification Service (async):
   └─→ Send email to student: "Feedback received for Phase 1"
   └─→ Link to view feedback in dashboard

7. Frontend: Student's dashboard updates
   └─→ Shows new feedback
   └─→ Updates progress bar
```

### Scenario 3: Automated Email Reminder (Scheduled Task)

```
1. Scheduler (node-cron): Triggers every hour
   └─→ Calls checkAndSendReminders()

2. Query Database:
   └─→ Find all submissions with:
       • status: "Pending" (not submitted)
       • dueDate < now (overdue)
       • lastReminderSent < 24 hours ago

3. For each overdue submission:
   └─→ Get student email + topic title
   └─→ Render email template with:
       • Student name
       • Phase name
       • Days overdue
       • Submission link

4. Send Email via Azure Services:
   └─→ POST to Communication Services API

5. Update Database:
   └─→ Set submission.lastReminderSent = now
   └─→ Create audit log: "Reminder email sent"

6. Error Handling:
   └─→ If email fails, log error
   └─→ Retry in next scheduled run
   └─→ Alert admin if 3 consecutive failures
```

---

## 5. Key Design Patterns

### 5.1 MVC (Model-View-Controller)
- **Model**: Mongoose schemas (data structure)
- **View**: Vue components (UI rendering)
- **Controller**: Express route handlers (request orchestration)

### 5.2 Service Layer Pattern
- Business logic separated from controllers
- Reusable services can be called from multiple controllers or scheduled tasks
- Easy to unit test

### 5.3 Repository Pattern (via Mongoose)
- Data access abstraction layer
- Queries encapsulated in model methods
- Enables swapping database implementations

### 5.4 Observer Pattern (Scheduling)
- Background scheduler observes system state
- Triggers actions based on conditions (time, data changes)
- Decoupled from main application flow

### 5.5 Middleware Chain Pattern
- Express middleware pipeline
- Each middleware handles specific concern (auth, validation, logging)
- Composable and reusable

---

## 6. Security Architecture

### Authentication
```
Login → Validate Email + Password → Generate JWT (24-hour expiry)
        → Include user role in token payload
        → Send in HttpOnly cookie for browser storage
```

### Authorization
```
JWT Middleware → Extract role from token
              → Check role against required permissions for route
              → Reject if insufficient permissions
```

### Password Security
```
User Password Input → Hash with bcryptjs (10 rounds salt)
                   → Store hashed version in database
                   → Verify on login using comparison
```

### CORS
```
Frontend Domain: configured in Express CORS middleware
              → Only allow requests from registered frontend domain
              → Prevent cross-origin attacks
```

### Input Validation
```
Request Data → Validate against schema (type, length, format)
            → Sanitize strings (remove special chars)
            → Return 400 Bad Request if invalid
```

### Audit Trail
```
Every Action → Log to AuditLog collection:
            - Who performed action (userId)
            - What action (Create, Update, Delete)
            - On what resource (Topic, User, Submission)
            - When (timestamp)
            - Changes made (before/after values)
```

---

## 7. Scalability Considerations

### Horizontal Scaling
- **Frontend**: Azure Static Web Apps auto-scales globally via CDN
- **Backend**: Azure App Service can scale to multiple instances
- **Database**: Azure Cosmos DB replicates across regions

### Performance Optimization
- **Indexes**: Create indexes on frequently queried fields (userId, topicId, status)
- **Caching**: Implement Redis cache for topic list (read-heavy)
- **Pagination**: Paginate large datasets (submissions list, audit logs)
- **Lazy Loading**: Frontend loads topics ondemand

### Load Balancing
- Azure Load Balancer distributes traffic to App Service instances
- API calls distributed across multiple backend servers
- Database connections pooled for efficiency

---

## 8. Monitoring & Observability

### Logging
- Express middleware logs all HTTP requests
- Application logs captured in Azure App Service
- Centralized logging via Azure Monitor

### Error Tracking
- Global error handler catches unhandled exceptions
- Errors logged with stack trace and request context
- Critical errors alert admin dashboard

### Performance Monitoring
- Track API response times
- Monitor database query performance
- Alert on high latency or error rates

### Usage Metrics
- Track number of active users
- Monitor topic applications per day
- Measure submission completion rates

---

## 9. Deployment Workflow

```
Developer → Git Push to Main Branch
         ↓
         GitHub (Repository)
         ↓
         ┌─────────────────────────────────┐
         │ Trigger CI/CD Pipelines         │
         ├─────────────────────────────────┤
         │ Frontend:                       │
         │ • npm run build (Vite)          │
         │ • Deploy to Static Web Apps     │
         │                                 │
         │ Backend:                        │
         │ • npm run build (TypeScript)    │
         │ • Deploy to App Service         │
         └─────────────────────────────────┘
         ↓
         Production Live
```

---

## 10. Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Vue 3, TypeScript, Vite, Tailwind | UI and client logic |
| **State Mgmt** | Pinia | Client-side state |
| **HTTP Client** | Axios | API communication |
| **Backend Runtime** | Node.js | JavaScript execution |
| **Framework** | Express.js | HTTP server framework |
| **ORM** | Mongoose | MongoDB abstraction |
| **Database** | MongoDB (Cosmos DB) | Data persistence |
| **Storage** | Azure Blob Storage | Document storage |
| **Authentication** | JWT, bcryptjs | Security |
| **Scheduling** | node-cron | Background tasks |
| **Email** | Azure Communication Services | Notifications |
| **Deployment** | Azure (Static Web Apps, App Service) | Hosting |
| **Testing** | Jest, Vitest | Test frameworks |
| **Version Control** | Git/GitHub | Source management |

---

## 11. Architecture Strengths

✅ **Separation of Concerns**: Clear layers (presentation, business, data)  
✅ **Scalability**: Microservices-ready architecture, cloud-native  
✅ **Security**: JWT auth, bcrypt hashing, CORS, input validation  
✅ **Maintainability**: Organized code structure, reusable services  
✅ **Reliability**: Error handling, audit trails, retry logic  
✅ **Performance**: Database indexing, caching opportunity, CDN  
✅ **Testing**: Isolated services and controllers easy to unit test  

---

## 12. Future Enhancements

- **Real-time Notifications**: WebSocket integration for live updates
- **Advanced Analytics**: Dashboard with enrollment trends, completion rates
- **AI/ML Features**: Topic recommendations, student-supervisor matching algorithm
- **Mobile App**: React Native frontend for on-the-go access
- **Integration**: LMS integration (Canvas, Blackboard), calendar sync
- **Reporting**: Automated report generation (PDF/Excel exports)
- **Accessibility**: WCAG 2.1 AA compliance improvements

