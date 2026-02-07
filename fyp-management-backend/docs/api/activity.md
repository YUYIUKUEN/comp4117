# Activity Logging & Audit Trail API Documentation

## Overview

The Activity Logging & Audit Trail API provides endpoints for tracking, querying, and reporting on all user actions in the FYP Management System. This system creates an immutable audit trail of events for compliance, debugging, and security purposes.

## Base URL

```
/api/v1/activity
```

## Authentication

All endpoints require authentication via JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

## Overview of Activity Logging

### Supported Activity Types

The system tracks the following activity types:

- **Authentication**: login, logout, password_changed, password_reset_requested
- **Topics**: topic_created, topic_updated, topic_published, topic_archived, topic_deleted
- **Applications**: application_submitted, application_withdrawn, application_approved, application_rejected
- **Submissions**: submission_created, document_submitted, document_downloaded, submission_declared_not_needed
- **Feedback**: feedback_added, feedback_updated, feedback_deleted
- **Assignments**: assignment_created, assignment_completed

### Log Entry Structure

Each activity log contains:
- `_id`: Unique identifier
- `user_id`: Reference to the user performing the action (with fullName, email, role)
- `action`: Type of action performed (string)
- `entityType`: Type of entity affected (string - Topic, Submission, Feedback, etc.)
- `entityId`: ID of the affected entity
- `details`: Additional contextual information (object)
- `ipAddress`: IP address of request (optional)
- `timestamp`: When the action occurred (immutable)
- `createdAt`: When the log was created (immutable)

---

## Admin Endpoints

### 1. Get All Activity Logs

**GET** `/`

Retrieve system-wide activity logs with filtering and pagination support. **Admin only**.

**Authentication:** Admin role required

**Query Parameters:**
- `action` (optional): Filter by action type (e.g., "login", "topic_created")
- `entityType` (optional): Filter by entity type (e.g., "Topic", "Submission")
- `userId` (optional): Filter by user ID
- `startDate` (optional): Filter logs after this date (ISO format)
- `endDate` (optional): Filter logs before this date (ISO format)
- `limit` (optional, default: 100): Max results per page
- `page` (optional, default: 1): Page number for pagination

**Request Example:**
```bash
curl -X GET "/api/v1/activity?action=login&limit=50&page=1" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json"
```

**Success Response (200):**
```json
{
  "data": {
    "logs": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
        "user_id": {
          "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
          "fullName": "John Student",
          "email": "john@university.edu",
          "role": "Student"
        },
        "action": "login",
        "entityType": "User",
        "entityId": "65a1b2c3d4e5f6g7h8i9j0k2",
        "details": {
          "loginMethod": "email",
          "ipRegion": "USA"
        },
        "ipAddress": "192.168.1.100",
        "timestamp": "2026-02-07T14:30:00Z",
        "createdAt": "2026-02-07T14:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 245,
      "pages": 5
    }
  },
  "status": 200
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Not an admin user
- `500`: Server error

---

### 2. Get Activity Statistics

**GET** `/stats`

Get aggregated activity statistics for a specified time period. **Admin only**.

**Authentication:** Admin role required

**Query Parameters:**
- `days` (optional, default: 7): Number of days to analyze

**Request Example:**
```bash
curl -X GET "/api/v1/activity/stats?days=30" \
  -H "Authorization: Bearer <admin-token>"
```

**Success Response (200):**
```json
{
  "data": {
    "period": "Last 30 days",
    "totalLogs": 1250,
    "actionStats": [
      {
        "_id": "login",
        "count": 450
      },
      {
        "_id": "topic_created",
        "count": 120
      },
      {
        "_id": "submission_created",
        "count": 95
      }
    ],
    "topUsers": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
        "count": 156,
        "user": [
          {
            "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
            "fullName": "John Student",
            "email": "john@university.edu",
            "role": "Student"
          }
        ]
      }
    ]
  },
  "status": 200
}
```

---

### 3. Export Activity Logs

**GET** `/export`

Export activity logs in JSON or CSV format. **Admin only**.

**Authentication:** Admin role required

**Query Parameters:**
- `format` (optional, default: "json"): Export format - "json" or "csv"
- `startDate` (optional): Start of date range (ISO format)
- `endDate` (optional): End of date range (ISO format)

**Request Example:**
```bash
# Export as JSON
curl -X GET "/api/v1/activity/export?format=json" \
  -H "Authorization: Bearer <admin-token>" \
  -o activity-logs.json

# Export as CSV
curl -X GET "/api/v1/activity/export?format=csv&startDate=2026-01-01&endDate=2026-02-07" \
  -H "Authorization: Bearer <admin-token>" \
  -o activity-logs.csv
```

**Success Response (200):**

**JSON Format:**
```json
{
  "exportedAt": "2026-02-07T15:45:00Z",
  "count": 245,
  "logs": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "user_id": {
        "fullName": "John Student",
        "email": "john@university.edu",
        "role": "Student"
      },
      "action": "login",
      "entityType": "User",
      "entityId": "65a1b2c3d4e5f6g7h8i9j0k2",
      "timestamp": "2026-02-07T14:30:00Z"
    }
  ]
}
```

**CSV Format:**
```
"timestamp","user","email","role","action","entityType","entityId","ipAddress"
"2026-02-07T14:30:00Z","John Student","john@university.edu","Student","login","User","65a1b2c3d4e5f6g7h8i9j0k2","192.168.1.100"
```

**Headers:**
- `Content-Type`: application/json or text/csv
- `Content-Disposition`: attachment; filename="activity-log.json" or "activity-log.csv"

---

## User Activity Endpoints

### 4. Get User Activity Log

**GET** `/user/:userId`

Retrieve activity log for a specific user. Users can view their own logs; admins can view any user's logs.

**Authentication:** Required (User or Admin)

**Parameters:**
- `userId` (path, required): ID of the user

**Query Parameters:**
- `limit` (optional, default: 50): Max results per page
- `page` (optional, default: 1): Page number

**Request Example:**
```bash
curl -X GET "/api/v1/activity/user/65a1b2c3d4e5f6g7h8i9j0k2?limit=25&page=1" \
  -H "Authorization: Bearer <user-token>"
```

**Success Response (200):**
```json
{
  "data": {
    "logs": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
        "user_id": {
          "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
          "fullName": "John Student",
          "email": "john@university.edu",
          "role": "Student"
        },
        "action": "login",
        "entityType": "User",
        "entityId": "65a1b2c3d4e5f6g7h8i9j0k2",
        "timestamp": "2026-02-07T14:30:00Z"
      },
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
        "user_id": {
          "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
          "fullName": "John Student",
          "email": "john@university.edu",
          "role": "Student"
        },
        "action": "topic_viewed",
        "entityType": "Topic",
        "entityId": "65a1b2c3d4e5f6g7h8i9j0k4",
        "timestamp": "2026-02-07T14:35:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 25,
      "total": 48,
      "pages": 2
    }
  },
  "status": 200
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Cannot view other users activity
- `404 Not Found`: User not found

---

## Entity Activity Endpoints

### 5. Get Entity Activity Log

**GET** `/:entityType/:entityId`

Retrieve all activity logs for a specific entity (e.g., a topic, submission, or feedback item). This creates a complete audit trail of all actions performed on that entity.

**Authentication:** Required

**Parameters:**
- `entityType` (path, required): Type of entity (Topic, Submission, Feedback, etc.)
- `entityId` (path, required): ID of the entity

**Query Parameters:**
- `limit` (optional, default: 50): Max results per page
- `page` (optional, default: 1): Page number

**Request Example:**
```bash
curl -X GET "/api/v1/activity/Topic/65a1b2c3d4e5f6g7h8i9j0k4?limit=10&page=1" \
  -H "Authorization: Bearer <user-token>"
```

**Success Response (200):**
```json
{
  "data": {
    "logs": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
        "user_id": {
          "_id": "65a1b2c3d4e5f6g7h8i9j0k5",
          "fullName": "Dr. Smith",
          "email": "smith@university.edu",
          "role": "Supervisor"
        },
        "action": "topic_created",
        "entityType": "Topic",
        "entityId": "65a1b2c3d4e5f6g7h8i9j0k4",
        "details": {
          "concentration": "AI/ML",
          "supervisorName": "Dr. Smith"
        },
        "timestamp": "2026-02-01T10:00:00Z"
      },
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
        "user_id": {
          "_id": "65a1b2c3d4e5f6g7h8i9j0k5",
          "fullName": "Dr. Smith",
          "email": "smith@university.edu",
          "role": "Supervisor"
        },
        "action": "topic_published",
        "entityType": "Topic",
        "entityId": "65a1b2c3d4e5f6g7h8i9j0k4",
        "timestamp": "2026-02-02T09:15:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    }
  },
  "status": 200
}
```

---

## Use Cases

### Use Case 1: Tracking User Actions for Security

Track all login attempts and account changes to detect suspicious activity:

```bash
curl -X GET "/api/v1/activity?entityType=User&action=login&userId=65a1b2c3d4e5f6g7h8i9j0k2&limit=100" \
  -H "Authorization: Bearer <admin-token>"
```

### Use Case 2: Audit Trail for Topic Submission Process

Get complete history of a topic from creation to publication:

```bash
curl -X GET "/api/v1/activity/Topic/65a1b2c3d4e5f6g7h8i9j0k4" \
  -H "Authorization: Bearer <admin-token>"
```

### Use Case 3: Compliance Report Generation

Export all system activity for a specific date range as CSV for compliance audit:

```bash
curl -X GET "/api/v1/activity/export?format=csv&startDate=2026-01-01&endDate=2026-01-31" \
  -H "Authorization: Bearer <admin-token>" \
  -o january-activity-log.csv
```

### Use Case 4: System Performance Analysis

Get statistics on which activities are most common to identify system usage patterns:

```bash
curl -X GET "/api/v1/activity/stats?days=90" \
  -H "Authorization: Bearer <admin-token>"
```

### Use Case 5: Personal Activity Review

Allow a user to review their own actions in the system:

```bash
curl -X GET "/api/v1/activity/user/65a1b2c3d4e5f6g7h8i9j0k2" \
  -H "Authorization: Bearer <user-token>"
```

---

## Error Codes

| Status Code | Code | Meaning |
|--|--|--|
| 200 | - | Success |
| 400 | BAD_REQUEST | Invalid parameters |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | FORBIDDEN | User does not have permission (e.g., not admin) |
| 404 | NOT_FOUND | Resource not found |
| 500 | INTERNAL_ERROR | Server error |

---

## Access Control Matrix

| Endpoint | Student | Supervisor | Admin |
|--|--|--|--|
| GET / (all logs) | ❌ | ❌ | ✅ |
| GET /stats | ❌ | ❌ | ✅ |
| GET /export | ❌ | ❌ | ✅ |
| GET /user/:userId (own) | ✅ | ✅ | ✅ |
| GET /user/:userId (other) | ❌ | ❌ | ✅ |
| GET /:entityType/:entityId | ✅ | ✅ | ✅ |

---

## Immutability & Compliance

The activity logging system is designed to be immutable and compliance-ready:

- **Timestamps are immutable**: Log creation timestamps cannot be modified
- **Append-only**: Logs can only be added, never modified or deleted
- **Complete audit trail**: All user actions create corresponding log entries
- **IP tracking**: Original IP address is captured with each action
- **User attribution**: All actions are linked to the authenticated user
- **Detailed context**: Actions include entity type, entity ID, and custom details

---

## Performance Considerations

- Activity logs are indexed on timestamp, user_id, action, and entityType
- Pagination is implemented for efficient querying of large datasets
- Batch logging available for bulk operations
- Consider archival/retention policies for logs older than 1-2 years
- CSV/JSON export available for external analysis and long-term storage

---

## Related Endpoints

- **Authentication API**: `/api/v1/auth` - Login/logout tracked automatically
- **Topic Management API**: `/api/v1/topics` - All topic operations logged
- **Submission Management API**: `/api/v1/submissions` - All submissions logged
- **Feedback API**: `/api/v1/feedback` - All feedback operations logged
