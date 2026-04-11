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
- **Notifications**: Email reminders

### DevOps
- **Version Control**: Git/GitHub
- **Testing**: Vitest (Frontend), Jest (Backend)
- **CI/CD**: GitHub Actions
- **Database**: Azure Cosmos DB (MongoDB API)
- **Storage**: Azure Blob Storage

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
- **Project Application**: Apply to desired topics
- **Submission Management**: Submit work across multiple phases (Ethics, Progress Reports, Final Report)
- **Feedback Tracking**: View supervisor feedback in real-time
- **Dashboard**: Track project status and deadlines
- **Meeting Scheduling**: Book meetings with supervisors
- **Activity Logs**: Monitor all project events and communications

### 👨‍🏫 Supervisor Features
- **Topic Management**: Create, edit, and archive project topics
- **Student Supervision**: Manage assigned students
- **Submission Review**: Access and evaluate student submissions
- **Feedback Providing**: Leave detailed comments and grades
- **Meeting Management**: Schedule and track meetings with students
- **Approval Workflows**: Approve/reject topic applications
- **Bulk Reminders**: Send deadline reminders to students

### 👨‍💼 Admin Features
- **Student Management**: CRUD operations on student records
- **Cohort Management**: Create and manage academic cohorts
- **Supervisor Management**: Manage supervisor profiles and assignments
- **Grading Standards**: Define evaluation criteria and rubrics
- **Bulk Operations**: 
  - Mark students as ethics not required
  - Assign students to supervisors
  - Import students from Excel
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
| Users | `/admin/users` | Admin |
| Topics | `/topic`, `/supervisor/topics` | Student, Supervisor |
| Assignments | `/assignment`, `/supervisor/assignments` | All |
| Submissions | `/submission`, `/supervisor/submissions` | Student, Supervisor |
| Grading | `/admin/grading-standards` | Admin |
| Cohorts | `/admin/cohorts` | Admin |
| Feedback | `/feedback`, `/supervisor/feedback` | All |

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
- Admin can view all submission phases configured in grading standards
- Download submission files directly
- Track submission status (pending, submitted, overdue, declared not needed)
- Filter submissions by student pathway

### 2. Cohort Management
- Auto-calculate dates from academic year (Sept 1 - Aug 31)
- Explicitly assign students to cohorts
- View all students within a cohort
- Track student count per cohort

### 3. Bulk Operations
- Import student records from Excel (.xlsx/.csv)
- Duplicate detection and prevention
- Reactivate deactivated users on re-import
- Export student data to Excel
- Assign multiple students to supervisor in one action

### 4. Grading Standards
- Define submission phases per pathway
- Set point ranges for each phase
- Map rubric templates
- Enable/disable phases dynamically

### 5. Activity Logging
- Track all CRUD operations
- Log user actions with timestamps
- Audit trail for compliance
- Filter logs by entity type, date range

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
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

Access frontend at `http://localhost:5173`
API available at `http://localhost:5000`

### Testing
```bash
# Frontend
cd frontend && npm run test

# Backend
cd fyp-management-backend && npm run test
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
npm run build
# Deploy dist/ folder to Static Web Apps
```

### Backend (Azure App Service)
```bash
npm run build
npm start
# Deploy to App Service
```

### Database (Azure Cosmos DB)
- Connection string in environment variables
- Automatic schema creation via Mongoose
- Indexes pre-configured for common queries

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Port 5000 already in use | `lsof -i :5000 \| grep -v COMMAND \| awk '{print $2}' \| xargs kill -9` |
| MongoDB connection refused | Check `MONGODB_URI` env var and connectivity |
| TypeScript compilation error | Run `npm run build` to see detailed errors |
| JWT token expired | Frontend automatically refreshes token or re-authenticates |
| File upload fails | Check Azure Blob Storage credentials |

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

## Support & Questions

For issues or questions:
1. Check existing documentation in `/docs`
2. Review API specs in `/kitty-specs`
3. Search closed GitHub issues
4. Create a new GitHub issue with detailed context

---

**Last Updated**: April 2026
**Status**: Active Development
