# Developer Quickstart: FYP Management System MVP

**Feature**: 001-fyp-management-system-mvp  
**Date**: 2026-02-02  
**Target Audience**: Developers implementing backend and frontend

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Prerequisites](#prerequisites)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Database Setup](#database-setup)
6. [Running Locally](#running-locally)
7. [Testing](#testing)
8. [API Documentation](#api-documentation)
9. [Deployment](#deployment)

---

## Project Overview

The FYP Management System is implemented as **two separate repositories**:

1. **Backend** (`fyp-management-backend`): Express.js API
2. **Frontend** (`fyp-management-frontend`): Vue 3 SPA

**Architecture**:
- Backend exposes RESTful API at `/api/v1/`
- Frontend communicates via Axios HTTP client
- MongoDB stores all data
- JWT tokens handle authentication

**Key Features** (MVP):
- User authentication (email/password + JWT)
- Topic discovery and filtering
- Student-supervisor matching
- Document submission tracking
- Role-based dashboards
- Activity logging

---

## Prerequisites

### Required Software

- **Node.js**: v18.0.0 or later (LTS recommended)
- **npm**: v9.0.0 or later (comes with Node.js)
- **MongoDB**: v5.0+ (local or Atlas cloud)
- **Git**: For version control

### Verify Installation

```bash
# Check Node.js version
node --version  # Should be v18+

# Check npm version
npm --version   # Should be v9+

# Check MongoDB (if running locally)
mongod --version  # Should be v5+
```

### API Documentation Reference

- **Backend API**: [API Specification](api-specification.md)
- **Data Model**: [Data Model Documentation](../data-model.md)

---

## Backend Setup

### 1. Clone and Install

```bash
# Clone the backend repository
git clone https://github.com/university/fyp-management-backend.git
cd fyp-management-backend

# Install dependencies
npm install
```

### 2. Environment Configuration

Create `.env` file in backend root:

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/fyp_management
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fyp_management?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-secret-key-min-32-chars-for-production
JWT_EXPIRY=24h

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800  # 50MB

# CORS (for frontend)
FRONTEND_URL=http://localhost:5173

# Logging
LOG_LEVEL=debug
```

### 3. Create Upload Directory

```bash
mkdir -p uploads
```

### 4. Database Initialization

```bash
# Create MongoDB database and collections
npm run db:init

# (Or manually create via MongoDB CLI)
# use fyp_management;
# db.createCollection('users');
# db.createCollection('topics');
# [... etc for other collections]
```

### 5. Create Initial Admin User

```bash
npm run seed:admin
# Outputs: Admin account created: admin@university.edu / temp-password
```

### 6. Verify Backend Setup

```bash
# Start development server
npm run dev

# Expected output:
# Server running on http://localhost:5000
# Connected to MongoDB at mongodb://localhost:27017/fyp_management
```

**Backend is ready** when you see:
```
✓ Server listening on port 5000
✓ MongoDB connected
```

---

## Frontend Setup

### 1. Clone and Install

```bash
# Clone the frontend repository
git clone https://github.com/university/fyp-management-frontend.git
cd fyp-management-frontend

# Install dependencies
npm install
```

### 2. Environment Configuration

Create `.env.local` file in frontend root:

```env
# Backend API
VITE_API_URL=http://localhost:5000/api/v1

# App
VITE_APP_TITLE=FYP Management System
VITE_APP_ENV=development
```

### 3. Verify Frontend Setup

```bash
# Start development server
npm run dev

# Expected output:
# VITE v4.0.0  ready in xxx ms
# ➜  Local:   http://localhost:5173/
# ➜  press h to show help
```

**Frontend is ready** when you can access `http://localhost:5173` in your browser.

---

## Database Setup

### Option A: Local MongoDB

```bash
# Install MongoDB Community Edition (if not already installed)
# macOS with Homebrew:
brew install mongodb-community

# Start MongoDB server
mongod

# In another terminal, verify connection:
mongo
# > show databases
# > use fyp_management
# > show collections
```

### Option B: MongoDB Atlas (Cloud)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create cluster (free tier available)
3. Get connection string: `mongodb+srv://...`
4. Add connection string to `.env` in backend

### Seed Initial Data (Optional)

```bash
# Create admin user
npm run seed:admin

# Create sample topics (for testing)
npm run seed:topics

# Create sample students/supervisors
npm run seed:users
```

---

## Running Locally

### Terminal 1: Start Backend

```bash
cd fyp-management-backend
npm run dev
# Server: http://localhost:5000
# API Docs: http://localhost:5000/api-docs
```

### Terminal 2: Start Frontend

```bash
cd fyp-management-frontend
npm run dev
# Frontend: http://localhost:5173
```

### Terminal 3: Watch Tests (Optional)

```bash
cd fyp-management-backend
npm run test:watch
```

### Access the Application

1. Open browser: `http://localhost:5173`
2. Login with test credentials:
   - **Student**: `student1@university.edu` / `password123`
   - **Supervisor**: `prof1@university.edu` / `password123`
   - **Admin**: `admin@university.edu` / `password123`

---

## Testing

### Backend Tests

```bash
cd fyp-management-backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Expected coverage: >80% (project requirement)
```

**Test Structure**:
```
tests/
├── unit/               # Unit tests for functions/services
├── integration/        # Integration tests with database
└── contract/           # API contract tests
```

### Frontend Tests

```bash
cd fyp-management-frontend

# Run component unit tests
npm run test:unit

# Run E2E tests (requires backend running)
npm run test:e2e

# Run tests in watch mode
npm run test:watch
```

**Test Structure**:
```
tests/
├── unit/               # Component and store unit tests
├── integration/        # API integration tests
└── e2e/                # Playwright E2E tests
```

### Test Coverage

Backend and frontend must maintain **≥80% code coverage**:

```bash
# Backend coverage report
npm run test:coverage

# Frontend coverage report
cd ../fyp-management-frontend
npm run test:coverage
```

---

## API Documentation

### Swagger/OpenAPI Documentation

Backend automatically generates Swagger UI:

```
http://localhost:5000/api-docs
```

### API Contract Reference

See [API Specification](contracts/api-specification.md) for all endpoints:

- Authentication: `POST /api/v1/auth/login`
- Topics: `GET /api/v1/topics`, `POST /api/v1/topics`
- Applications: `POST /api/v1/applications`
- Submissions: `POST /api/v1/submissions/:phase/upload`
- Dashboards: `GET /api/v1/dashboard/student`, etc.

### Postman Collection

Import collection from `backend/postman-collection.json` for quick API testing.

---

## Code Style & Linting

### Backend

```bash
cd fyp-management-backend

# Run ESLint
npm run lint

# Fix linting errors
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting
npm run format:check
```

### Frontend

```bash
cd fyp-management-frontend

# Run ESLint
npm run lint

# Fix linting errors
npm run lint:fix

# Format code with Prettier
npm run format
```

Both follow the **project constitution**:
- ESLint rules for code quality
- Prettier for consistent formatting
- Pre-commit hooks (husky) enforce standards

---

## Deployment

### Backend Deployment

```bash
# Build for production
npm run build

# Start production server
npm start

# Environment variables for production:
# - NODE_ENV=production
# - JWT_SECRET=very-long-secret-key
# - MONGODB_URI=production-mongodb-atlas-uri
# - FRONTEND_URL=https://yourfrontend.com
```

### Frontend Deployment

```bash
# Build for production
npm run build

# Output: dist/ directory ready for deployment
# Deploy to: Vercel, Netlify, AWS S3 + CloudFront, etc.

# Environment variables:
# - VITE_API_URL=https://api.yoursite.com/api/v1
# - VITE_APP_ENV=production
```

### Docker (Optional)

Backend includes Dockerfile:

```bash
# Build Docker image
docker build -t fyp-backend:latest .

# Run container
docker run -p 5000:5000 --env-file .env.prod fyp-backend:latest
```

---

## Troubleshooting

### Backend won't start

```bash
# Check if port 5000 is in use
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill process using port 5000
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Check MongoDB connection
mongo "mongodb://localhost:27017"
```

### Frontend API calls fail (CORS)

- Verify backend is running on `http://localhost:5000`
- Check `VITE_API_URL` in `.env.local`
- Backend CORS configured for `http://localhost:5173`

### Tests fail

```bash
# Backend: Ensure MongoDB is running
# Frontend: Ensure backend is running before E2E tests

npm run test:unit  # Run just unit tests (no backend needed)
```

### Database errors

```bash
# Reset database (careful - deletes all data!)
npm run db:reset

# Check MongoDB logs
tail -f /usr/local/var/log/mongodb/mongo.log  # macOS with Homebrew
```

---

## Development Workflow

### Creating a New Feature

1. **Backend**:
   - Create model in `src/models/`
   - Create controller in `src/controllers/`
   - Create route in `src/routes/`
   - Write tests in `tests/`
   - Add tests to reach 80% coverage

2. **Frontend**:
   - Create component in `src/components/`
   - Create store/composable as needed
   - Create page if needed in `src/pages/`
   - Write component tests
   - Add E2E tests for user flows

3. **Documentation**:
   - Update API contract if endpoints changed
   - Update data model if schema changed
   - Update README if setup changed

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/topic-search

# Commit changes
git add .
git commit -m "Add topic search filtering"

# Push to origin
git push origin feature/topic-search

# Create Pull Request on GitHub
# - Ensure tests pass
# - Ensure coverage remains ≥80%
# - Code review required before merge
```

---

## Next Steps

1. **Setup**: Follow Backend → Frontend → Database setup above
2. **Run**: Start both servers and access application
3. **Explore**: Browse topics, create accounts, test submission workflow
4. **Develop**: Use sections above as reference for adding features
5. **Test**: Ensure >80% coverage before committing
6. **Deploy**: Follow Deployment section when ready

---

## Support & Resources

- **API Reference**: [API Specification](contracts/api-specification.md)
- **Data Model**: [Data Model Documentation](../data-model.md)
- **Feature Spec**: [Feature Specification](../spec.md)
- **Backend README**: `fyp-management-backend/README.md`
- **Frontend README**: `fyp-management-frontend/README.md`

---

**Happy coding!** 🚀
