<template>
  <div class="assignment-status-widget">
    <div class="widget-header">
      <h3>{{ assignment.title }}</h3>
      <span :class="['status-badge', assignment.status.toLowerCase()]">
        {{ assignment.status }}
      </span>
    </div>
    <div class="widget-body">
      <p v-if="assignment.description" class="description">{{ assignment.description }}</p>
      <div class="due-date">
        <span class="label">Due Date:</span>
        <span class="date">{{ formatDate(assignment.dueDate) }}</span>
      </div>
      <div class="days-remaining" :class="daysClass">
        {{ daysUntil(assignment.dueDate) }} days remaining
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Assignment {
  _id: string
  title: string
  status: string
  dueDate: string
  description?: string
}

interface Props {
  assignment: Assignment
}

withDefaults(defineProps<Props>(), {})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const daysUntil = (date: string): number => {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

const daysClass = computed(() => {
  const days = daysUntil('')
  if (days < 0) return 'overdue'
  if (days < 3) return 'urgent'
  if (days < 7) return 'warning'
  return 'normal'
})
</script>

<style scoped>
.assignment-status-widget {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.widget-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.active {
  background-color: #dcfce7;
  color: #166534;
}

.status-badge.completed {
  background-color: #dbeafe;
  color: #0c4a6e;
}

.status-badge.pending {
  background-color: #fef3c7;
  color: #92400e;
}

.widget-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.description {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.due-date {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.due-date .label {
  color: #6b7280;
}

.due-date .date {
  font-weight: 500;
  color: #1f2937;
}

.days-remaining {
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.5rem;
  border-radius: 0.25rem;
  text-align: center;
}

.days-remaining.normal {
  background-color: #e0f2fe;
  color: #0369a1;
}

.days-remaining.warning {
  background-color: #fef3c7;
  color: #b45309;
}

.days-remaining.urgent {
  background-color: #fee2e2;
  color: #dc2626;
}

.days-remaining.overdue {
  background-color: #f87171;
  color: white;
}
</style>
