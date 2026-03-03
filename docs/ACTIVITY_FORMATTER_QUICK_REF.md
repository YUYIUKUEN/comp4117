# Activity Formatter - Quick Reference Card

## One-Liner Description
Transforms raw activity log data into readable, natural language descriptions without JSON wrappers.

## Quick Examples

| Raw Data | Formatted Output |
|----------|-----------------|
| `{action: "feedback_added", user: "Dr. Samuel Lee"}` | **Dr. Samuel Lee added feedback on Feedback** |
| `{action: "feedback_reply_added", user: "Bob Chan"}` | **Bob Chan replied to the feedback on Feedback** |
| `{action: "topic_change_approved", user: "Dr. Garcia"}` | **Dr. Maria Garcia approved Topic Change Request** |
| `{action: "document_submitted", user: "Alice Johnson"}` | **Alice Johnson submitted on Submission** |
| `{action: "APPLY_TOPIC", user: "John Smith"}` | **John Smith applied for on Application** |

## What Gets Formatted

✅ **User Name** - Who did it (e.g., "Dr. Samuel Lee")
✅ **Action** - What they did (e.g., "added", "replied", "approved")  
✅ **Context** - Where it happened (e.g., "Feedback", "Topic", "Task")
✅ **Time** - When it happened (e.g., "5m ago", "2h ago")

## Supported Actions

**Add/Update/Delete:** added, updated, deleted
**Approval:** approved, rejected  
**Communication:** replied, mentioned, assigned
**Status:** submitted, created, withdrawn
**Special:** topic_change, feedback_reply, application_status

## Times Format

```
Just happened   → "just now"
Minutes ago     → "5m ago", "15m ago"
Hours ago       → "2h ago", "8h ago"
Days ago        → "3d ago", "6d ago"
Older           → "Jan 15", "Feb 28"
```

## File Locations

| File | Purpose |
|------|---------|
| `frontend/src/utils/activityFormatter.ts` | Core formatter functions |
| `frontend/src/components/ActivityLogWidget.vue` | Activity display component |
| `frontend/src/services/activityService.ts` | API service layer |
| `docs/activity-formatter-guide.md` | Full documentation |
| `docs/ACTIVITY_FORMATTER_IMPL.md` | Implementation details |
| `frontend/src/utils/ACTIVITY_FORMATTER_EXAMPLES.ts` | Code examples |

## How to Use

### In Vue Components
```vue
<script setup>
import { formatActivityDescription, formatActivityTimestamp } from '@/utils/activityFormatter'
</script>

<template>
  <p>{{ formatActivityDescription(activity) }}</p>
  <p>{{ formatActivityTimestamp(activity.timestamp) }}</p>
</template>
```

### In TypeScript
```typescript
import { formatActivityDescription } from '@/utils/activityFormatter'
import type { ActivityItem } from '@/services/activityService'

const formatted = formatActivityDescription(activity)
// Output: "Dr. Samuel Lee added feedback on Feedback"
```

## Activity Data Structure

The formatter expects this shape:
```typescript
{
  _id: string
  user_id: {
    fullName: string    // Required: User's full name
    email: string
    role: string
  }
  action: string        // Required: Action type (e.g., "feedback_added")
  entityType: string    // Required: Entity type (e.g., "Feedback")
  entityId?: string
  details?: object
  timestamp: string     // Required: ISO date string
}
```

## Common Scenarios

### Feedback Workflow
```
Dr. Samuel Lee added feedback on Feedback           (5m ago)
Bob Chan replied to the feedback on Feedback        (3m ago)
Professor Emily Chen updated feedback on Feedback   (1m ago)
```

### Topic Selection
```
Alice Johnson applied for on Application           (1h ago)
Dr. Michael Brown approved application on Application (45m ago)
```

### Topic Change Request
```
John Smith requested change on Topic Change Request   (2h ago)
Dr. Rachel Zhang approved change on Topic Change Request (1h ago)
```

### Submission Review
```
Alice Johnson submitted on Submission              (30m ago)
Dr. Samuel Lee added feedback on Feedback          (15m ago)
Bob Chan replied to the feedback on Feedback       (5m ago)
```

## Extending the Formatter

### Add New Action
1. Edit `activityFormatter.ts`
2. Add to `ACTION_VERB_MAP`:
   ```typescript
   'my_action': 'did something with'
   ```
3. Test with sample activity

### Add New Entity Type
1. Edit `ENTITY_TYPE_MAP` in `activityFormatter.ts`
2. Add mapping:
   ```typescript
   'MyEntity': 'My Entity Name'
   ```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Empty activity list | Check if activities are being logged in backend |
| "Unknown User" displayed | Ensure user_id is populated with fullName |
| Wrong time display | Verify timestamp is valid ISO 8601 format |
| Action not formatted | Add action to ACTION_VERB_MAP in formatter |

## Performance Notes

- Client-side formatting (no server calls)
- Zero external dependencies
- Minimal memory footprint
- Suitable for 50-100+ activities per page

## Browser Support

All modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Vue 3.0+

## Related Documentation

- **Full Guide:** See `docs/activity-formatter-guide.md`
- **Implementation:** See `docs/ACTIVITY_FORMATTER_IMPL.md`
- **Code Examples:** See `frontend/src/utils/ACTIVITY_FORMATTER_EXAMPLES.ts`
- **API Reference:** Check `frontend/src/services/activityService.ts`

## Key Design Principles

🎯 **Natural Language Only** - No JSON, no technical jargon
🎯 **User-Centric** - Shows who, what, where, and when clearly
🎯 **Extensible** - Easy to add new action types
🎯 **Performant** - Client-side, no API overhead
🎯 **Accessible** - Clear text for screen readers
🎯 **Consistent** - Uniform formatting across the app

---

**Last Updated:** March 3, 2026 | **Version:** 1.0 | **Status:** Production Ready
