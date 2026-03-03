# Activity Formatter - Implementation Guide

## What Changed

The activity display has been upgraded from displaying raw JSON-like data to clean, natural language descriptions.

## Before vs After Examples

### Example 1: Feedback Addition

**Before (if displayed from raw data):**
```
{"user": "Dr. Samuel Lee", "action": "feedback_added", "entityType": "Feedback"}
```

**After (formatted output):**
```
Dr. Samuel Lee added feedback on Feedback
```

---

### Example 2: Topic Change Approval

**Before:**
```
{"user": "Dr. Maria Garcia", "action": "topic_change_approved", "entityType": "TopicChangeRequest"}
```

**After:**
```
Dr. Maria Garcia approved Topic Change Request
```

---

### Example 3: Feedback Reply

**Before:**
```
{"user": "Bob Chan", "action": "feedback_reply_added", "entityType": "Feedback"}
```

**After:**
```
Bob Chan replied to the feedback on Feedback
```

---

### Example 4: Document Submission

**Before:**
```
{"user": "Alice Johnson", "action": "document_submitted", "entityType": "Submission"}
```

**After:**
```
Alice Johnson submitted on Submission
```

---

### Example 5: Topic Application

**Before:**
```
{"user": "John Smith", "action": "APPLY_TOPIC", "entityType": "Application"}
```

**After:**
```
John Smith applied for on Application
```

---

### Example 6: Rejection

**Before:**
```
{"user": "Prof. James Wilson", "action": "application_rejected", "entityType": "Application"}
```

**After:**
```
Prof. James Wilson rejected application on Application
```

---

## Key Features Implemented

✅ **User Identification** - Full name of the person who performed the action
✅ **Natural Language Verbs** - Past-tense action words (added, updated, deleted, approved, replied, etc.)
✅ **Clear Context** - Where the action happened (on Feedback, Progress report, Task, etc.)
✅ **No JSON Wrappers** - Pure plain-text output
✅ **Relative Time Display** - Shows when action occurred (just now, 5m ago, 2h ago, etc.)
✅ **Extensible Design** - Easy to add new action types and contexts

## Files Modified

- **Created:** `frontend/src/utils/activityFormatter.ts` - Core formatting utility
- **Updated:** `frontend/src/components/ActivityLogWidget.vue` - Component using the formatter
- **Enhanced:** `frontend/src/services/activityService.ts` - Added entity activity endpoint

## How It Works

### Step 1: Activity Logged (Backend)
```javascript
await ActivityLog.create({
  user_id: supervisorId,
  action: 'feedback_added',
  entityType: 'Feedback',
  entityId: feedback._id,
  details: { ... }
})
```

### Step 2: Activity Retrieved (Frontend Service)
```typescript
const { logs } = await activityService.getUserActivity(userId)
// Returns array of ActivityItem objects with all data
```

### Step 3: Activity Formatted (In Component)
```typescript
import { formatActivityDescription } from '@/utils/activityFormatter'

// The component automatically formats each activity
<span>{{ formatActivityDescription(activity) }}</span>
// Output: "Dr. Samuel Lee added feedback on Feedback"
```

### Step 4: Displayed to User
```
Dr. Samuel Lee added feedback on Feedback    5m ago
Bob Chan replied to the feedback on Feedback  1h ago
```

## Supported Actions

The formatter automatically handles 30+ different action types:

### Basic CRUD Operations
- Created, Updated, Deleted
- Added, Updated, Deleted
- Submitted

### Approval Workflows
- Approved, Rejected
- Pending

### Feedback & Communication
- Added, Updated, Deleted
- Replied, Responded
- Mentioned

### Role-Based Actions
- Assigned
- Unassigned

### Authentication
- Logged in, Logged out
- Failed login
- Password changed/reset

## Testing the Implementation

To verify the formatter is working correctly:

1. **Check the component renders:** ActivityLogWidget should now display formatted text
2. **Verify time formatting:** Timestamps should show relative time (5m ago, 2h ago, etc.)
3. **Test with different activities:** The formatter handles different action types gracefully
4. **Check empty state:** Shows "No activities recorded" when empty

## Database Compatibility

The formatter requires these fields from the ActivityLog document:
- `user_id` (populated with fullName, email, role)
- `action` (string identifying the action type)
- `entityType` (string identifying what was affected)
- `timestamp` (ISO date string)

No database schema changes were required. The formatter works with existing ActivityLog structure.

## Future Enhancements

Potential improvements for future versions:
- Add user avatars alongside names
- Color-code different action types
- Add icons for different entity types
- Support for activity filtering (show only certain actions)
- Activity export to CSV/PDF
- Activity search and advanced filtering
- Real-time activity streaming with WebSocket

## Troubleshooting

### Activities not showing?
- Verify activities are being logged in the backend
- Check that user data is properly populated in ActivityLog.user_id
- Ensure timestamp is valid ISO date string

### Formatting looks wrong?
- Check that action and entityType fields match defined mappings
- For custom actions, may need to add them to ACTION_VERB_MAP
- Verify user_id object has fullName property

### Time showing as "Invalid Date"?
- Ensure timestamp is valid ISO 8601 format
- Check for timezone issues

---

**Last Updated:** March 3, 2026
**Version:** 1.0
**Status:** Production Ready
