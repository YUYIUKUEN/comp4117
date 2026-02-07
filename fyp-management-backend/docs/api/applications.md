# Applications & Assignments API Documentation

## Overview
This document describes the API endpoints for managing FYP topic applications, approvals, and assignments.

## Base URL
```
/api/v1
```

## Authentication
All endpoints require a valid JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

---

## Applications Endpoints

### Apply to Topic
**POST** `/applications/`

Create a new application for a topic. Students can apply to multiple topics (max 5 pending applications).

**Required Role:** `Student`

**Request Body:**
```json
{
  "topic_id": "507f1f77bcf86cd799439011",
  "preference_rank": 1
}
```

**Parameters:**
- `topic_id` (ObjectId, required): The ID of the topic to apply to
- `preference_rank` (Number, required): Ranking from 1 (highest) to 5 (lowest)

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "student_id": {
      "_id": "507f1f77bcf86cd799439010",
      "email": "student@example.com",
      "fullName": "John Doe"
    },
    "topic_id": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "AI Research Topic"
    },
    "preference_rank": 1,
    "status": "Pending",
    "appliedAt": "2024-02-07T10:30:00Z",
    "createdAt": "2024-02-07T10:30:00Z"
  }
}
```

**Error Responses:**
- `400 DUPLICATE_APPLICATION`: Student already applied to this topic
- `400 APPLICATION_LIMIT_EXCEEDED`: Student has 5 or more pending applications
- `400 TOPIC_NOT_ACTIVE`: Can only apply to Active topics
- `400 INVALID_PREFERENCE_RANK`: Preference rank must be 1-5
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: User is not a Student

---

### Get My Applications
**GET** `/applications/my-applications`

Retrieve all your (student's) applications.

**Required Role:** `Student`

**Query Parameters:**
- `page` (Number, default: 1): Page number for pagination
- `limit` (Number, default: 10): Records per page
- `status` (String, optional): Filter by status (Pending, Approved, Rejected)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "topic_id": {
        "_id": "507f1f77bcf86cd799439011",
        "title": "AI Research Topic"
      },
      "preference_rank": 1,
      "status": "Pending",
      "appliedAt": "2024-02-07T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "pages": 1
  }
}
```

---

### Withdraw Application
**DELETE** `/applications/:id`

Withdraw a pending application. Can only withdraw applications with `Pending` status.

**Required Role:** `Student`

**Path Parameters:**
- `id` (ObjectId): The application ID to withdraw

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Application withdrawn successfully"
}
```

**Error Responses:**
- `403 FORBIDDEN`: You can only withdraw your own applications
- `404 APPLICATION_NOT_FOUND`: Application not found
- `400 CANNOT_WITHDRAW`: Can only withdraw pending applications

---

### Get Application by ID
**GET** `/applications/:id`

Retrieve details of a specific application.

**Required Role:** Any authenticated user

**Path Parameters:**
- `id` (ObjectId): The application ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "student_id": {
      "_id": "507f1f77bcf86cd799439010",
      "email": "student@example.com"
    },
    "topic_id": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "AI Research Topic"
    },
    "preference_rank": 1,
    "status": "Pending",
    "supervisorNotes": "",
    "appliedAt": "2024-02-07T10:30:00Z"
  }
}
```

---

## Supervisor Endpoints

### Get Supervisor Applications
**GET** `/applications/supervisor/applications`

Retrieve all applications for your (supervisor's) topics.

**Required Role:** `Supervisor`

**Query Parameters:**
- `page` (Number, default: 1): Page number for pagination
- `limit` (Number, default: 10): Records per page
- `status` (String, optional): Filter by status (Pending, Approved, Rejected)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "student_id": {
        "_id": "507f1f77bcf86cd799439010",
        "email": "student@example.com",
        "fullName": "John Doe"
      },
      "topic_id": {
        "_id": "507f1f77bcf86cd799439011",
        "title": "AI Research Topic"
      },
      "preference_rank": 1,
      "status": "Pending",
      "appliedAt": "2024-02-07T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

---

### Approve Application
**POST** `/applications/:applicationId/approve`

Approve a pending application. Creates an Assignment and automatically rejects other pending applications from the same student.

**Required Role:** `Supervisor`

**Path Parameters:**
- `applicationId` (ObjectId): The application ID to approve

**Request Body (Optional):**
```json
{
  "supervisorNotes": "Excellent candidate for this project"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "application": {
      "_id": "507f1f77bcf86cd799439012",
      "student_id": {...},
      "topic_id": {...},
      "status": "Approved",
      "decidedAt": "2024-02-07T11:30:00Z",
      "supervisorNotes": "Excellent candidate for this project"
    },
    "assignment": {
      "_id": "507f1f77bcf86cd799439013",
      "status": "Active",
      "assigned_at": "2024-02-07T11:30:00Z"
    }
  }
}
```

**Error Responses:**
- `403 FORBIDDEN`: You can only approve applications for your own topics
- `400 STUDENT_ALREADY_ASSIGNED`: Student already has an active assignment
- `400 CANNOT_APPROVE`: Can only approve pending applications
- `404 APPLICATION_NOT_FOUND`: Application not found

---

### Reject Application
**POST** `/applications/:applicationId/reject`

Reject a pending application.

**Required Role:** `Supervisor`

**Path Parameters:**
- `applicationId` (ObjectId): The application ID to reject

**Request Body (Optional):**
```json
{
  "supervisorNotes": "Does not meet requirements"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "student_id": {...},
    "topic_id": {...},
    "status": "Rejected",
    "decidedAt": "2024-02-07T11:30:00Z",
    "supervisorNotes": "Does not meet requirements"
  }
}
```

**Error Responses:**
- `403 FORBIDDEN`: You can only reject applications for your own topics
- `400 CANNOT_REJECT`: Can only reject pending applications
- `404 APPLICATION_NOT_FOUND`: Application not found

---

### Get Application Statistics
**GET** `/applications/stats/overview`

Get aggregated statistics for your applications by status.

**Required Role:** `Supervisor`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 15,
    "pending": 8,
    "approved": 5,
    "rejected": 2
  }
}
```

---

### Get Topic-Specific Statistics
**GET** `/applications/topic/:topicId/stats`

Get statistics for a specific topic's applications.

**Required Role:** `Supervisor`

**Path Parameters:**
- `topicId` (ObjectId): The topic ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "topicId": "507f1f77bcf86cd799439011",
    "total": 5,
    "pending": 2,
    "approved": 2,
    "rejected": 1
  }
}
```

**Error Responses:**
- `403 FORBIDDEN`: You can only view statistics for your own topics
- `404 TOPIC_NOT_FOUND`: Topic not found

---

## Assignments Endpoints

### Get My Assignment
**GET** `/assignments/my-assignment`

Retrieve your (student's) active topic assignment, if any.

**Required Role:** `Student`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "student_id": {
      "_id": "507f1f77bcf86cd799439010",
      "email": "student@example.com",
      "fullName": "John Doe"
    },
    "topic_id": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "AI Research Topic",
      "supervisor_id": "507f1f77bcf86cd799439009"
    },
    "supervisor_id": {
      "_id": "507f1f77bcf86cd799439009",
      "email": "supervisor@example.com",
      "fullName": "Dr. Smith"
    },
    "status": "Active",
    "assigned_at": "2024-02-07T11:30:00Z"
  }
}
```

**Error Responses:**
- `404 NO_ACTIVE_ASSIGNMENT`: You do not have an active assignment
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: User is not a Student

---

### Get Supervisor Assignments
**GET** `/assignments/supervisor/assignments`

Retrieve all assignments for your (supervisor's) topics.

**Required Role:** `Supervisor`

**Query Parameters:**
- `page` (Number, default: 1): Page number for pagination
- `limit` (Number, default: 10): Records per page
- `status` (String, optional): Filter by status (Active, Completed, Changed)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "student_id": {
        "_id": "507f1f77bcf86cd799439010",
        "email": "student@example.com",
        "fullName": "John Doe"
      },
      "topic_id": {
        "_id": "507f1f77bcf86cd799439011",
        "title": "AI Research Topic"
      },
      "status": "Active",
      "assigned_at": "2024-02-07T11:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "pages": 1
  }
}
```

---

### Get Assignment by ID
**GET** `/assignments/:id`

Retrieve details of a specific assignment.

**Required Role:** Any authenticated user

**Path Parameters:**
- `id` (ObjectId): The assignment ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "student_id": {...},
    "topic_id": {...},
    "supervisor_id": {...},
    "status": "Active",
    "assigned_at": "2024-02-07T11:30:00Z"
  }
}
```

**Error Responses:**
- `404 ASSIGNMENT_NOT_FOUND`: Assignment not found
- `400 INVALID_ID`: Invalid assignment ID format

---

### Complete Assignment
**POST** `/assignments/:id/complete`

Mark an active assignment as completed.

**Required Role:** `Supervisor`

**Path Parameters:**
- `id` (ObjectId): The assignment ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "student_id": {...},
    "topic_id": {...},
    "supervisor_id": {...},
    "status": "Completed"
  }
}
```

**Error Responses:**
- `403 FORBIDDEN`: You can only complete assignments for your own topics
- `400 CANNOT_COMPLETE`: Can only complete active assignments
- `404 ASSIGNMENT_NOT_FOUND`: Assignment not found

---

## Data Models

### Application
```javascript
{
  _id: ObjectId,
  student_id: ObjectId (ref: User),
  topic_id: ObjectId (ref: Topic),
  preference_rank: Number (1-5),  // Student's preference (1=highest)
  status: String ("Pending" | "Approved" | "Rejected"),
  supervisorNotes: String,  // Optional notes from supervisor
  appliedAt: Date,  // Immutable - cannot be changed after creation
  decidedAt: Date,  // Set when status changes from Pending
  createdAt: Date,
  updatedAt: Date
}
```

**Constraints:**
- Unique: (student_id, topic_id) - Student can apply to each topic only once
- Indexes: (student_id, status), (topic_id, status), (status, appliedAt)

### Assignment
```javascript
{
  _id: ObjectId,
  student_id: ObjectId (ref: User),
  topic_id: ObjectId (ref: Topic),
  supervisor_id: ObjectId (ref: User),
  status: String ("Active" | "Completed" | "Changed"),
  assigned_at: Date,  // Immutable - cannot be changed after creation
  replacedBy: ObjectId (ref: Assignment),  // Optional - if assignment was replaced
  createdAt: Date,
  updatedAt: Date
}
```

**Constraints:**
- Unique (Sparse): (student_id, status='Active') - Only 1 active assignment per student
- Indexes: (supervisor_id, status), (topic_id, status)

---

##Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Missing or invalid required fields |
| `INVALID_ID` | 400 | Invalid ObjectId format |
| `DUPLICATE_APPLICATION` | 400 | Student already applied to this topic |
| `APPLICATION_LIMIT_EXCEEDED` | 400 | Student has too many pending applications |
| `TOPIC_NOT_ACTIVE` | 400 | Topic is not in Active status |
| `INVALID_PREFERENCE_RANK` | 400 | Preference rank must be 1-5 |
| `CANNOT_WITHDRAW` | 400 | Can only withdraw Pending applications |
| `CANNOT_APPROVE` | 400 | Can only approve Pending applications |
| `STUDENT_ALREADY_ASSIGNED` | 400 | Student already has an active assignment |
| `CANNOT_REJECT` | 400 | Can only reject Pending applications |
| `CANNOT_COMPLETE` | 400 | Can only complete Active assignments |
| `NO_ACTIVE_ASSIGNMENT` | 404 | Student has no active assignment |
| `APPLICATION_NOT_FOUND` | 404 | Application record not found |
| `ASSIGNMENT_NOT_FOUND` | 404 | Assignment record not found |
| `TOPIC_NOT_FOUND` | 404 | Topic record not found |
| `FORBIDDEN` | 403 | User does not have permission for this resource |
| `INTERNAL_ERROR` | 500 | Server error - please contact support |

---

## Workflow Example

### Student Application Process
1. Student applies to topic with preference_rank=1
   ```
   POST /applications/
   {
     "topic_id": "507f1f77bcf86cd799439011",
     "preference_rank": 1
   }
   ```

2. Application created with status="Pending"

3. Supervisor approves the application
   ```
   POST /applications/507f1f77bcf86cd799439012/approve
   {
     "supervisorNotes": "Excellent fit"
   }
   ```

4. System automatically:
   - Changes application status to "Approved"
   - Creates an Assignment with status="Active"
   - Auto-rejects all other pending applications from this student

5. Student can view their assignment
   ```
   GET /assignments/my-assignment
   ```

6. When project is complete, supervisor marks assignment as done
   ```
   POST /assignments/507f1f77bcf86cd799439013/complete
   ```

7. Assignment status changes to "Completed"
