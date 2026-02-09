<template>
  <div class="admin-dashboard">
    <div class="dashboard-header">
      <h1>Admin Dashboard</h1>
      <p>System Overview</p>
    </div>

    <div class="quick-actions">
      <QuickActionsMenu :actions="adminActions" />
    </div>

    <div v-if="loading" class="loading">
      Loading dashboard...
    </div>

    <div v-else class="dashboard-grid">
      <!-- System Statistics Section -->
      <section class="dashboard-section full-width">
        <h2>System Statistics</h2>
        <SystemStatsWidget :stats="systemStats" />
      </section>

      <!-- User Management Section -->
      <section class="dashboard-section">
        <h2>User Management</h2>
        <UserManagementWidget :users="users" />
      </section>

      <!-- Activity Log Section -->
      <section class="dashboard-section">
        <h2>System Activity</h2>
        <ActivityLogWidget :activities="activities" />
      </section>

      <!-- Topic Management Section -->
      <section class="dashboard-section">
        <h2>Topic Moderation</h2>
        <TopicManagementWidget v-for="topic in topics" :key="topic._id" :topic="topic" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import QuickActionsMenu from '../components/QuickActionsMenu.vue'
import SystemStatsWidget from '../components/SystemStatsWidget.vue'
import UserManagementWidget from '../components/UserManagementWidget.vue'
import ActivityLogWidget from '../components/ActivityLogWidget.vue'
import TopicManagementWidget from '../components/TopicManagementWidget.vue'

interface SystemStats {
  totalUsers: number
  totalTopics: number
  totalSubmissions: number
  activeUsers: number
}

interface User {
  _id: string
  name: string
  email: string
  role: string
  createdAt: string
  status: string
}

interface Activity {
  _id: string
  description: string
  createdAt: string
}

interface Topic {
  _id: string
  title: string
  description: string
  capacity: number
  applications: number
}

const users = ref<User[]>([])
const activities = ref<Activity[]>([])
const topics = ref<Topic[]>([])
const loading = ref(true)

const systemStats = computed<SystemStats>(() => ({
  totalUsers: users.value.length,
  totalTopics: topics.value.length,
  totalSubmissions: Math.floor(Math.random() * 100),
  activeUsers: users.value.filter(u => u.status === 'active').length,
}))

const adminActions = [
  { id: 'manage-users', label: 'Manage Users', icon: 'users' },
  { id: 'moderate-topics', label: 'Moderate Topics', icon: 'shield' },
  { id: 'view-reports', label: 'View Reports', icon: 'bar-chart' },
]

onMounted(async () => {
  try {
    loading.value = true
    await new Promise(resolve => setTimeout(resolve, 500))

    users.value = [
      {
        _id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'student',
        createdAt: new Date().toISOString(),
        status: 'active',
      },
      {
        _id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'supervisor',
        createdAt: new Date().toISOString(),
        status: 'active',
      },
    ]

    topics.value = [
      {
        _id: '1',
        title: 'Machine Learning',
        description: 'Learn ML fundamentals',
        capacity: 5,
        applications: 3,
      },
    ]

    activities.value = [
      {
        _id: '1',
        description: 'New user registered: John Doe',
        createdAt: new Date().toISOString(),
      },
      {
        _id: '2',
        description: 'Topic created: Machine Learning',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ]
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.admin-dashboard {
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

.dashboard-section.full-width {
  grid-column: 1 / -1;
}

.dashboard-section h2 {
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #666;
}
</style>
