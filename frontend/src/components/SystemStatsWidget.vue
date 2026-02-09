<template>
  <div class="system-stats-widget">
    <div class="stats-container">
      <div class="stat-card">
        <div class="stat-icon users">👥</div>
        <div class="stat-info">
          <span class="stat-label">Total Users</span>
          <span class="stat-value">{{ stats.totalUsers }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon topics">📚</div>
        <div class="stat-info">
          <span class="stat-label">Total Topics</span>
          <span class="stat-value">{{ stats.totalTopics }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon submissions">📝</div>
        <div class="stat-info">
          <span class="stat-label">Total Submissions</span>
          <span class="stat-value">{{ stats.totalSubmissions }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon active">✓</div>
        <div class="stat-info">
          <span class="stat-label">Active Users</span>
          <span class="stat-value">{{ stats.activeUsers }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface SystemStats {
  totalUsers: number
  totalTopics: number
  totalSubmissions: number
  activeUsers: number
}

interface Props {
  stats: SystemStats
}

withDefaults(defineProps<Props>(), {})
</script>

<style scoped>
.system-stats-widget {
  display: flex;
  flex-direction: column;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  display: flex;
  gap: 1rem;
  align-items: center;
  background-color: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  transition: box-shadow 0.2s;
}

.stat-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 2rem;
  min-width: 50px;
  text-align: center;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
}
</style>
