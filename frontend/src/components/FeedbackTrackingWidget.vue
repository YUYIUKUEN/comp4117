<template>
  <div class="feedback-tracking-widget">
    <div v-if="feedbacks.length === 0" class="empty-state">
      <p>No feedback records</p>
    </div>
    <div v-else class="feedbacks-list">
      <div v-for="feedback in feedbacks" :key="feedback._id" class="feedback-item">
        <div class="feedback-header">
          <span class="student">{{ feedback.studentName }}</span>
          <span :class="['status', feedback.status]">{{ feedback.status }}</span>
        </div>
        <p class="feedback-content">{{ feedback.content }}</p>
        <span class="timestamp">{{ formatDate(feedback.createdAt) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Feedback {
  _id: string
  studentName: string
  content: string
  status: string
  createdAt: string
}

interface Props {
  feedbacks?: Feedback[]
}

withDefaults(defineProps<Props>(), {
  feedbacks: () => [],
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped>
.feedback-tracking-widget {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 1rem;
}

.feedbacks-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.feedback-item {
  background-color: white;
  border-left: 3px solid #2563eb;
  border-radius: 0.5rem;
  padding: 1rem;
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.student {
  font-weight: 600;
  font-size: 0.95rem;
}

.status {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  font-weight: 500;
}

.status.submitted {
  background-color: #dcfce7;
  color: #166534;
}

.status.draft {
  background-color: #f3e8ff;
  color: #6b21a8;
}

.feedback-content {
  margin: 0.5rem 0;
  font-size: 0.875rem;
  color: #4b5563;
  line-height: 1.4;
}

.timestamp {
  display: block;
  font-size: 0.75rem;
  color: #999;
  margin-top: 0.5rem;
}
</style>
