<template>
  <div class="activity-log-widget">
    <div v-if="activities.length === 0" class="empty-state">
      <p>No activities recorded</p>
    </div>
    <div v-else class="activities-list">
      <div v-for="activity in activities" :key="activity._id" class="activity-entry">
        <div class="activity-dot"></div>
        <div class="activity-content">
          <span class="activity-text">{{ activity.description }}</span>
          <span class="activity-time">{{ formatTime(activity.createdAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Activity {
  _id: string
  description: string
  createdAt: string
}

interface Props {
  activities?: Activity[]
}

withDefaults(defineProps<Props>(), {
  activities: () => [],
})

const formatTime = (date: string) => {
  const now = new Date()
  const actDate = new Date(date)
  const diffMs = now.getTime() - actDate.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return actDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
</script>

<style scoped>
.activity-log-widget {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 1rem;
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
  padding-left: 1rem;
}

.activities-list::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #e5e7eb;
}

.activity-entry {
  display: flex;
  gap: 1rem;
  position: relative;
}

.activity-dot {
  width: 10px;
  height: 10px;
  background-color: #2563eb;
  border-radius: 50%;
  position: absolute;
  left: -16px;
  top: 3px;
  border: 2px solid white;
  box-shadow: 0 0 0 2px #e5e7eb;
}

.activity-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.activity-text {
  font-size: 0.875rem;
  color: #1f2937;
}

.activity-time {
  font-size: 0.75rem;
  color: #999;
}
</style>
