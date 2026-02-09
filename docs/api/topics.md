# Topic Management API Documentation

## Overview

The Topic Management API provides endpoints for supervisors to manage FYP topics and for students to discover available topics. The API implements role-based access control and a state machine workflow for topic publishing.

## Base URL

```
/api/v1/topics
```

## Authentication

Protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Response Format

All responses follow a standard format:

```json
{
  "data": {
    "topics": [...],
    "pagination": { ... }
  },
  "status": 200,
  "error": null,
  "code": null
}
```

Error responses include:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "status": 400
}
```

## Endpoints

### 1. List Topics (Public)

Browse and discover published topics with filtering and search capabilities.

**Request**

```
GET /api/v1/topics
```

**Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | string | Active | Filter by status (Active, Draft, Archived) |
| concentration | string | - | Filter by concentration area (Software Engineering, Systems, AI/ML, Cybersecurity, Other) |
| academicYear | number | - | Filter by academic year (1-6) |
| keyword | string | - | Filter by exact keyword match |
| search | string | - | Full-text search across title, description, keywords |
| sortBy | string | createdAt | Sort field (createdAt, title, etc.) |
| order | string | desc | Sort order (asc, desc) |
| page | number | 1 | Page number for pagination |
| limit | number | 20 | Results per page (max 100) |

**Response**

```json
{
  "data": {
    "topics": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "title": "Machine Learning Basics",
        "description": "Introduction to ML concepts and algorithms for beginners in AI and machine learning",
        "supervisor_id": {
          "_id": "507f1f77bcf86cd799439012",
          "fullName": "Dr. Smith",
          "email": "smith@university.edu"
        },
        "concentration": "AI/ML",
        "academicYear": 3,
        "keywords": ["machine-learning", "algorithms"],
        "status": "Active",
        "createdAt": "2026-02-07T10:00:00Z",
        "updatedAt": "2026-02-07T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 42,
      "pages": 3
    }
  },
  "status": 200
}
```

**Example Requests**

```bash
# List active topics by concentration
curl -X GET "http://localhost:5000/api/v1/topics?concentration=AI%2FML&status=Active"

# Full-text search
curl -X GET "http://localhost:5000/api/v1/topics?search=machine%20learning"

# Filter by year and pagination
curl -X GET "http://localhost:5000/api/v1/topics?academicYear=4&page=2&limit=10"

# Combine filters
curl -X GET "http://localhost:5000/api/v1/topics?concentration=Systems&academicYear=3&order=asc"
```

**Status Codes**

- `200 OK` - Success
- `400 Bad Request` - Invalid query parameters

---

### 2. Get Topic Details

Retrieve full details of a specific topic.

**Request**

```
GET /api/v1/topics/:topicId
```

**Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| topicId | string | MongoDB ObjectId of the topic |

**Response**

```json
{
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Machine Learning Basics",
    "description": "Introduction to ML concepts and algorithms for beginners in artificial intelligence",
    "supervisor_id": {
      "_id": "507f1f77bcf86cd799439012",
      "fullName": "Dr. Smith",
      "email": "smith@university.edu",
      "phone": "+1-555-0123",
      "officeHours": "Mon 2-4pm, Wed 3-5pm"
    },
    "concentration": "AI/ML",
    "academicYear": 3,
    "keywords": ["machine-learning", "neural-networks"],
    "referenceDocuments": [
      {
        "name": "Deep Learning (Goodfellow, Bengio, Courville)",
        "url": "https://deeplearningbook.org"
      }
    ],
    "status": "Active",
    "applicationDeadline": "2026-03-15T23:59:59Z",
    "maxApplications": 5,
    "createdAt": "2026-02-07T10:00:00Z",
    "updatedAt": "2026-02-07T10:00:00Z"
  },
  "status": 200
}
```

**Status Codes**

- `200 OK` - Topic found
- `404 Not Found` - Topic not found

---

### 3. Create Topic

Create a new draft topic (supervisor-only).

**Request**

```
POST /api/v1/topics
Authorization: Bearer <supervisor_token>
Content-Type: application/json
```

**Request Body**

```json
{
  "title": "Advanced Machine Learning",
  "description": "Study of deep learning architectures, neural networks, and their applications in computer vision and natural language processing for modern AI systems",
  "concentration": "AI/ML",
  "academicYear": 4,
  "keywords": ["deep-learning", "neural-networks"],
  "referenceDocuments": [
    {
      "name": "Deep Learning Book",
      "url": "https://deeplearningbook.org"
    }
  ]
}
```

**Field Validation**

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| title | string | ✓ | 5-255 characters |
| description | string | ✓ | 50-5000 characters |
| concentration | string | ✓ | One of: Software Engineering, Systems, AI/ML, Cybersecurity, Other |
| academicYear | number | | 1-6 |
| keywords | array | | Maximum 10 keywords |
| referenceDocuments | array | | URL validation required |

**Response**

```json
{
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "title": "Advanced Machine Learning",
    "description": "Study of deep learning architectures, neural networks, and their applications",
    "supervisor_id": "507f1f77bcf86cd799439012",
    "concentration": "AI/ML",
    "academicYear": 4,
    "keywords": ["deep-learning", "neural-networks"],
    "status": "Draft",
    "createdAt": "2026-02-07T11:30:00Z",
    "updatedAt": "2026-02-07T11:30:00Z"
  },
  "status": 201
}
```

**Error Responses**

```json
{
  "error": "Only supervisors can create topics",
  "code": "FORBIDDEN",
  "status": 403
}
```

```json
{
  "error": "Title, description, and concentration required",
  "code": "INVALID_INPUT",
  "status": 400
}
```

**Status Codes**

- `201 Created` - Topic created successfully
- `400 Bad Request` - Validation error or missing required fields
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Non-supervisor user

---

### 4. Update Topic

Update a draft topic (owner-only, supervisor).

**Request**

```
PUT /api/v1/topics/:topicId
Authorization: Bearer <supervisor_token>
Content-Type: application/json
```

**Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| topicId | string | MongoDB ObjectId of the topic |

**Request Body**

```json
{
  "title": "Updated Title",
  "description": "This is the updated description with more than 50 characters for the topic",
  "keywords": ["updated", "keywords"]
}
```

**Notes**

- Only `Draft` status topics can be updated
- Can only update own topics
- Can update: title, description, concentration, academicYear, keywords, referenceDocuments

**Response**

```json
{
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "title": "Updated Title",
    "description": "This is the updated description with more than 50 characters for the topic",
    "status": "Draft",
    "updatedAt": "2026-02-07T12:00:00Z"
  },
  "status": 200
}
```

**Error Responses**

```json
{
  "error": "Can only edit draft topics",
  "code": "INVALID_STATE",
  "status": 400
}
```

**Status Codes**

- `200 OK` - Topic updated successfully
- `400 Bad Request` - Validation error or invalid state
- `403 Forbidden` - Not topic owner
- `404 Not Found` - Topic not found

---

### 5. Publish Topic

Transition topic from Draft to Active (owner-only, supervisor).

**Request**

```
POST /api/v1/topics/:topicId/publish
Authorization: Bearer <supervisor_token>
```

**Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| topicId | string | MongoDB ObjectId of the topic |

**Request Body** (Optional)

```json
{
  "applicationDeadline": "2026-03-15T23:59:59Z"
}
```

**Notes**

- Only `Draft` status topics can be published
- Can only publish own topics
- Once published, topic becomes visible to students
- ActivityLog entry created

**Response**

```json
{
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "title": "Advanced Machine Learning",
    "status": "Active",
    "applicationDeadline": "2026-03-15T23:59:59Z",
    "updatedAt": "2026-02-07T12:05:00Z"
  },
  "status": 200
}
```

**Error Responses**

```json
{
  "error": "Can only publish draft topics",
  "code": "INVALID_STATE",
  "status": 400
}
```

**Status Codes**

- `200 OK` - Topic published successfully
- `400 Bad Request` - Invalid state (not Draft)
- `403 Forbidden` - Not topic owner
- `404 Not Found` - Topic not found

---

### 6. Archive Topic

Transition topic to Archived status (owner-only, supervisor).

**Request**

```
POST /api/v1/topics/:topicId/archive
Authorization: Bearer <supervisor_token>
```

**Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| topicId | string | MongoDB ObjectId of the topic |

**Notes**

- Any status topic can be archived
- Can only archive own topics
- Archived topics hidden from student browse
- Sets `archivedAt` timestamp
- ActivityLog entry created

**Response**

```json
{
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "title": "Advanced Machine Learning",
    "status": "Archived",
    "archivedAt": "2026-02-07T12:10:00Z",
    "updatedAt": "2026-02-07T12:10:00Z"
  },
  "status": 200
}
```

**Status Codes**

- `200 OK` - Topic archived successfully
- `403 Forbidden` - Not topic owner
- `404 Not Found` - Topic not found

---

### 7. Delete Topic

Permanently remove a topic (admin-only).

**Request**

```
DELETE /api/v1/topics/:topicId
Authorization: Bearer <admin_token>
```

**Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| topicId | string | MongoDB ObjectId of the topic |

**Notes**

- Admin-only operation
- Permanently removes topic from database
- ActivityLog entry created
- Cannot be undone

**Response**

```json
{
  "data": {
    "message": "Topic deleted successfully"
  },
  "status": 200
}
```

**Status Codes**

- `200 OK` - Topic deleted successfully
- `403 Forbidden` - Not admin user
- `404 Not Found` - Topic not found

---

### 8. Get My Topics

List supervisor's own topics with optional status filtering.

**Request**

```
GET /api/v1/topics/my-topics/list
Authorization: Bearer <supervisor_token>
```

**Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | string | - | Filter by status (Draft, Active, Archived) |

**Response**

```json
{
  "data": {
    "topics": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "title": "Advanced Machine Learning",
        "description": "Study of deep learning architectures and neural networks",
        "concentration": "AI/ML",
        "status": "Active",
        "createdAt": "2026-02-07T10:00:00Z"
      },
      {
        "_id": "507f1f77bcf86cd799439015",
        "title": "Distributed Systems",
        "description": "Design principles for building scalable distributed systems",
        "concentration": "Systems",
        "status": "Draft",
        "createdAt": "2026-02-06T14:30:00Z"
      }
    ],
    "count": 2
  },
  "status": 200
}
```

**Status Codes**

- `200 OK` - Success
- `403 Forbidden` - Non-supervisor user

---

## Topic Workflow State Machine

Topics follow a strict workflow:

```
         +--------+
         | Draft  |
         +--------+
              |
              | publish()
              ↓
         +--------+
         | Active |
         +--------+
              |
              | archive()
              ↓
         +---------+
         | Archived|
         +---------+
```

**State Transitions**

- **Draft → Active**: `POST /api/v1/topics/:id/publish`
  - Only supervisors can publish own topics
  - Topic becomes visible to students
  
- **Any → Archived**: `POST /api/v1/topics/:id/archive`
  - Only supervisors can archive own topics
  - Topic hidden from student browse
  - Cannot be un-archived (design decision)
  - Sets `archivedAt` timestamp

**State Rules**

- Only **Draft** topics can be edited
- Only **Draft** topics can be published
- Only supervisor who created topic can manage it
- Admin can delete any topic

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| VALIDATION_ERROR | 400 | Field validation failed |
| INVALID_INPUT | 400 | Required field missing |
| INVALID_STATE | 400 | Invalid workflow state transition |
| NOT_FOUND | 404 | Topic not found |
| FORBIDDEN | 403 | Insufficient permissions |
| UNAUTHORIZED | 401 | Missing or invalid authentication token |

---

## Pagination Examples

**Get page 2 with 10 results per page**

```bash
GET /api/v1/topics?page=2&limit=10
```

Response includes pagination metadata:

```json
{
  "data": {
    "topics": [...],
    "pagination": {
      "page": 2,
      "limit": 10,
      "total": 42,
      "pages": 5
    }
  }
}
```

---

## Search and Filtering Examples

**Search for "machine learning"**

```bash
GET /api/v1/topics?search=machine%20learning
```

**Filter by concentration and academic year**

```bash
GET /api/v1/topics?concentration=AI%2FML&academicYear=3
```

**Filter by concentration with sorting**

```bash
GET /api/v1/topics?concentration=Systems&sortBy=title&order=asc
```

**Search with pagination**

```bash
GET /api/v1/topics?search=neural&page=1&limit=20
```

---

## Activity Logging

All topic operations are logged to ActivityLog:

- `topic_created` - Topic created
- `topic_updated` - Topic updated
- `topic_published` - Topic published to Active
- `topic_archived` - Topic archived
- `topic_deleted` - Topic deleted

Access logs via:

```
GET /api/v1/activity?entityType=Topic&entityId=:topicId
```

---

## Rate Limiting

No rate limits applied in development environment.

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-07 | Initial release with CRUD, workflow, search, filtering |

