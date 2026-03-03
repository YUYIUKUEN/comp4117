# Activity Log Formatter Documentation

## Overview

The Activity Formatter utility converts raw ActivityLog database entries into human-readable, natural language descriptions. It removes all JSON-like wrappers and presents activities in a clean, plain-text format suitable for user-facing activity feeds.

## Format Specification

### Output Format
```
{User Name} {action_verb} {context_item} on {context_location}
```

### Core Features
- **User Identification**: Full name of the user who performed the action
- **Action Verb**: Past-tense verb describing what was done (added, updated, deleted, approved, etc.)
- **Context**: Where and what the action was performed on
- **Natural Language**: No JSON wrappers, no curly braces, pure plain text
- **Dual Role Support**: Both supervisors and students can see their actions in both roles

## Examples

### Basic Actions
```
Dr. Samuel Lee added feedback on Feedback
Bob Chan submitted on Submission
Alice Johnson created on Topic
```

### Reply Actions
```
Dr. Samuel Lee replied to the feedback on Feedback
John Smith replied to the feedback on Progress report
```

### Approval Actions
```
Dr. Maria Garcia approved Topic Change Request
Prof. James Wilson rejected Topic Change Request
```

### Application Actions
```
Alice Johnson applied for on Application
Bob Chan withdrew application on Application
```

### Topic Management
```
Prof. Emily Chen created on Topic
Dr. David Martinez updated on Topic
```

### Status Changes
```
Dr. Rachel Zhang approved application on Application
Prof. Michael Brown rejected Topic Change Request
```

## Supported Actions

### Application Module
- `APPLY_TOPIC` → "applied for"
- `update_application_status` → "updated application"
- `application_withdrawn` → "withdrew application"
- `application_approved` → "approved application"
- `application_rejected` → "rejected application"

### Submission Module
- `document_submitted` → "submitted"
- `submission_updated` → "updated submission"
- `submission_deleted` → "deleted submission"

### Feedback Module
- `feedback_added` → "added feedback"
- `feedback_updated` → "updated feedback"
- `feedback_deleted` → "deleted feedback"
- `feedback_reply_added` → "replied to the feedback"
- `feedback_reply_updated` → "updated reply on feedback"
- `feedback_reply_deleted` → "deleted reply on feedback"

### Topic Change Request Module
- `topic_change_requested` → "requested change on"
- `topic_change_approved` → "approved change on"
- `topic_change_rejected` → "rejected change on"

### Topic Module
- `topic_created` → "created"
- `topic_updated` → "updated"
- `topic_deleted` → "deleted"
- `topic_approved` → "approved"
- `topic_rejected` → "rejected"

### Assignment/Task Module
- `assignment_created` → "created"
- `assignment_updated` → "updated"
- `assignment_submitted` → "submitted"

### User Management
- `user_created` → "created"
- `user_updated` → "updated"
- `user_deleted` → "deleted"
- `password_changed` → "changed password"

### Meeting Module
- `meeting_created` → "created"
- `meeting_updated` → "updated"
- `meeting_deleted` → "deleted"
- `meeting_approved` → "approved"
- `meeting_rejected` → "rejected"

### Authentication
- `login` → "logged in"
- `logout` → "logged out"
- `login_failed` → "failed login attempt"
- `password_reset` → "reset password"

## Entity Type Mappings

The formatter maps database entity types to user-friendly context names:

| Entity Type | Display Name |
|-------------|-------------|
| Application | Application |
| Submission | Submission |
| Feedback | Feedback |
| TopicChangeRequest | Topic Change Request |
| Topic | Topic |
| Assignment | Task |
| User | User |
| Meeting | Meeting |
| Comment | Comment thread |
| Approval | Approval |
| ProgressReport | Progress report |
| Document | Document |

## Implementation Details

### Key Components

#### `formatActivityDescription(activity: ActivityItem): string`
Main function that formats an activity entry into a readable string.

**Input Structure:**
```typescript
interface ActivityItem {
  _id: string
  user_id: {
    _id: string
    fullName: string
    email: string
    role: string
  }
  action: string
  entityType: string
  entityId?: string
  details?: Record<string, any>
  timestamp: string
}
```

**Output:** Plain text description of the activity

#### `formatActivityTimestamp(timestamp: string): string`
Formats timestamps into relative time displays.

**Examples:**
- `"just now"` - Less than 1 minute ago
- `"5m ago"` - 5 minutes ago
- `"2h ago"` - 2 hours ago
- `"3d ago"` - 3 days ago
- `"Jan 15"` - More than 7 days ago (date format)

## Special Rules

### Reply Actions
When `action` contains "reply" or "responded", the format becomes:
```
{User} replied to the {context_type} on {context_type}
```
Example: `"Dr. Samuel Lee replied to the feedback on Feedback"`

### Approval Actions
When `action` contains "approved" or "rejected", the format becomes:
```
{User} {verb} {context_type}
```
Example: `"Dr. Maria Garcia approved Topic Change Request"`

### Deletion Actions
For deletion actions, the format is:
```
{User} deleted {context_type}
```
Example: `"Alice Johnson deleted Feedback"`

### Default Format
For all other actions:
```
{User} {verb} on {context_type}
```
Example: `"Bob Chan submitted on Submission"`

## Usage in Components

### Vue Component Integration

```vue
<script setup lang="ts">
import { formatActivityDescription, formatActivityTimestamp } from '@/utils/activityFormatter'
import type { ActivityItem } from '@/services/activityService'

interface Props {
  activities?: ActivityItem[]
}

withDefaults(defineProps<Props>(), {
  activities: () => [],
})
</script>

<template>
  <div class="activity-list">
    <div v-for="activity in activities" :key="activity._id" class="activity-item">
      <p class="activity-text">{{ formatActivityDescription(activity) }}</p>
      <p class="activity-time">{{ formatActivityTimestamp(activity.timestamp) }}</p>
    </div>
  </div>
</template>
```

## Database Schema Reference

Activities are stored using this MongoDB schema:

```javascript
{
  user_id: ObjectId,           // Reference to User
  action: String,              // Action type (e.g., "feedback_added")
  entityType: String,          // Type of entity affected
  entityId: ObjectId,          // ID of affected entity
  details: Mixed,              // Additional details specific to action
  timestamp: Date,             // When action was performed
  ipAddress: String            // Optional: IP address of requester
}
```

## Customization

To extend the formatter with new actions:

1. Add action to `ACTION_VERB_MAP` in `activityFormatter.ts`
2. Add entity type to `ENTITY_TYPE_MAP` if new entity type
3. Add special case handling in `formatActivityDescription()` if special formatting needed

## Data Privacy

- User names displayed are full names from database
- IP addresses stored but not displayed in activity feed
- Activity history respects user role permissions:
  - Users see their own activities
  - Admins see all activities
  - Supervisors and students can optionally see matched partner's activities

## Performance Considerations

- Formatting is done on the client-side (Vue component)
- String transformations are minimal and have no performance impact
- Recommended to show last 50-100 activities per page
- Use pagination for large activity datasets

## Browser Compatibility

Works with all modern browsers supporting:
- ES6+ JavaScript
- Vue 3+
- TypeScript (optional, uses type hints)
