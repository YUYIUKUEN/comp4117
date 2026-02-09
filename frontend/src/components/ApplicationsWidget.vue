<template>
  <div class="applications-widget">
    <div v-if="applications.length === 0" class="empty-state">
      <p>No applications</p>
    </div>
    <div v-else class="applications-list">
      <div v-for="app in applications" :key="app._id" class="application-item">
        <div class="app-header">
          <span class="student-name">{{ app.studentName }}</span>
          <span :class="['status-badge', app.status]">{{ app.status }}</span>
        </div>
        <div class="app-details">
          <span class="topic">{{ app.topicTitle }}</span>
          <span class="date">{{ formatDate(app.submittedDate) }}</span>
        </div>
        <div class="app-actions">
          <button class="btn-small approve">Approve</button>
          <button class="btn-small reject">Reject</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Application {
  _id: string
  studentName: string
  topicTitle: string
  status: string
  submittedDate: string
}

interface Props {
  applications?: Application[]
}

withDefaults(defineProps<Props>(), {
  applications: () => [],
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
</script>

<style scoped>
.applications-widget {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 1rem;
}

.applications-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.application-item {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.student-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.status-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  font-weight: 500;
}

.status-badge.pending {
  background-color: #fef3c7;
  color: #92400e;
}

.status-badge.approved {
  background-color: #dcfce7;
  color: #166534;
}

.status-badge.rejected {
  background-color: #fee2e2;
  color: #991b1b;
}

.app-details {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.75rem;
}

.app-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-small {
  flex: 1;
  padding: 0.4rem 0.75rem;
  font-size: 0.75rem;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-small.approve {
  background-color: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.btn-small.approve:hover {
  background-color: #bbf7d0;
}

.btn-small.reject {
  background-color: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.btn-small.reject:hover {
  background-color: #fecaca;
}
</style>
