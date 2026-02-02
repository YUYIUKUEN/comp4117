# API Contract Overview

**Feature**: 001-fyp-management-system-mvp  
**API Version**: v1  
**Base URL**: `/api/v1/`  
**Format**: RESTful JSON  
**Date**: 2026-02-02

---

## Standard Response Format

### Success Response (2xx)

```json
{
  "data": { /* response body */ },
  "status": 200,
  "message": "Operation successful"
}
```

### Error Response (4xx, 5xx)

```json
{
  "error": "Error message describing what went wrong",
  "code": "ERROR_CODE",
  "status": 400
}
```

**Standard Error Codes**:
- `INVALID_INPUT`: Request body validation failed
- `UNAUTHORIZED`: Missing or invalid token
- `FORBIDDEN`: User lacks permission
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Duplicate resource (e.g., duplicate application)
- `INTERNAL_ERROR`: Server error

---

## Authentication

All protected endpoints require JWT token in `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

### POST /api/v1/auth/login

**Public** | **POST**

**Request**:
```json
{
  "email": "student@university.edu",
  "password": "password123"
}
```

**Response (200 OK)**:
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "student@university.edu",
      "fullName": "John Doe",
      "role": "Student",
      "concentration": "Software Engineering"
    }
  }
}
```

**Response (401 Unauthorized)**:
```json
{
  "error": "Invalid email or password",
  "code": "UNAUTHORIZED"
}
```

---

### POST /api/v1/auth/logout

**Protected** | **POST** | **Requires**: Student, Supervisor, or Admin

**Response (200 OK)**:
```json
{
  "data": { "message": "Logged out successfully" }
}
```

---

## Topics

### GET /api/v1/topics

**Public** | **GET**

**Query Parameters**:
- `concentration` (optional): Filter by concentration (Software Engineering, Data Science)
- `year` (optional): Filter by academic year (1-6)
- `keyword` (optional): Search by title/description keywords
- `page` (optional, default: 1): Pagination page
- `limit` (optional, default: 25): Items per page

**Response (200 OK)**:
```json
{
  "data": {
    "topics": [
      {
        "id": "507f1f77bcf86cd799439011",
        "title": "Machine Learning for Sentiment Analysis",
        "description": "Develop ML models to analyze...",
        "supervisor": {
          "id": "507f1f77bcf86cd799439012",
          "fullName": "Dr. Jane Smith"
        },
        "concentration": "Data Science",
        "academicYear": 4,
        "keywords": ["ML", "NLP", "Python"],
        "status": "Active"
      }
    ],
    "total": 45,
    "page": 1,
    "limit": 25,
    "pages": 2
  }
}
```

---

### GET /api/v1/topics/:topicId

**Public** | **GET**

**Response (200 OK)**:
```json
{
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "title": "Machine Learning for Sentiment Analysis",
    "description": "...",
    "supervisor": {
      "id": "507f1f77bcf86cd799439012",
      "fullName": "Dr. Jane Smith",
      "email": "jane@university.edu"
    },
    "concentration": "Data Science",
    "academicYear": 4,
    "keywords": ["ML", "NLP"],
    "referenceDocuments": [
      { "name": "Research Paper", "url": "..." }
    ],
    "status": "Active",
    "createdAt": "2026-01-15T10:00:00Z"
  }
}
```

---

### POST /api/v1/topics

**Protected** | **POST** | **Requires**: Supervisor

**Request**:
```json
{
  "title": "Topic Title",
  "description": "Detailed description...",
  "concentration": "Software Engineering",
  "academicYear": 4,
  "keywords": ["keyword1", "keyword2"],
  "referenceDocuments": [
    { "name": "Doc Name", "url": "..." }
  ]
}
```

**Response (201 Created)**:
```json
{
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "title": "Topic Title",
    "supervisor_id": "507f1f77bcf86cd799439012",
    "status": "Active",
    "createdAt": "2026-02-02T12:00:00Z"
  }
}
```

---

## Applications

### POST /api/v1/applications

**Protected** | **POST** | **Requires**: Student

**Request**:
```json
{
  "topic_id": "507f1f77bcf86cd799439011",
  "preference_rank": 1
}
```

**Response (201 Created)**:
```json
{
  "data": {
    "id": "507f1f77bcf86cd799439020",
    "student_id": "507f1f77bcf86cd799439013",
    "topic_id": "507f1f77bcf86cd799439011",
    "preference_rank": 1,
    "status": "Pending",
    "appliedAt": "2026-02-02T12:00:00Z"
  }
}
```

---

### GET /api/v1/applications/my-applications

**Protected** | **GET** | **Requires**: Student

**Response (200 OK)**:
```json
{
  "data": {
    "applications": [
      {
        "id": "507f1f77bcf86cd799439020",
        "topic": {
          "id": "507f1f77bcf86cd799439011",
          "title": "Topic Title",
          "supervisor": { "fullName": "Dr. Jane Smith" }
        },
        "preference_rank": 1,
        "status": "Pending",
        "appliedAt": "2026-02-02T12:00:00Z"
      }
    ]
  }
}
```

---

### GET /api/v1/applications/topic/:topicId

**Protected** | **GET** | **Requires**: Supervisor (of the topic)

**Response (200 OK)**:
```json
{
  "data": {
    "applicants": [
      {
        "id": "507f1f77bcf86cd799439020",
        "student": {
          "id": "507f1f77bcf86cd799439013",
          "fullName": "John Doe",
          "email": "john@student.edu"
        },
        "preference_rank": 1,
        "status": "Pending"
      }
    ]
  }
}
```

---

### POST /api/v1/applications/:applicationId/approve

**Protected** | **POST** | **Requires**: Supervisor (of topic)

**Request**:
```json
{
  "supervisorNotes": "Selected based on strong background"
}
```

**Response (200 OK)**:
```json
{
  "data": {
    "id": "507f1f77bcf86cd799439020",
    "status": "Approved",
    "decidedAt": "2026-02-02T13:00:00Z",
    "assignment": {
      "id": "507f1f77bcf86cd799439030",
      "status": "Active"
    }
  }
}
```

---

### POST /api/v1/applications/:applicationId/reject

**Protected** | **POST** | **Requires**: Supervisor (of topic)

**Request**:
```json
{
  "supervisorNotes": "Selected another candidate"
}
```

**Response (200 OK)**:
```json
{
  "data": {
    "id": "507f1f77bcf86cd799439020",
    "status": "Rejected",
    "decidedAt": "2026-02-02T13:00:00Z"
  }
}
```

---

## Submissions

### GET /api/v1/submissions/my-submissions

**Protected** | **GET** | **Requires**: Student

**Response (200 OK)**:
```json
{
  "data": {
    "submissions": [
      {
        "id": "507f1f77bcf86cd799439040",
        "phase": "Initial Statement",
        "status": "Submitted",
        "submittedAt": "2026-02-01T10:00:00Z",
        "dueDate": "2026-03-15T23:59:59Z",
        "files": [
          {
            "filename": "initial_statement.pdf",
            "size": 1024000,
            "uploadedAt": "2026-02-01T10:00:00Z"
          }
        ],
        "feedback": [
          {
            "id": "507f1f77bcf86cd799439041",
            "supervisorName": "Dr. Jane Smith",
            "text": "Good initial plan...",
            "createdAt": "2026-02-02T11:00:00Z"
          }
        ]
      }
    ]
  }
}
```

---

### POST /api/v1/submissions/:phase/upload

**Protected** | **POST** | **Requires**: Student

**Request** (multipart/form-data):
- `file`: Binary file (PDF, Word, etc.)
- `formData` (optional): JSON string with form fields

**Response (201 Created)**:
```json
{
  "data": {
    "id": "507f1f77bcf86cd799439040",
    "phase": "Initial Statement",
    "status": "Submitted",
    "submittedAt": "2026-02-02T12:00:00Z",
    "files": [
      {
        "filename": "initial_statement.pdf",
        "size": 2048000,
        "uploadedAt": "2026-02-02T12:00:00Z"
      }
    ]
  }
}
```

---

### POST /api/v1/submissions/:phase/declare-not-needed

**Protected** | **POST** | **Requires**: Student

**Request**:
```json
{
  "reason": "REC form not required - literature review only"
}
```

**Response (200 OK)**:
```json
{
  "data": {
    "id": "507f1f77bcf86cd799439040",
    "phase": "Progress Report 1",
    "status": "Declared Not Needed",
    "declarationReason": "REC form not required - literature review only",
    "declaredAt": "2026-02-02T12:30:00Z"
  }
}
```

---

## Feedback

### POST /api/v1/feedback/submission/:submissionId

**Protected** | **POST** | **Requires**: Supervisor

**Request**:
```json
{
  "feedbackText": "Good work on the project. Consider..."
}
```

**Response (201 Created)**:
```json
{
  "data": {
    "id": "507f1f77bcf86cd799439041",
    "submission_id": "507f1f77bcf86cd799439040",
    "supervisor_id": "507f1f77bcf86cd799439012",
    "feedbackText": "Good work on the project...",
    "createdAt": "2026-02-02T14:00:00Z"
  }
}
```

---

### GET /api/v1/feedback/submission/:submissionId

**Protected** | **GET** | **Requires**: Student (own submission) or Supervisor

**Response (200 OK)**:
```json
{
  "data": {
    "feedback": [
      {
        "id": "507f1f77bcf86cd799439041",
        "supervisor": {
          "id": "507f1f77bcf86cd799439012",
          "fullName": "Dr. Jane Smith"
        },
        "text": "Good work on the project...",
        "createdAt": "2026-02-02T14:00:00Z"
      }
    ]
  }
}
```

---

## Dashboards

### GET /api/v1/dashboard/student

**Protected** | **GET** | **Requires**: Student

**Response (200 OK)**:
```json
{
  "data": {
    "student": {
      "id": "507f1f77bcf86cd799439013",
      "fullName": "John Doe",
      "concentration": "Software Engineering"
    },
    "assignment": {
      "topic": {
        "title": "Topic Title",
        "description": "..."
      },
      "supervisor": {
        "fullName": "Dr. Jane Smith",
        "email": "jane@university.edu"
      }
    },
    "submissions": [
      {
        "phase": "Initial Statement",
        "status": "Submitted",
        "submittedAt": "2026-02-01T10:00:00Z",
        "dueDate": "2026-03-15T23:59:59Z"
      }
    ],
    "referenceDocuments": [...]
  }
}
```

---

### GET /api/v1/dashboard/supervisor

**Protected** | **GET** | **Requires**: Supervisor

**Response (200 OK)**:
```json
{
  "data": {
    "supervisor": {
      "id": "507f1f77bcf86cd799439012",
      "fullName": "Dr. Jane Smith"
    },
    "topics": [
      {
        "id": "507f1f77bcf86cd799439011",
        "title": "Topic Title",
        "applicantCount": 5,
        "assignmentCount": 1
      }
    ],
    "students": [
      {
        "id": "507f1f77bcf86cd799439013",
        "fullName": "John Doe",
        "topic": "Topic Title",
        "submissionStatus": {
          "Initial Statement": "Submitted",
          "Progress Report 1": "Pending"
        }
      }
    ],
    "pendingApplications": 3
  }
}
```

---

### GET /api/v1/dashboard/admin

**Protected** | **GET** | **Requires**: Admin

**Response (200 OK)**:
```json
{
  "data": {
    "statistics": {
      "totalStudents": 150,
      "totalSupervisors": 25,
      "totalTopics": 60,
      "topicsActive": 50,
      "topicsArchived": 10,
      "assignmentsPending": 15,
      "assignmentsActive": 130,
      "completionRate": {
        "initialStatement": "95%",
        "progressReport1": "78%",
        "progressReport2": "45%"
      }
    },
    "recentActivity": [
      {
        "user": "john@student.edu",
        "action": "Submitted Initial Statement",
        "timestamp": "2026-02-02T12:00:00Z"
      }
    ]
  }
}
```

---

## Users (Admin)

### POST /api/v1/users

**Protected** | **POST** | **Requires**: Admin

**Request**:
```json
{
  "email": "newuser@university.edu",
  "fullName": "New User",
  "role": "Student",
  "concentration": "Software Engineering",
  "tempPassword": "TempPass123!"
}
```

**Response (201 Created)**:
```json
{
  "data": {
    "id": "507f1f77bcf86cd799439050",
    "email": "newuser@university.edu",
    "fullName": "New User",
    "role": "Student",
    "createdAt": "2026-02-02T15:00:00Z"
  }
}
```

---

### GET /api/v1/users

**Protected** | **GET** | **Requires**: Admin

**Query Parameters**:
- `role` (optional): Filter by role (Student, Supervisor, Admin)
- `concentration` (optional): Filter by concentration
- `page` (optional): Pagination
- `limit` (optional): Items per page

**Response (200 OK)**:
```json
{
  "data": {
    "users": [
      {
        "id": "507f1f77bcf86cd799439050",
        "email": "user@university.edu",
        "fullName": "User Name",
        "role": "Student",
        "concentration": "Software Engineering",
        "createdAt": "2026-02-02T15:00:00Z"
      }
    ],
    "total": 250,
    "page": 1,
    "pages": 10
  }
}
```

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "error": "Descriptive error message",
  "code": "ERROR_CODE",
  "status": 400
}
```

**Common HTTP Status Codes**:
- `200 OK`: Successful GET request
- `201 Created`: Successful POST request creating resource
- `400 Bad Request`: Invalid input (INVALID_INPUT)
- `401 Unauthorized`: Missing/invalid token (UNAUTHORIZED)
- `403 Forbidden`: User lacks permission (FORBIDDEN)
- `404 Not Found`: Resource not found (NOT_FOUND)
- `409 Conflict`: Duplicate resource (CONFLICT)
- `500 Internal Server Error`: Server error (INTERNAL_ERROR)

---

## Next Steps

This contract specification is ready for implementation. Each endpoint will have:
- Request/response validation using Zod/Joi
- Unit tests with Jest + Supertest
- Integration tests with test database
- API documentation generated from code comments
