<template>
  <div class="supervisor-dashboard">
    <div class="dashboard-header">
      <h1>Supervisor Dashboard</h1>
      <p>Welcome, {{ userName }}</p>
    </div>

    <div class="quick-actions">
      <QuickActionsMenu :actions="supervisorActions" />
    </div>

    <div v-if="loading" class="loading">
      Loading dashboard...
    </div>

    <div v-else class="dashboard-grid">
      <!-- Topic Management Section -->
      <section class="dashboard-section">
        <h2>Your Topics</h2>
        <div v-if="topics.length === 0" class="empty-message">
          <p>No topics created yet</p>
        </div>
        <div v-else class="topics-list">
          <TopicManagementWidget v-for="topic in topics" :key="topic._id" :topic="topic" />
        </div>
      </section>

      <!-- Applications Section -->
      <section class="dashboard-section">
        <h2>Applications</h2>
        <ApplicationsWidget :applications="applications" />
      </section>

      <!-- Feedback Tracking Section -->
      <section class="dashboard-section">
        <h2>Feedback Tracking</h2>
        <FeedbackTrackingWidget :feedbacks="feedbacks" />
      </section>

      <!-- Activity Log Section -->
      <section class="dashboard-section">
        <h2>Recent Activity</h2>
        <ActivityLogWidget :activities="recentActivities" />
      </section>

      <!-- Statistics Section -->
      <section class="dashboard-section">
        <h2>Statistics</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">Total Topics</span>
            <span class="stat-value">{{ stats.totalTopics }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Pending Applications</span>
            <span class="stat-value">{{ stats.pendingApplications }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Active Students</span>
            <span class="stat-value">{{ stats.activeStudents }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import QuickActionsMenu from '../components/QuickActionsMenu.vue'
import TopicManagementWidget from '../components/TopicManagementWidget.vue'
import ApplicationsWidget from '../components/ApplicationsWidget.vue'
import FeedbackTrackingWidget from '../components/FeedbackTrackingWidget.vue'
import ActivityLogWidget from '../components/ActivityLogWidget.vue'

interface Topic {
  _id: string
  title: string
  description: string
  capacity: number
  applications: number
}

interface Application {
  _id: string
  studentName: string
  topicTitle: string
  status: string
  submittedDate: string
}

interface Feedback {
  _id: string
  studentName: string
  content: string
  status: string
  createdAt: string
}

interface Activity {
  _id: string
  description: string
  createdAt: string
}

interface Stats {
  totalTopics: number
  pendingApplications: number
  activeStudents: number
}

const topics = ref<Topic[]>([])
const applications = ref<Application[]>([])
const feedbacks = ref<Feedback[]>([])
const recentActivities = ref<Activity[]>([])
const loading = ref(true)

const userName = computed(() => 'Supervisor')

const stats = computed<Stats>(() => ({
  totalTopics: topics.value.length,
  pendingApplications: applications.value.filter(a => a.status === 'pending').length,
  activeStudents: new Set(applications.value.map(a => a.studentName)).size,
}))

const supervisorActions = [
  { id: 'create-topic', label: 'Create Topic', icon: 'plus' },
  { id: 'manage-applications', label: 'Manage Applications', icon: 'check' },
  { id: 'provide-feedback', label: 'Provide Feedback', icon: 'message-square' },
]

onMounted(async () => {
  try {
    loading.value = true
    await new Promise(resolve => setTimeout(resolve, 500))

    topics.value = [
      {
        _id: '1',
        title: 'Machine Learning Basics',
        description: 'Learn ML fundamentals',
        capacity: 5,
        applications: 3,
      },
    ]

    applications.value = [
      {
        _id: '1',
        studentName: 'John Doe',
        topicTitle: 'Machine Learning Basics',
        status: 'pending',
        submittedDate: new Date().toISOString(),
      },
    ]

    feedbacks.value = [
      {
        _id: '1',
        studentName: 'John Doe',
        content: 'Good progress on milestone 1',
        status: 'submitted',
        createdAt: new Date().toISOString(),
      },
    ]

    recentActivities.value = [
      {
        _id: '1',
        description: 'New application received',
        createdAt: new Date().toISOString(),
      },
    ]
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.supervisor-dashboard {
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

.topics-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background-color: white;
  border-radius: 0.25rem;
  border: 1px solid #ddd;
}

.stat-label {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}
</style>
