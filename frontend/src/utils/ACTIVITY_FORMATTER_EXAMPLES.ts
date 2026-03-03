// Activity Formatter - Developer Reference Guide
// Location: frontend/src/utils/activityFormatter.ts

// ============================================================================
// QUICK START EXAMPLES
// ============================================================================

/**
 * Example 1: Basic usage in Vue component
 */
import { formatActivityDescription, formatActivityTimestamp } from '@/utils/activityFormatter'
import type { ActivityItem } from '@/services/activityService'
import activityService from '@/services/activityService'

export function DisplayActivity(activity: ActivityItem) {
  const description = formatActivityDescription(activity)
  const time = formatActivityTimestamp(activity.timestamp)
  
  return `${description} ${time}`
  // Output: "Dr. Samuel Lee added feedback on Feedback 5m ago"
}

/**
 * Example 2: Format activity for list display
 */
export async function getActivitiesForDisplay(userId: string) {
  const { logs } = await activityService.getUserActivity(userId, 10)
  
  return logs.map(activity => ({
    id: activity._id,
    description: formatActivityDescription(activity),
    time: formatActivityTimestamp(activity.timestamp),
    user: activity.user_id.fullName,
    action: activity.action,
    entity: activity.entityType,
  }))
}

/**
 * Example 3: Format activity for export/reporting
 */
export function formatActivityForExport(activity: ActivityItem): string {
  const description = formatActivityDescription(activity)
  const timestamp = new Date(activity.timestamp).toLocaleString()
  return `${timestamp} | ${description}`
  // Output: "3/3/2026, 2:30:45 PM | Dr. Samuel Lee added feedback on Feedback"
}

// ============================================================================
// INTEGRATION PATTERNS
// ============================================================================

/**
 * Pattern 1: Activity Feed Component
 */
// filename: src/components/ActivityFeed.vue
/*
<template>
  <div class="activity-feed">
    <div v-for="activity in activities" :key="activity._id" class="activity-item">
      <div class="activity-avatar">
        <img :src="getUserAvatar(activity.user_id._id)" />
      </div>
      <div class="activity-details">
        <p class="activity-description">
          {{ formatActivityDescription(activity) }}
        </p>
        <p class="activity-time">
          {{ formatActivityTimestamp(activity.timestamp) }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatActivityDescription, formatActivityTimestamp } from '@/utils/activityFormatter'
import type { ActivityItem } from '@/services/activityService'

interface Props {
  activities: ActivityItem[]
}

defineProps<Props>()

const getUserAvatar = (userId: string) => {
  // Implementation to get user avatar
  return `/api/users/${userId}/avatar`
}
</script>
*/

/**
 * Pattern 2: Activity Log in Dashboard
 */
// filename: src/pages/Dashboard.vue
/*
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { formatActivityDescription, formatActivityTimestamp } from '@/utils/activityFormatter'
import ActivityService, { type ActivityItem } from '@/services/activityService'

const activities = ref<ActivityItem[]>([])
const isLoading = ref(false)

onMounted(async () => {
  isLoading.value = true
  const { logs } = await ActivityService.getUserActivity(currentUserId, 20)
  activities.value = logs
  isLoading.value = false
})

const displayActivity = (activity: ActivityItem) => {
  return {
    text: formatActivityDescription(activity),
    time: formatActivityTimestamp(activity.timestamp),
  }
}
</script>

<template>
  <div class="activity-log">
    <h2>Recent Activity</h2>
    <div v-if="isLoading" class="loading">Loading activities...</div>
    <div v-else-if="activities.length === 0" class="empty">
      No activities yet
    </div>
    <div v-else class="activities">
      <div v-for="activity in activities" :key="activity._id" class="item">
        <p>{{ displayActivity(activity).text }}</p>
        <span class="time">{{ displayActivity(activity).time }}</span>
      </div>
    </div>
  </div>
</template>
*/

/**
 * Pattern 3: Activity Filter with Custom Formatting
 */
// filename: src/composables/useActivityLog.ts
/*
export function useActivityLog() {
  const formatActivity = (activity: ActivityItem, filter?: ActivityFilter) => {
    // Optional: filter by action type
    if (filter?.actionType && activity.action !== filter.actionType) {
      return null
    }
    
    // Optional: filter by entity type
    if (filter?.entityType && activity.entityType !== filter.entityType) {
      return null
    }
    
    return formatActivityDescription(activity)
  }
  
  return { formatActivity }
}
*/

/**
 * Pattern 4: Activity Timeline with Grouping
 */
// filename: src/components/ActivityTimeline.vue
/*
<script setup lang="ts">
import { computed } from 'vue'
import { formatActivityDescription, formatActivityTimestamp } from '@/utils/activityFormatter'
import type { ActivityItem } from '@/services/activityService'

interface Props {
  activities: ActivityItem[]
}

const props = defineProps<Props>()

// Group activities by date
const groupedActivities = computed(() => {
  const groups: Record<string, ActivityItem[]> = {}
  
  props.activities.forEach(activity => {
    const date = new Date(activity.timestamp)
    const dateKey = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(activity)
  })
  
  return groups
})
</script>

<template>
  <div class="timeline">
    <div v-for="(items, date) in groupedActivities" :key="date" class="date-group">
      <h3 class="date-header">{{ date }}</h3>
      <div class="activities">
        <div v-for="activity in items" :key="activity._id" class="activity">
          <p>{{ formatActivityDescription(activity) }}</p>
          <span>{{ formatActivityTimestamp(activity.timestamp) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
*/

// ============================================================================
// CUSTOM FORMATTING EXAMPLES
// ============================================================================

/**
 * Example: Custom formatter for specific entity types
 */
export function formatActivityForEntity(activity: ActivityItem, entityType: 'Feedback' | 'Submission' | 'Topic'): string {
  const baseDescription = formatActivityDescription(activity)
  
  switch (entityType) {
    case 'Feedback':
      return `Feedback: ${baseDescription}`
    case 'Submission':
      return `Submission: ${baseDescription}`
    case 'Topic':
      return `Topic: ${baseDescription}`
    default:
      return baseDescription
  }
}

/**
 * Example: Add emoji based on action
 */
export function formatActivityWithEmoji(activity: ActivityItem): string {
  const description = formatActivityDescription(activity)
  const emojiMap: Record<string, string> = {
    'added': '➕',
    'updated': '✏️',
    'deleted': '🗑️',
    'approved': '✅',
    'rejected': '❌',
    'replied': '💬',
    'submitted': '📤',
  }
  
  let emoji = ''
  for (const [key, value] of Object.entries(emojiMap)) {
    if (activity.action.includes(key)) {
      emoji = value
      break
    }
  }
  
  return emoji ? `${emoji} ${description}` : description
}

/**
 * Example: Format for notification
 */
export function formatActivityForNotification(activity: ActivityItem): {
  title: string
  body: string
  timestamp: string
} {
  const description = formatActivityDescription(activity)
  const userName = activity.user_id.fullName
  const [first, ...rest] = description.split(' ')
  
  return {
    title: `Activity from ${userName}`,
    body: description,
    timestamp: formatActivityTimestamp(activity.timestamp),
  }
}

/**
 * Example: Format for email notification
 */
export function formatActivityForEmail(activity: ActivityItem): string {
  const description = formatActivityDescription(activity)
  const timestamp = new Date(activity.timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  
  return `
<p>${description}</p>
<p style="color: #999; font-size: 0.875rem;">
  ${timestamp}
</p>
  `.trim()
}

// ============================================================================
// TESTING EXAMPLES
// ============================================================================

/**
 * Unit test examples
 */
/*
import { describe, it, expect } from 'vitest'
import { formatActivityDescription, formatActivityTimestamp } from '@/utils/activityFormatter'

describe('Activity Formatter', () => {
  it('should format feedback added action', () => {
    const activity = {
      _id: '123',
      user_id: {
        _id: '456',
        fullName: 'Dr. Samuel Lee',
        email: 'samuel@example.com',
        role: 'Supervisor',
      },
      action: 'feedback_added',
      entityType: 'Feedback',
      timestamp: new Date().toISOString(),
    }
    
    const result = formatActivityDescription(activity)
    expect(result).toBe('Dr. Samuel Lee added feedback on Feedback')
  })
  
  it('should format reply action', () => {
    const activity = {
      _id: '123',
      user_id: {
        _id: '456',
        fullName: 'Bob Chan',
        email: 'bob@example.com',
        role: 'Student',
      },
      action: 'feedback_reply_added',
      entityType: 'Feedback',
      timestamp: new Date().toISOString(),
    }
    
    const result = formatActivityDescription(activity)
    expect(result).toBe('Bob Chan replied to the feedback on Feedback')
  })
  
  it('should format timestamp correctly', () => {
    const now = new Date()
    const result = formatActivityTimestamp(now.toISOString())
    expect(result).toBe('just now')
  })
})
*/

// ============================================================================
// BEST PRACTICES
// ============================================================================

/*
1. Always import from '@/utils/activityFormatter' for consistency
2. Use type imports from '@/services/activityService' for ActivityItem
3. Handle edge cases:
   - Missing user data: fallback to "Unknown User"
   - Invalid timestamps: handle gracefully
   - Custom action types: extend ACTION_VERB_MAP as needed
4. Performance:
   - Format on client side (already optimized)
   - Cache formatted results if displaying same activities multiple times
5. Accessibility:
   - Ensure formatted text is descriptive enough for screen readers
   - Consider adding aria-labels with additional context
6. Internationalization (future):
   - Move verb mappings to i18n if multi-language support needed
*/

// ============================================================================
// ADDING NEW ACTION TYPES
// ============================================================================

/*
Step 1: Add to ACTION_VERB_MAP in activityFormatter.ts
ACTION_VERB_MAP: Record<string, string> = {
  'my_custom_action': 'performed custom action on',
}

Step 2: Test with sample activity
const activity = {
  _id: '123',
  user_id: { _id: '456', fullName: 'User Name', email: 'user@ex.com', role: 'Role' },
  action: 'my_custom_action',
  entityType: 'CustomEntity',
  timestamp: new Date().toISOString(),
}

Step 3: Verify output
console.log(formatActivityDescription(activity))
// Output: "User Name performed custom action on CustomEntity"

Step 4: Add special case handling if needed
In formatActivityDescription():
if (action === 'my_custom_action') {
  description = `${userName} did something special`
}
*/
