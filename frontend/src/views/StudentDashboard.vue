<template>
  <div class="student-dashboard">
    <div class="dashboard-header">
      <h1>Student Dashboard</h1>
      <p>Welcome, {{ userName }}</p>
    </div>

    <div class="quick-actions">
      <QuickActionsMenu :actions="studentActions" />
    </div>

    <div v-if="loading" class="loading">
      Loading dashboard...
    </div>

    <div v-else class="dashboard-grid">
      <!-- Assignment Status Section -->
      <section class="dashboard-section">
        <h2>Your Assignments</h2>
        <div v-if="activeAssignments.length === 0" class="empty-message">
          <p>No active assignments</p>
        </div>
        <div v-else class="assignments-list">
          <AssignmentStatusWidget
            v-for="assignment in activeAssignments"
            :key="assignment._id"
            :assignment="assignment"
          />
        </div>
      </section>

      <!-- Upcoming Deadlines -->
      <section class="dashboard-section">
        <h2>Upcoming Deadlines</h2>
        <UpcomingDeadlines :deadlines="upcomingDeadlines" />
      </section>

      <!-- Recent Activity -->
      <section class="dashboard-section">
        <h2>Recent Activity</h2>
        <div v-if="recentActivity.length === 0" class="empty-message">
          <p>No recent activity</p>
        </div>
        <div v-else class="activity-list">
          <div v-for="activity in recentActivity" :key="activity._id" class="activity-item">
            <span class="activity-time">{{ formatTime(activity.createdAt) }}</span>
            <span class="activity-text">{{ activity.description }}</span>
          </div>
        </div>
      </section>

      <!-- Submission Status Summary -->
      <section class="dashboard-section">
        <h2>Submission Status</h2>
        <div class="status-grid">
          <div class="status-item">
            <span class="status-label">Total Submissions</span>
            <span class="status-count">{{ submissionStats.total }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">Submitted</span>
            <span class="status-count success">{{ submissionStats.submitted }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">Pending</span>
            <span class="status-count warning">{{ submissionStats.pending }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">Overdue</span>
            <span class="status-count danger">{{ submissionStats.overdue }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AssignmentStatusWidget from '../components/AssignmentStatusWidget.vue'
import UpcomingDeadlines from '../components/UpcomingDeadlines.vue'
import QuickActionsMenu from '../components/QuickActionsMenu.vue'

interface Assignment {
  _id: string
  title: string
  status: string
  dueDate: string
  description?: string
}

interface Deadline {
  _id: string
  title: string
  dueDate: string
  type: string
}

interface Activity {
  _id: string
  description: string
  createdAt: string
}

interface SubmissionStats {
  total: number
  submitted: number
  pending: number
  overdue: number
}

const assignments = ref<Assignment[]>([])
const submissions = ref<any[]>([])
const activities = ref<Activity[]>([])
const loading = ref(true)

const userName = computed(() => 'Student')

const activeAssignments = computed(() =>
  assignments.value.filter(a => a.status === 'Active')
)

const upcomingDeadlines = computed(() => {
  const allDeadlines: Deadline[] = assignments.value
    .filter(a => a.status === 'Active')
    .map(a => ({
      _id: a._id,
      title: a.title,
      dueDate: a.dueDate,
      type: 'assignment',
    }))
  return allDeadlines.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
})

const recentActivity = computed(() => activities.value.slice(0, 5))

const submissionStats = computed(() => {
  const total = submissions.value.length
  const submitted = submissions.value.filter(s => s.status === 'submitted').length
  const pending = submissions.value.filter(s => s.status === 'pending').length
  const overdue = submissions.value.filter(s => s.status === 'overdue').length
  return { total, submitted, pending, overdue }
})

const studentActions = [
  { id: 'view-submissions', label: 'View Submissions', icon: 'clipboard-list' },
  { id: 'browse-topics', label: 'Browse Topics', icon: 'book-open' },
  { id: 'view-feedback', label: 'View Feedback', icon: 'message-square' },
]

const formatTime = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(async () => {
  try {
    loading.value = true
    // Simulate loading data
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Set mock data
    assignments.value = [
      {
        _id: '1',
        title: 'Assignment 1',
        status: 'Active',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Complete the task',
      },
    ]
    
    submissions.value = [
      { _id: '1', status: 'submitted', createdAt: new Date().toISOString() },
    ]
    
    activities.value = [
      { _id: '1', description: 'Assignment submitted', createdAt: new Date().toISOString() },
    ]
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.student-dashboard {
  padding: 2rem;
}

.dashboard-header {
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.quick-actions {
  margin-bottom: 2rem;
}

.dashboard-grid {
  display: grid;
  gap: 2rem;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.dashboard-section {
  background-color: #f5f5f5;
  padding: 1.5rem;
  border-radius: 0.5rem;
}

.dashboard-section h2 {
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.empty-message {
  text-align: center;
  color: #666;
  padding: 2rem;
}

.assignments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.activity-item {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 0.5rem;
  border-left: 3px solid #2563eb;
  padding-left: 1rem;
}

.activity-time {
  font-size: 0.875rem;
  color: #888;
  min-width: 150px;
}

.activity-text {
  flex: 1;
  color: #333;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background-color: white;
  border-radius: 0.25rem;
  border: 1px solid #ddd;
}

.status-label {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.status-count {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.status-count.success {
  color: #10b981;
}

.status-count.warning {
  color: #f59e0b;
}

.status-count.danger {
  color: #ef4444;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #666;
}
</style>
