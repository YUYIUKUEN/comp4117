# Feedback API Documentation

## Overview

The Feedback & Comments Management API provides endpoints for supervisors to add feedback on student submissions and for students to view feedback from their supervisors. The system supports public and private feedback, rating systems (1-5), and comprehensive audit logging of all feedback operations.

## Base URL

```
/api/v1/feedback
```

## Authentication

All endpoints require authentication via JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

## Feedback Statuses

- **Public Feedback** (`isPrivate: false`): Visible to both students and supervisors
- **Private Feedback** (`isPrivate: true`): Visible only to supervisors
- **Rating** (optional, 1-5): Numerical rating for the submission quality

## Supervisor Endpoints

### 1. Add Feedback to Submission

**POST** `/submissions/:submissionId/feedback`

Create feedback for a student submission. Only supervisors assigned to the student can create feedback.

**Authentication:** Supervisor role required

**Parameters:**
- `submissionId` (path, required): ID of the submission
- `feedbackText` (body, required): Feedback content (10-5000 characters)
- `rating` (body, optional): Rating from 1-5
- `isPrivate` (body, optional, default: false): Whether feedback is private

**Request Example:**
```bash
curl -X POST /api/v1/feedback/submissions/65a1b2c3d4e5f6g7h8i9j0k1/feedback \
  -H "Authorization: Bearer <supervisor-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "feedbackText": "Excellent initial statement with clear methodology and realistic objectives for the project scope.",
    "rating": 5,
    "isPrivate": false
  }'
```

**Success Response (201):**
```json
{
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "submission_id": "65a1b2c3d4e5f6g7h8i9j0k2",
    "supervisor_id": "65a1b2c3d4e5f6g7h8i9j0k3",
    "feedbackText": "Excellent initial statement with clear methodology and realistic objectives for the project scope.",
    "rating": 5,
    "isPrivate": false,
    "createdAt": "2026-02-07T14:30:00Z",
    "updatedAt": "2026-02-07T14:30:00Z"
  },
  "status": 201
}
```

**Error Responses:**
- `400 FEEDBACK_TEXT_REQUIRED`: Feedback text is required or empty
- `400 INVALID_RATING`: Rating is outside 1-5 range
- `403 NOT_ASSIGNED`: Supervisor is not assigned to this student
- `404 SUBMISSION_NOT_FOUND`: Submission does not exist
- `401`: Unauthorized (no token or invalid token)
- `403`: Forbidden (not a supervisor)

---

### 2. Update Feedback

**PUT** `/:feedbackId`

Update existing feedback. Only the supervisor who created the feedback can update it.

**Authentication:** Supervisor role required

**Parameters:**
- `feedbackId` (path, required): ID of the feedback to update
- `feedbackText` (body, optional): Updated feedback content
- `rating` (body, optional): Updated rating (1-5)
- `isPrivate` (body, optional): Update privacy setting

**Request Example:**
```bash
curl -X PUT /api/v1/feedback/65a1b2c3d4e5f6g7h8i9j0k1 \
  -H "Authorization: Bearer <supervisor-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "feedbackText": "Excellent initial statement with clear methodology, realistic objectives, and detailed timeline.",
    "rating": 5,
    "isPrivate": false
  }'
```

**Success Response (200):**
```json
{
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "submission_id": "65a1b2c3d4e5f6g7h8i9j0k2",
    "supervisor_id": "65a1b2c3d4e5f6g7h8i9j0k3",
    "feedbackText": "Excellent initial statement with clear methodology, realistic objectives, and detailed timeline.",
    "rating": 5,
    "isPrivate": false,
    "createdAt": "2026-02-07T14:30:00Z",
    "updatedAt": "2026-02-07T15:45:00Z"
  },
  "status": 200
}
```

**Error Responses:**
- `400 FEEDBACK_TEXT_REQUIRED`: Feedback text cannot be empty when provided
- `400 INVALID_RATING`: Rating is outside 1-5 range
- `403 NOT_OWNER`: Only the feedback creator can update it
- `404 FEEDBACK_NOT_FOUND`: Feedback does not exist
- `401`: Unauthorized
- `403`: Forbidden (not a supervisor)

---

### 3. Delete Feedback

**DELETE** `/:feedbackId`

Remove feedback from a submission. Only the supervisor who created the feedback can delete it.

**Authentication:** Supervisor role required

**Parameters:**
- `feedbackId` (path, required): ID of the feedback to delete

**Request Example:**
```bash
curl -X DELETE /api/v1/feedback/65a1b2c3d4e5f6g7h8i9j0k1 \
  -H "Authorization: Bearer <supervisor-token>"
```

**Success Response (200):**
```json
{
  "data": {
    "message": "Feedback deleted"
  },
  "status": 200
}
```

**Error Responses:**
- `403 NOT_OWNER`: Only the feedback creator can delete it
- `404 FEEDBACK_NOT_FOUND`: Feedback does not exist
- `401`: Unauthorized
- `403`: Forbidden (not a supervisor)

---

## Shared Endpoints (Supervisor & Student)

### 4. Get Feedback for Submission

**GET** `/submissions/:submissionId/feedback`

Retrieve feedback for a submission. Students see only public feedback on their own submissions. Supervisors see all feedback on assignments they supervise.

**Authentication:** Required (Student or Supervisor)

**Behavior:**
- **Students**: Only see public feedback (`isPrivate: false`) on their own submissions
- **Supervisors**: See all feedback on submissions for students they are assigned to supervise

**Parameters:**
- `submissionId` (path, required): ID of the submission

**Request Example (Student):**
```bash
curl -X GET /api/v1/feedback/submissions/65a1b2c3d4e5f6g7h8i9j0k1/feedback \
  -H "Authorization: Bearer <student-token>"
```

**Request Example (Supervisor):**
```bash
curl -X GET /api/v1/feedback/submissions/65a1b2c3d4e5f6g7h8i9j0k1/feedback \
  -H "Authorization: Bearer <supervisor-token>"
```

**Success Response (200):**
```json
{
  "data": {
    "feedback": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
        "submission_id": "65a1b2c3d4e5f6g7h8i9j0k2",
        "supervisor_id": {
          "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
          "fullName": "Dr. Smith",
          "email": "smith@university.edu"
        },
        "feedbackText": "Excellent initial statement with clear methodology and realistic objectives.",
        "rating": 5,
        "isPrivate": false,
        "createdAt": "2026-02-07T14:30:00Z",
        "updatedAt": "2026-02-07T14:30:00Z"
      },
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
        "submission_id": "65a1b2c3d4e5f6g7h8i9j0k2",
        "supervisor_id": {
          "_id": "65a1b2c3d4e5f6g7h8i9j0k5",
          "fullName": "Dr. Jones",
          "email": "jones@university.edu"
        },
        "feedbackText": "Good proposal structure but needs more detail on implementation timeline.",
        "rating": 3,
        "isPrivate": false,
        "createdAt": "2026-02-07T16:00:00Z",
        "updatedAt": "2026-02-07T16:00:00Z"
      }
    ],
    "count": 2
  },
  "status": 200
}
```

**Error Responses:**
- `403 ACCESS_DENIED`: Student cannot view other students' submissions
- `403 NOT_ASSIGNED`: Supervisor is not assigned to this student
- `404 SUBMISSION_NOT_FOUND`: Submission does not exist
- `401`: Unauthorized

---

### 5. Get Feedback Statistics

**GET** `/submissions/:submissionId/stats`

Get aggregated statistics for feedback on a submission. Only includes public feedback for calculations. Both students and supervisors can request stats.

**Authentication:** Required (Student or Supervisor)

**Parameters:**
- `submissionId` (path, required): ID of the submission

**Request Example:**
```bash
curl -X GET /api/v1/feedback/submissions/65a1b2c3d4e5f6g7h8i9j0k1/stats \
  -H "Authorization: Bearer <token>"
```

**Success Response (200) - With Ratings:**
```json
{
  "data": {
    "count": 3,
    "avgRating": 4.33,
    "minRating": 3,
    "maxRating": 5
  },
  "status": 200
}
```

**Success Response (200) - No Feedback:**
```json
{
  "data": {
    "count": 0,
    "avgRating": null,
    "minRating": null,
    "maxRating": null
  },
  "status": 200
}
```

**Error Responses:**
- `404 SUBMISSION_NOT_FOUND`: Submission does not exist
- `401`: Unauthorized

---

## Common Status Codes

| Code | Meaning | Details |
|------|---------|---------|
| 200 | OK | Successful read operation |
| 201 | Created | Feedback created successfully |
| 400 | Bad Request | Invalid input or validation error |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | User lacks permission for operation |
| 404 | Not Found | Resource not found |
| 422 | Unprocessable Entity | Invalid data format |
| 500 | Server Error | Internal server error |

---

## Feedback Validation Rules

### feedbackText
- **Type**: String
- **Required**: Yes
- **Min Length**: 10 characters
- **Max Length**: 5000 characters
- **Validation**: Cannot be only whitespace

### rating
- **Type**: Number
- **Required**: No (optional)
- **Valid Range**: 1-5
- **Note**: If not provided, field will not be present in response

### isPrivate
- **Type**: Boolean
- **Required**: No
- **Default**: false
- **Note**: When true, only supervisors can view this feedback

---

## Activity Logging

All feedback operations are automatically logged to the ActivityLog for audit trails:

- **feedback_added**: When supervisor creates feedback
- **feedback_updated**: When supervisor updates feedback
- **feedback_deleted**: When supervisor deletes feedback

Example activity log entry:
```json
{
  "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
  "user_id": "65a1b2c3d4e5f6g7h8i9j0k3",
  "action": "feedback_added",
  "entityType": "Feedback",
  "entityId": "65a1b2c3d4e5f6g7h8i9j0k4",
  "details": {
    "submission_id": "65a1b2c3d4e5f6g7h8i9j0k2",
    "isPrivate": false,
    "hasRating": true
  },
  "createdAt": "2026-02-07T14:30:00Z"
}
```

---

## Authorization Matrix

| Operation | Student | Supervisor (Assigned) | Supervisor (Other) | Admin |
|-----------|---------|----------------------|-------------------|-------|
| Add Feedback | ❌ | ✅ | ❌ | ✅ |
| View Public Feedback (Own) | ✅ | - | - | ✅ |
| View Public Feedback (Other) | ❌ | ✅ | ❌ | ✅ |
| View Private Feedback | ❌ | ✅ | ❌ | ✅ |
| Update Feedback (Own) | ❌ | ✅ | ❌ | ✅ |
| Update Feedback (Other) | ❌ | ❌ | ❌ | ✅ |
| Delete Feedback (Own) | ❌ | ✅ | ❌ | ✅ |
| Delete Feedback (Other) | ❌ | ❌ | ❌ | ✅ |
| View Statistics | ✅ | ✅ | ⚠️ (If assigned) | ✅ |

---

## Examples by Use Case

### Scenario 1: Supervisor Provides Feedback on Student Submission

```bash
# 1. Supervisor creates public feedback with rating
curl -X POST /api/v1/feedback/submissions/submission-id/feedback \
  -H "Authorization: Bearer supervisor-token" \
  -d '{
    "feedbackText": "Good proposal. Consider adding more implementation details.",
    "rating": 4,
    "isPrivate": false
  }'

# 2. Student views feedback
curl -X GET /api/v1/feedback/submissions/submission-id/feedback \
  -H "Authorization: Bearer student-token"

# 3. Check statistics
curl -X GET /api/v1/feedback/submissions/submission-id/stats \
  -H "Authorization: Bearer student-token"
```

### Scenario 2: Supervisor Updates Previously Created Feedback

```bash
# 1. Update feedback after student responds to initial comments
curl -X PUT /api/v1/feedback/feedback-id \
  -H "Authorization: Bearer supervisor-token" \
  -d '{
    "feedbackText": "Better! Still needs more on timeline. Updated rating accordingly.",
    "rating": 5
  }'

# 2. Student sees updated feedback
curl -X GET /api/v1/feedback/submissions/submission-id/feedback \
  -H "Authorization: Bearer student-token"
```

### Scenario 3: Supervisor Uses Private Feedback for Notes

```bash
# 1. Create private supervisory note (not visible to student)
curl -X POST /api/v1/feedback/submissions/submission-id/feedback \
  -H "Authorization: Bearer supervisor-token" \
  -d '{
    "feedbackText": "Student has been struggling with timeline management. Consider offering extra support.",
    "isPrivate": true
  }'

# 2. Student does not see private feedback in their results
# But supervisor can view all feedback including private notes
```

---

## Migration Notes (from WP05)

The Feedback API is built on WP05 Submissions. Key integration points:

- **submission_id**: References a Submission from WP05
- **supervisor_id**: Links to User model
- **Activity Logging**: Uses ActivityLog model for audit trail
- **Authorization**: Verifies supervisor-student assignment via Assignment model

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-07 | Initial release with WP06 |

