# FYP Management System

A comprehensive web-based Final Year Project (FYP) management system designed to streamline the entire lifecycle of student projects from topic discovery through submission and grading.

## Overview

The FYP Management System is built to facilitate seamless collaboration between students, supervisors, and administrators. It provides tools for topic creation, student applications, project assignments, submission management, and feedback tracking.

**Current Deployment**: Azure Static Web Apps (Frontend) + Azure App Service (Backend)

---

## Tech Stack

### Frontend
- **Framework**: Vue 3 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + daisyUI
- **State Management**: Pinia
- **HTTP Client**: Axios
- **UI Icons**: Heroicons

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ORM)
- **Authentication**: JWT (HS256, 24-hour expiry)
- **Password Hashing**: bcryptjs (10 rounds)
- **File Upload**: Multer (Azure Blob Storage)
- **Reminders**: Scheduler for email notifications

### DevOps
- **Version Control**: Git/GitHub
- **Testing**: Vitest (Frontend), Jest (Backend setup)
- **Database**: Azure Cosmos DB (MongoDB API)
- **Storage**: Azure Blob Storage
- **Deployment**: Azure Static Web Apps (Frontend), Azure App Service (Backend)

---

## Project Structure

```
comp4117/
├── frontend/                    # Vue 3 SPA
│   ├── src/
│   │   ├── components/         # Reusable Vue components
│   │   ├── pages/              # Page-level components
│   │   ├── views/              # View containers
│   │   ├── services/           # API client services
│   │   ├── stores/             # Pinia state management
│   │   ├── router/             # Vue Router configuration
│   │   ├── composables/        # Reusable logic hooks
│   │   ├── utils/              # Utility functions
│   │   └── assets/             # Static assets
│   ├── tests/                  # Test files
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── fyp-management-backend/     # Express.js API
│   ├── src/
│   │   ├── controllers/        # Business logic
│   │   ├── models/             # MongoDB schemas
│   │   ├── routes/             # API endpoints
│   │   ├── middleware/         # Auth, validation, etc.
│   │   ├── services/           # Utility services
│   │   ├── types/              # TypeScript types
│   │   ├── utils/              # Helper functions
│   │   ├── app.js              # Express app setup
│   │   ├── index.js            # Server entry point
│   │   └── scheduler.ts        # Background tasks
│   ├── tests/                  # Test files
│   ├── scripts/                # Database scripts
│   ├── package.json
│   ├── jest.config.js
│   └── tsconfig.json
│
├── docs/                       # Documentation
├── kitty-specs/                # Project specifications
└── README.md                   # This file
```

---

## Key Features

### 👨‍🎓 Student Features
- **Topic Discovery**: Browse and filter available FYP topics
- **Project Application**: Apply to desired topics with approval workflow
- **Submission Management**: Submit work across configured phases
- **Feedback Tracking**: View supervisor feedback and grades
- **Dashboard**: Track project status, deadlines, and submissions
- **Activity Logs**: Monitor all project events and communications
- **Meeting Slots**: View available supervisor meeting times

### 👨‍🏫 Supervisor Features
- **Topic Management**: Create, edit, and archive project topics
- **Topic Moderation**: Submit topics for admin approval
- **Student Supervision**: Manage assigned students and their progress
- **Submission Review**: Access and evaluate student submissions
- **Feedback & Grading**: Leave detailed comments, grades, and assessments
- **Pending Approvals**: Review and approve student applications
- **Meeting Scheduling**: Create and manage meeting time slots
- **Activity Logs**: Track all supervision activities

### 👨‍💼 Admin Features
- **Student Management**: CRUD operations on student records
- **Cohort Management**: Create and manage academic cohorts
- **Supervisor Management**: Manage supervisor profiles and assignments
- **Grading Standards**: Define evaluation criteria and rubrics
- **Bulk Operations**: 
  - Import students from Excel
  - Export students from the system
- **Excel Import/Export**: Batch operations for student management
- **Activity Logging**: Track all system events
- **System Configuration**: Manage grading standards, rubric templates

---

## Core Database Models

### User
- Email, Full Name, Role (Student/Supervisor/Admin)
- Concentration, Pathway, Phone, Cohort
- Password (hashed with bcrypt)
- Activity log tracking

### Topic
- Title, Description, Keywords
- Supervisor (FK to User)
- Max Students, Pathway
- Status (Draft, Active, Archived)

### Assignment
- Connects Students ↔ Topics ↔ Supervisors
- Status tracking (Pending, Active, Completed)
- Assignment date metadata

### Submission
- Phase (Ethics, Progress Report 1/2, Final Report, etc.)
- Status (Not Submitted, Submitted, Overdue, Declared Not Needed)
- Submitted files with metadata
- Due date tracking

### Grading Standard
- Submission type configuration
- Pathway-specific rubrics
- Point ranges and evaluation criteria

### Cohort
- Academic year (e.g., 2026/2027)
- Start/End dates (auto-calculated)
- Associated students

### Activity Log
- User action tracking
- Entity type and ID
- Timestamp and IP address
- Audit trail for compliance

---

## API Architecture

### Authentication
- JWT Bearer token in Authorization header
- 24-hour token expiry
- Refresh token mechanism (optional)

### Role-Based Access Control
- **Routes**: Protected with `requireRole('Admin'|'Supervisor'|'Student')`
- **Admin**: `/api/v1/admin/*` routes
- **Supervisor**: `/api/v1/supervisor/*` routes
- **Student**: `/api/v1/student/*` routes + `/api/v1/assignments/*`

### Base Endpoints

| Module | Endpoints | Role |
|--------|-----------|------|
| Users | `/admin/users` (CRUD, import/export) | Admin |
| Topics | `/topic` (browse), `/supervisor/topics` | Student, Supervisor |
| Topic Moderation | `/topic-moderation` | Admin, Supervisor |
| Assignments | `/assignment`, `/supervisor/assignments` | All |
| Applications | `/application` | Student, Supervisor |
| Submissions | `/submission`, `/supervisor/submissions` | Student, Supervisor |
| Grading Standards | `/admin/grading-standards` | Admin |
| Rubric Templates | `/admin/rubric-templates` | Admin |
| Cohorts | `/admin/cohorts` (CRUD) | Admin |
| Feedback | `/feedback`, `/supervisor/feedback` | All |
| Meetings | `/meeting`, `/supervisor/meetings` | All |
| Reminders | `/admin/reminders` | Admin |
| Activity Logs | `/activity-logs` | Supervisor, Admin |
| Topic Change Requests | `/topic-change-request` | Supervisor |
| Internal Notes | `/admin/internal-notes` | Admin |

---

## Setup & Installation

### Prerequisites
- Node.js 16+
- MongoDB (local or Azure Cosmos DB)
- npm or yarn

### Frontend Setup
```bash
cd frontend
npm install
npm run dev          # Development
npm run build        # Production build
npm run test         # Run tests
```

### Backend Setup
```bash
cd fyp-management-backend
npm install
npm run dev          # Development with nodemon
npm run build        # TypeScript compilation
npm run test         # Run tests
```

### Environment Variables

**Backend (.env)**
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=24h
PORT=5000
AZURE_STORAGE_ACCOUNT=...
AZURE_STORAGE_KEY=...
EMAIL_SERVICE_API_KEY=...
```

**Frontend (.env)**
```
VITE_API_BASE_URL=http://localhost:5000
VITE_APP_NAME=FYP Management System
```

### Database Initialization
```bash
cd fyp-management-backend
npm run seed-demo    # Load demo data
```

---

## Key Features Implementation

### 1. Student Submission Tracking
- Admin views only submission phases configured in grading standards
- Download submission files directly from admin interface
- Track submission status: Not Submitted, Submitted, Overdue, Declared Not Needed
- Filter submissions by student pathway and cohort

### 2. Explicit Cohort Management
- Create cohorts with academic year (auto-calculates Sept 1 - Aug 31)
- Explicitly assign students to cohorts (not auto-calculated)
- View all students within a cohort
- Track accurate student count per cohort
- Add/edit/remove cohorts

### 3. Bulk Operations
- Import students from Excel (.xlsx/.csv)
- Automatic duplicate detection and prevention
- Reactivate previously deactivated users on re-import
- Export student data to Excel
- Assign multiple students to supervisor
- Mark students as "Ethics not required"

### 4. Grading Standards System
- Configure submission phases per pathway (Research-Based, Solution-Based)
- Set point ranges for each assessment
- Map rubric templates for detailed evaluation
- Enable/disable phases dynamically
- Pathway-specific assessment criteria

### 5. Topic Moderation Workflow
- Supervisors submit topics for admin review
- Admin approves/rejects topics
- Approved topics become available for students
- Topic change requests from supervisors

### 6. Activity Logging & Audit Trail
- Track all CRUD operations
- Log user actions with timestamps and IP addresses
- Comprehensive audit trail for compliance
- Filter logs by entity type, action, date range
- Entity tracking (User, Topic, Assignment, etc.)

---

## Authentication & Security

- **Password Security**: Bcryptjs with 10 salt rounds
- **Token Expiry**: 24-hour JWT tokens
- **HTTPS**: Enforced in production
- **CORS**: Configured for allowed origins
- **Role-Based Access**: Middleware-enforced authorization
- **Input Validation**: Schema validation on all routes

---

## Development Workflow

### Running Locally
```bash
# Terminal 1: Backend
cd fyp-management-backend
npm install
npm run dev          # Runs on http://localhost:5000

# Terminal 2: Frontend
cd frontend
npm install
npm run dev          # Runs on http://localhost:5173
```

### Testing
```bash
# Frontend (Vitest)
cd frontend && npm run test

# Backend (Jest setup available)
cd fyp-management-backend && npm run test
```

### Database Setup
```bash
# Seed demo data
cd fyp-management-backend
npm run seed-demo    # Loads test users, topics, assignments
```

### Git Workflow
```bash
git add -A
git commit -m "Feature: description"
git push origin main
```

---

## Deployment

### Frontend (Azure Static Web Apps)
```bash
cd frontend
npm run build          # Creates dist/ folder
# Deploy dist/ to Static Web Apps
```

### Backend (Azure App Service)
```bash
cd fyp-management-backend
npm run build          # TypeScript compilation (if applicable)
npm start              # Starts Express server
# Deploy to App Service
```

### Database (Azure Cosmos DB)
- MongoDB API connection string via `MONGODB_URI`
- Automatic schema creation via Mongoose
- Indexes pre-configured for common queries
- Test environment uses local MongoDB

### Storage (Azure Blob Storage)
- File uploads configured for Blob Storage
- Connection credentials via environment variables
- Supports document submissions (PDF, DOCX, etc.)

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Port 5000/5173 already in use | `lsof -i :5000 \| grep -v COMMAND \| awk '{print $2}' \| xargs kill -9` |
| MongoDB connection refused | Check `MONGODB_URI` env var, ensure MongoDB running locally or Cosmos DB connected |
| TypeScript compilation errors | Run `npm run build` to see detailed errors; check `tsconfig.json` |
| JWT token expired | Log in again; frontend redirects to login on token expiry |
| File upload fails | Check Azure Blob Storage credentials in environment variables |
| Import fails with duplicates | Check email addresses in Excel; system skips existing users |
| Submissions not showing | Verify grading standards configured for student's pathway |
| Cohort count incorrect | Ensure students explicitly assigned to cohorts (not calculated from dates) |

---

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and test locally
3. Commit with descriptive messages
4. Push and create a pull request
5. Ensure all tests pass before merging

---

## Team & Attribution

**Project**: COMP4117 - Final Year Project Management
**Institution**: PolyU Hong Kong
**Current Maintainers**: Development Team

---

## License

This project is confidential and for educational purposes only.

---

## Implementation Status

### ✅ Fully Implemented
- User management (CRUD, import/export, deactivate/reactivate)
- Topic creation and moderation workflow
- Student applications and supervisor approval
- Assignment management (Student-Supervisor-Topic)
- Submission tracking across multiple phases
- Explicit cohort management with date calculation
- Grading standards configuration
- Rubric templates
- Activity logging and audit trail
- Role-based access control
- Excel import with duplicate detection

### 🟡 Partially Implemented
- Meeting scheduling (slot creation, no full calendar system)
- Email reminders (framework in place, limited in production)
- Automated tests (Vitest/Jest setup, minimal coverage)

### ⚠️ Not Implemented
- OAuth2 authentication (uses JWT only)
- Real-time notifications (WebSocket not configured)
- Advanced reporting/analytics
- Mobile app

---

## Support & Questions

For issues or questions:
1. Check existing documentation in `/docs`
2. Review API specs in `/kitty-specs`
3. Review backend models in `/fyp-management-backend/src/models`
4. Check frontend pages in `/frontend/src/pages`
5. Create a new GitHub issue with detailed context

---

**Last Updated**: April 2026  
**Status**: Active Development  
**Version**: 1.0.0  
**Repository**: https://github.com/YUYIUKUEN/comp4117
