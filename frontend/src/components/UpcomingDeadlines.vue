<template>
  <div class="upcoming-deadlines">
    <div v-if="deadlines.length === 0" class="empty-state">
      <p>No upcoming deadlines</p>
    </div>
    <div v-else class="deadlines-list">
      <div v-for="deadline in sortedDeadlines" :key="deadline._id" class="deadline-item">
        <div class="deadline-icon" :class="urgencyClass(deadline.dueDate)">
          <span class="type-badge">{{ deadline.type }}</span>
        </div>
        <div class="deadline-content">
          <h4 class="deadline-title">{{ deadline.title }}</h4>
          <p class="deadline-date">{{ formatDate(deadline.dueDate) }}</p>
          <p class="days-until">{{ daysUntil(deadline.dueDate) }} days</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Deadline {
  _id: string
  title: string
  dueDate: string
  type: string
}

interface Props {
  deadlines?: Deadline[]
}

const props = withDefaults(defineProps<Props>(), {
  deadlines: () => [],
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const daysUntil = (date: string): number => {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

const urgencyClass = (date: string): string => {
  const days = daysUntil(date)
  if (days < 0) return 'overdue'
  if (days < 3) return 'urgent'
  if (days < 7) return 'warning'
  return 'normal'
}

const sortedDeadlines = computed(() => {
  return [...props.deadlines].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
})
</script>

<style scoped>
.upcoming-deadlines {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 2rem 1rem;
  font-style: italic;
}

.deadlines-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.deadline-item {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
  border-left: 4px solid #2563eb;
}

.deadline-icon {
  min-width: 50px;
  height: 50px;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(37, 99, 235, 0.1);
}

.deadline-icon.urgent {
  background-color: rgba(239, 68, 68, 0.1);
  border: 2px solid #ef4444;
}

.deadline-icon.warning {
  background-color: rgba(245, 158, 11, 0.1);
  border: 2px solid #f59e0b;
}

.deadline-icon.overdue {
  background-color: rgba(239, 68, 68, 0.2);
  border: 2px solid #dc2626;
}

.type-badge {
  font-size: 0.75rem;
  font-weight: 600;
  color: #2563eb;
  text-transform: uppercase;
}

.deadline-content {
  flex: 1;
}

.deadline-title {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.deadline-date {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.days-until {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: #2563eb;
}
</style>
