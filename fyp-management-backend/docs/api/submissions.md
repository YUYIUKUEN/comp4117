# Submission API Documentation

## Overview

The Submission API provides endpoints for managing document submissions across 4 submission phases (Initial Statement, Progress Reports 1-2, and Final Dissertation). Students can upload documents, declare non-submission, and view their submissions. Supervisors can view all student submissions under their supervision and download files.

## Base URL

```
/api/v1/submissions
```

## Authentication

All endpoints require authentication via JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

## Student Endpoints

### 1. Submit Document

**POST** `/:phase/submit`

Submit a document for a specific submission phase.

**Parameters:**
- `phase` (path, required): One of `Initial Statement`, `Progress Report 1`, `Progress Report 2`, `Final Dissertation`
- `file` (formData, required): PDF or DOCX file (max 50MB)

**Headers:**
- `Authorization: Bearer <token>` (Student role required)
- `Content-Type: multipart/form-data`

**Request Example:**
```bash
curl -X POST /api/v1/submissions/Initial%20Statement/submit \
  -H "Authorization: Bearer <token>" \
  -F "file=@submission.pdf"
```

**Success Response (201):**
```json
{
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "student_id": "65a1b2c3d4e5f6g7h8i9j0k2",
    "topic_id": "65a1b2c3d4e5f6g7h8i9j0k3",
    "phase": "Initial Statement",
    "status": "Submitted",
    "submittedAt": "2026-02-07T10:30:00Z",
    "files": [
      {
        "filename": "1673445600000-a1b2c3d4.pdf",
        "originalName": "submission.pdf",
        "mimetype": "application/pdf",
        "size": 1024000,
        "uploadedAt": "2026-02-07T10:30:00Z",
        "url": "/api/v1/submissions/Initial%20Statement/files/1673445600000-a1b2c3d4.pdf"
      }
    ],
    "dueDate": "2026-02-21T00:00:00Z",
    "createdAt": "2026-02-07T10:30:00Z",
    "updatedAt": "2026-02-07T10:30:00Z"
  },
  "status": 201
}
```

**Error Responses:**
- `400 NO_FILE`: No file provided
- `400 INVALID_FILE`: Invalid file type or size
- `400 NO_ASSIGNMENT`: Student has no active assignment
- `401`: Unauthorized (no token or invalid token)

### 2. Get Submission

**GET** `/:phase`

Retrieve a submission for a specific phase.

**Parameters:**
- `phase` (path, required): One of `Initial Statement`, `Progress Report 1`, `Progress Report 2`, `Final Dissertation`

**Request Example:**
```bash
curl -X GET /api/v1/submissions/Initial%20Statement \
  -H "Authorization: Bearer <token>"
```

**Success Response (200):**
```json
{
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "student_id": "65a1b2c3d4e5f6g7h8i9j0k2",
    "topic_id": "65a1b2c3d4e5f6g7h8i9j0k3",
    "phase": "Initial Statement",
    "status": "Submitted",
    "submittedAt": "2026-02-07T10:30:00Z",
    "files": [...],
    "dueDate": "2026-02-21T00:00:00Z",
    "createdAt": "2026-02-07T10:30:00Z",
    "updatedAt": "2026-02-07T10:30:00Z"
  },
  "status": 200
}
```

**Error Responses:**
- `404 NOT_FOUND`: Submission not found
- `401`: Unauthorized

### 3. Download File

**GET** `/:phase/files/:filename`

Download a submission file.

**Parameters:**
- `phase` (path, required): Submission phase
- `filename` (path, required): Name of the file to download

**Request Example:**
```bash
curl -X GET /api/v1/submissions/Initial%20Statement/files/1673445600000-a1b2c3d4.pdf \
  -H "Authorization: Bearer <token>"
```

**Success Response (200):**
File content is returned with appropriate Content-Type and Content-Disposition headers.

**Error Responses:**
- `404 NOT_FOUND`: Submission not found
- `404 FILE_NOT_FOUND`: File not found in submission
- `401`: Unauthorized

### 4. Declare Not Needed

**POST** `/:phase/declare-not-needed`

Declare that a submission is not needed for this phase.

**Parameters:**
- `phase` (path, required): Submission phase
- `reason` (body, required): Reason for declaration (max 1000 characters)

**Request Body:**
```json
{
  "reason": "No project updates for this phase"
}
```

**Request Example:**
```bash
curl -X POST /api/v1/submissions/Initial%20Statement/declare-not-needed \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "No project updates for this phase"}'
```

**Success Response (200):**
```json
{
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "student_id": "65a1b2c3d4e5f6g7h8i9j0k2",
    "phase": "Initial Statement",
    "status": "Declared Not Needed",
    "declarationReason": "No project updates for this phase",
    "declaredAt": "2026-02-07T10:35:00Z",
    "dueDate": "2026-02-21T00:00:00Z"
  },
  "status": 200
}
```

**Error Responses:**
- `400 INVALID_INPUT`: Reason not provided
- `400 NO_ASSIGNMENT`: Student has no active assignment
- `401`: Unauthorized

## Supervisor Endpoints

### 1. Get All Submissions

**GET** `/supervisor/submissions`

Retrieve all submissions for students assigned to this supervisor.

**Query Parameters:**
- `phase` (optional): Filter by submission phase
- `status` (optional): Filter by status (Not Submitted, Submitted, Overdue, Declared Not Needed)

**Request Example:**
```bash
curl -X GET '/api/v1/submissions/supervisor/submissions?phase=Initial%20Statement&status=Submitted' \
  -H "Authorization: Bearer <supervisor-token>"
```

**Success Response (200):**
```json
{
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "student_id": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
        "fullName": "John Student",
        "email": "student@university.edu"
      },
      "topic_id": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
        "title": "AI Topic"
      },
      "phase": "Initial Statement",
      "status": "Submitted",
      "submittedAt": "2026-02-07T10:30:00Z",
      "files": [...],
      "dueDate": "2026-02-21T00:00:00Z"
    }
  ],
  "status": 200
}
```

**Error Responses:**
- `401`: Unauthorized
- `403`: Supervisor role required

### 2. Get Student Submission

**GET** `/supervisor/student/:studentId/:phase`

Retrieve a specific student's submission for a phase.

**Parameters:**
- `studentId` (path, required): Student's ObjectId
- `phase` (path, required): Submission phase

**Request Example:**
```bash
curl -X GET '/api/v1/submissions/supervisor/student/65a1b2c3d4e5f6g7h8i9j0k2/Initial%20Statement' \
  -H "Authorization: Bearer <supervisor-token>"
```

**Success Response (200):**
```json
{
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "student_id": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "fullName": "John Student",
      "email": "student@university.edu"
    },
    "topic_id": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
      "title": "AI Topic"
    },
    "phase": "Initial Statement",
    "status": "Submitted",
    "files": [...]
  },
  "status": 200
}
```

**Error Responses:**
- `403 FORBIDDEN`: Supervisor is not assigned to this student
- `404 NOT_FOUND`: Submission not found
- `401`: Unauthorized

### 3. Download Student File

**GET** `/supervisor/student/:studentId/:phase/files/:filename`

Download a file from a student's submission.

**Parameters:**
- `studentId` (path, required): Student's ObjectId
- `phase` (path, required): Submission phase
- `filename` (path, required): Name of the file

**Request Example:**
```bash
curl -X GET '/api/v1/submissions/supervisor/student/65a1b2c3d4e5f6g7h8i9j0k2/Initial%20Statement/files/1673445600000-a1b2c3d4.pdf' \
  -H "Authorization: Bearer <supervisor-token>"
```

**Success Response (200):**
File content is returned with appropriate headers.

**Error Responses:**
- `403 FORBIDDEN`: Supervisor is not assigned to this student
- `404 NOT_FOUND`: Submission or file not found
- `401`: Unauthorized

### 4. Get Submission Statistics

**GET** `/supervisor/statistics`

Get aggregated submission statistics for all students assigned to this supervisor.

**Request Example:**
```bash
curl -X GET /api/v1/submissions/supervisor/statistics \
  -H "Authorization: Bearer <supervisor-token>"
```

**Success Response (200):**
```json
{
  "data": [
    {
      "_id": "Initial Statement",
      "total": 10,
      "submitted": 8,
      "notSubmitted": 1,
      "overdue": 1,
      "declaredNotNeeded": 0
    },
    {
      "_id": "Progress Report 1",
      "total": 10,
      "submitted": 7,
      "notSubmitted": 2,
      "overdue": 1,
      "declaredNotNeeded": 0
    }
  ],
  "status": 200
}
```

**Error Responses:**
- `401`: Unauthorized
- `403`: Supervisor role required

## File Upload Specifications

### Allowed File Types
- PDF (`application/pdf`)
- DOCX (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`)

### File Size Limits
- Maximum: 50MB

### File Storage
- Files are stored on the server in the `uploads/submissions/` directory
- Files are stored with a unique name to prevent conflicts
- Original filename is preserved in metadata

## Error Handling

All error responses follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "status": HTTP_STATUS_CODE
}
```

### Common Error Codes
- `NO_FILE`: No file provided in multipart request
- `INVALID_FILE`: File validation failed (type or size)
- `NO_ASSIGNMENT`: Student/supervisor has no active assignment
- `NOT_FOUND`: Resource not found
- `FILE_NOT_FOUND`: File not found
- `FORBIDDEN`: Not authorized to access resource
- `INVALID_INPUT`: Invalid input data

## Status Values

Submission status can be one of:
- `Not Submitted`: Document not yet submitted
- `Submitted`: Document successfully submitted
- `Overdue`: Due date has passed without submission
- `Declared Not Needed`: Student declared submission not needed

## Submission Phases

1. **Initial Statement** - Initial project description (Due: 14 days)
2. **Progress Report 1** - First progress update (Due: 60 days)
3. **Progress Report 2** - Second progress update (Due: 120 days)
4. **Final Dissertation** - Final project submission (Due: 180 days)

## Activity Logging

All submission-related actions are logged to the ActivityLog:
- `document_submitted` - Document uploaded
- `submission_declared_not_needed` - Submission marked as not needed
- `submission_file_viewed` - File downloaded by supervisor

## Rate Limiting

No rate limiting is currently implemented. Contact system administrator for performance requirements.

## Version

API Version: 1.0
Last Updated: 2026-02-07
