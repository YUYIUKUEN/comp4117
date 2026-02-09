# Admin Dashboard & System Management API Documentation

## Overview

The Admin Dashboard API provides endpoints for system monitoring, user management, topic moderation, and system health checking. All administrative endpoints require admin role credentials.

## Base URL

```
/api/v1
```

## Authentication

All endpoints except `/health/check` require authentication via JWT token:

```
Authorization: Bearer <your-jwt-token>
```

## Dashboard Statistics Endpoints

### 1. Get System-Wide Statistics

**GET** `/dashboards/system-stats`

Retrieve comprehensive system statistics including user counts, topic counts, applications, assignments, and submissions.

**Authentication:** Admin role required

**Request Example:**
```bash
curl -X GET "https://api.example.com/api/v1/dashboards/system-stats" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json"
```

**Success Response (200):**
```json
{
  "data": {
    "timestamp": "2026-02-07T14:30:00.000Z",
    "users": {
      "total": 150,
      "students": 100,
      "supervisors": 40,
      "admins": 10,
      "active": 145,
      "deactivated": 5
    },
    "topics": {
      "total": 45,
      "draft": 5,
      "active": 35,
      "archived": 5
    },
    "applications": {
      "total": 120,
      "pending": 30,
      "approved": 80,
      "rejected": 10
    },
    "assignments": {
      "active": 60,
      "completed": 40,
      "changed": 2
    },
    "submissions": {
      "total": 60,
      "submitted": 50,
      "notSubmitted": 8,
      "overdue": 2,
      "declared": 0
    }
  },
  "status": 200
}
```

**Error Response (403):**
```json
{
  "error": "Only admins can view system stats",
  "code": "FORBIDDEN",
  "status": 403
}
```

---

### 2. Get Concentration-Based Topic Statistics

**GET** `/dashboards/concentration-stats`

Get active topics grouped by concentration area.

**Authentication:** Admin role required

**Request Example:**
```bash
curl -X GET "https://api.example.com/api/v1/dashboards/concentration-stats" \
  -H "Authorization: Bearer <admin-token>"
```

**Success Response (200):**
```json
{
  "data": {
    "concentrations": [
      {
        "_id": "AI/ML",
        "topicCount": 12
      },
      {
        "_id": "Database",
        "topicCount": 8
      },
      {
        "_id": "Security",
        "topicCount": 5
      }
    ]
  },
  "status": 200
}
```

---

### 3. Get Application Statistics by Status

**GET** `/dashboards/application-stats`

Get application counts grouped by status (pending, approved, rejected).

**Authentication:** Admin role required

**Success Response (200):**
```json
{
  "data": {
    "total": 120,
    "pending": 30,
    "approved": 80,
    "rejected": 10
  },
  "status": 200
}
```

---

### 4. Get Submission Deadline Statistics

**GET** `/dashboards/submission-deadline-stats`

Get submission statistics including overdue and soon-to-be-due items.

**Authentication:** Admin role required

**Success Response (200):**
```json
{
  "data": {
    "total": 60,
    "submitted": 50,
    "pending": 8,
    "overdue": 2,
    "dueSoon": 3
  },
  "status": 200
}
```

The `dueSoon` field includes submissions due within 7 days.

---

## User Management Endpoints

### 1. Get All Users

**GET** `/admin/users`

List all users with filtering and pagination support.

**Authentication:** Admin role required

**Query Parameters:**
- `role` (optional): Filter by role (Student, Supervisor, Admin)
- `status` (optional): Filter by status (active, deactivated) - default: active
- `limit` (optional, default: 50): Items per page
- `page` (optional, default: 1): Page number

**Request Example:**
```bash
curl -X GET "https://api.example.com/api/v1/admin/users?role=Student&status=active&limit=50&page=1" \
  -H "Authorization: Bearer <admin-token>"
```

**Success Response (200):**
```json
{
  "data": {
    "users": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
        "email": "student@university.edu",
        "fullName": "John Student",
        "role": "Student",
        "deactivatedAt": null,
        "createdAt": "2026-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "pages": 2
    }
  },
  "status": 200
}
```

**Note:** Passwords (`passwordHash`) are never returned in responses.

---

### 2. Get User by ID

**GET** `/admin/users/:userId`

Retrieve details for a specific user.

**Authentication:** Admin role required

**Request Example:**
```bash
curl -X GET "https://api.example.com/api/v1/admin/users/65a1b2c3d4e5f6g7h8i9j0k1" \
  -H "Authorization: Bearer <admin-token>"
```

**Success Response (200):**
```json
{
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "email": "student@university.edu",
    "fullName": "John Student",
    "role": "Student",
    "deactivatedAt": null,
    "createdAt": "2026-01-15T10:00:00Z"
  },
  "status": 200
}
```

**Error Response (404):**
```json
{
  "error": "User not found",
  "code": "NOT_FOUND",
  "status": 404
}
```

---

### 3. Deactivate User

**POST** `/admin/users/:userId/deactivate`

Deactivate a user account. Cannot deactivate yourself.

**Authentication:** Admin role required

**Request Body:**
```json
{
  "reason": "Violates academic integrity policy"
}
```

**Request Example:**
```bash
curl -X POST "https://api.example.com/api/v1/admin/users/65a1b2c3d4e5f6g7h8i9j0k1/deactivate" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Violates academic integrity policy"}'
```

**Success Response (200):**
```json
{
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "email": "student@university.edu",
    "fullName": "John Student",
    "role": "Student",
    "deactivatedAt": "2026-02-07T14:30:00Z"
  },
  "status": 200
}
```

**Error Response (400 - Self-deactivation):**
```json
{
  "error": "Cannot deactivate yourself",
  "code": "INVALID_OPERATION",
  "status": 400
}
```

**Error Response (400 - Already deactivated):**
```json
{
  "error": "User is already deactivated",
  "code": "INVALID_OPERATION",
  "status": 400
}
```

---

### 4. Reactivate User

**POST** `/admin/users/:userId/reactivate`

Reactivate a deactivated user account.

**Authentication:** Admin role required

**Request Example:**
```bash
curl -X POST "https://api.example.com/api/v1/admin/users/65a1b2c3d4e5f6g7h8i9j0k1/reactivate" \
  -H "Authorization: Bearer <admin-token>"
```

**Success Response (200):**
```json
{
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "email": "student@university.edu",
    "fullName": "John Student",
    "role": "Student",
    "deactivatedAt": null
  },
  "status": 200
}
```

**Error Response (400 - Already active):**
```json
{
  "error": "User is already active",
  "code": "INVALID_OPERATION",
  "status": 400
}
```

---

## Topic Moderation Endpoints

### 1. Flag Topic

**POST** `/admin/topics/:topicId/flag`

Flag a topic for moderation review.

**Authentication:** Admin role required

**Request Body:**
```json
{
  "reason": "Inappropriate content"
}
```

**Request Example:**
```bash
curl -X POST "https://api.example.com/api/v1/admin/topics/65a1b2c3d4e5f6g7h8i9j0k1/flag" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Inappropriate content"}'
```

**Success Response (200):**
```json
{
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "title": "AI Research",
    "flags": [
      {
        "reason": "Inappropriate content",
        "flaggedBy": "65a1b2c3d4e5f6g7h8i9j0k2",
        "flaggedAt": "2026-02-07T14:30:00Z"
      }
    ]
  },
  "status": 200
}
```

---

### 2. Get Flagged Topics

**GET** `/admin/topics/flagged`

List all topics that have been flagged for moderation.

**Authentication:** Admin role required

**Query Parameters:**
- `limit` (optional, default: 50): Items per page
- `page` (optional, default: 1): Page number

**Success Response (200):**
```json
{
  "data": {
    "topics": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
        "title": "AI Research",
        "flags": [
          {
            "reason": "Inappropriate content",
            "flaggedAt": "2026-02-07T14:30:00Z"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 5,
      "pages": 1
    }
  },
  "status": 200
}
```

---

### 3. Clear Topic Flags

**POST** `/admin/topics/:topicId/clear-flags`

Clear all flags from a topic (mark as reviewed/resolved).

**Authentication:** Admin role required

**Request Body:**
```json
{
  "reason": "Content verified as appropriate"
}
```

**Success Response (200):**
```json
{
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "title": "AI Research",
    "flags": []
  },
  "status": 200
}
```

---

### 4. Archive Topic

**POST** `/admin/topics/:topicId/archive`

Archive a topic (remove from available selection).

**Authentication:** Admin role required

**Request Body:**
```json
{
  "reason": "Outdated topic"
}
```

**Success Response (200):**
```json
{
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "title": "AI Research",
    "status": "Archived"
  },
  "status": 200
}
```

---

## System Health Endpoints

### 1. Health Check (No Auth)

**GET** `/health/check`

Simple health check endpoint for load balancers and monitoring systems. No authentication required.

**Request Example:**
```bash
curl -X GET "https://api.example.com/api/v1/health/check"
```

**Success Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2026-02-07T14:30:00Z"
}
```

---

### 2. Detailed System Health

**GET** `/health`

Get detailed system health information including memory usage, database status, and uptime.

**Authentication:** Admin role required

**Request Example:**
```bash
curl -X GET "https://api.example.com/api/v1/health" \
  -H "Authorization: Bearer <admin-token>"
```

**Success Response (200):**
```json
{
  "data": {
    "timestamp": "2026-02-07T14:30:00Z",
    "status": "healthy",
    "database": {
      "connected": true,
      "readyState": 1,
      "message": "Database connection successful"
    },
    "memory": {
      "heapUsed": 45.23,
      "heapTotal": 102.4,
      "rss": 120.5,
      "external": 2.1
    },
    "uptime": 3600.5,
    "nodeVersion": "v18.16.0",
    "platform": "linux"
  },
  "status": 200
}
```

**Fields Explanation:**
- `memory.*`: Heap and RSS usage in MB
- `uptime`: Process uptime in seconds
- `readyState`: MongoDB connection state (1 = connected)

---

### 3. Database Statistics

**GET** `/health/database`

Get database-level statistics and performance metrics.

**Authentication:** Admin role required

**Success Response (200):**
```json
{
  "data": {
    "timestamp": "2026-02-07T14:30:00Z",
    "connections": {
      "current": 5,
      "available": 995
    },
    "memory": {
      "resident": 50,
      "virtual": 200
    },
    "operations": {
      "insert": 1000,
      "query": 5000,
      "update": 500,
      "delete": 100
    },
    "uptime": 86400
  },
  "status": 200
}
```

---

## Access Control Matrix

| Endpoint | Admin | Supervisor | Student | Public |
|----------|-------|-----------|---------|----|
| GET system-stats | ✓ | ✗ | ✗ | ✗ |
| GET concentration-stats | ✓ | ✗ | ✗ | ✗ |
| GET application-stats | ✓ | ✗ | ✗ | ✗ |
| GET submission-deadline-stats | ✓ | ✗ | ✗ | ✗ |
| GET /admin/users | ✓ | ✗ | ✗ | ✗ |
| GET /admin/users/:id | ✓ | ✗ | ✗ | ✗ |
| POST /admin/users/:id/deactivate | ✓ | ✗ | ✗ | ✗ |
| POST /admin/users/:id/reactivate | ✓ | ✗ | ✗ | ✗ |
| POST /admin/topics/:id/flag | ✓ | ✗ | ✗ | ✗ |
| GET /admin/topics/flagged | ✓ | ✗ | ✗ | ✗ |
| POST /admin/topics/:id/clear-flags | ✓ | ✗ | ✗ | ✗ |
| POST /admin/topics/:id/archive | ✓ | ✗ | ✗ | ✗ |
| GET /health | ✓ | ✗ | ✗ | ✗ |
| GET /health/database | ✓ | ✗ | ✗ | ✗ |
| GET /health/check | ✓ | ✓ | ✓ | ✓ |

---

## Error Responses

All endpoints return standardized error responses:

### 401 Unauthorized
```json
{
  "error": "Missing or invalid authentication",
  "code": "UNAUTHORIZED",
  "status": 401
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions",
  "code": "FORBIDDEN",
  "status": 403
}
```

### 404 Not Found
```json
{
  "error": "Resource not found",
  "code": "NOT_FOUND",
  "status": 404
}
```

### 400 Bad Request
```json
{
  "error": "Invalid request data",
  "code": "INVALID_REQUEST",
  "status": 400
}
```

---

## Best Practices

1. **Rate Limiting**: Implement rate limits for dashboard endpoints to prevent abuse
2. **Caching**: Consider caching system statistics for 5-10 minutes to reduce database load
3. **Pagination**: Always use pagination for list endpoints; default is 50 items
4. **Filtering**: Use available filters to reduce response payload
5. **Auditing**: All admin actions are automatically logged to ActivityLog
6. **Security**: Never expose `passwordHash` or sensitive user data
7. **Monitoring**: Use `/health/check` for continuous health monitoring

---

## Rate Limits

- System statistics: 100 requests/minute
- User management: 200 requests/minute
- Topic moderation: 150 requests/minute
- Health checks: Unlimited (for monitoring)

---

## Webhooks (Future)

Admin actions can trigger webhooks for integration with external systems:
- `user.deactivated`
- `user.reactivated`
- `topic.flagged`
- `topic.archived`

---

**API Version**: 1.0  
**Last Updated**: February 7, 2026  
**Base URL**: `/api/v1`
