<template>
  <div class="topic-detail">
    <button @click="goBack" class="btn-back">← Back to Topics</button>

    <div v-if="topicStore.loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading topic details...</p>
    </div>

    <div v-else-if="topicStore.error" class="error-state">
      <p>{{ topicStore.error }}</p>
      <button @click="loadTopic" class="btn-retry">Retry</button>
    </div>

    <div v-else-if="topicStore.selectedTopic" class="detail-container">
      <div class="detail-header">
        <h1>{{ topicStore.selectedTopic.title }}</h1>
        <span :class="['status-badge', `status-${topicStore.selectedTopic.status.toLowerCase()}`]">
          {{ topicStore.selectedTopic.status }}
        </span>
      </div>

      <div class="detail-layout">
        <!-- Main Content -->
        <main class="detail-main">
          <section class="section">
            <h2>Description</h2>
            <p>{{ topicStore.selectedTopic.description }}</p>
          </section>

          <section class="section">
            <h2>Details</h2>
            <div class="details-grid">
              <div class="detail-item">
                <label>Concentration:</label>
                <span>{{ topicStore.selectedTopic.concentration }}</span>
              </div>
              <div class="detail-item">
                <label>Supervisor:</label>
                <span>{{ topicStore.selectedTopic.supervisorName }}</span>
              </div>
              <div v-if="topicStore.selectedTopic.maxStudents" class="detail-item">
                <label>Student Capacity:</label>
                <span>
                  {{ topicStore.selectedTopic.currentApplications || 0 }} /
                  {{ topicStore.selectedTopic.maxStudents }}
                </span>
              </div>
            </div>
          </section>

          <section v-if="topicStore.selectedTopic.keywords.length > 0" class="section">
            <h2>Keywords</h2>
            <div class="keywords-list">
              <span
                v-for="keyword in topicStore.selectedTopic.keywords"
                :key="keyword"
                class="keyword-tag"
              >
                {{ keyword }}
              </span>
            </div>
          </section>
        </main>

        <!-- Sidebar -->
        <aside class="detail-sidebar">
          <div class="action-card">
            <h3>Interested?</h3>
            <button
              v-if="canApply"
              @click="handleApply"
              :disabled="applying"
              class="btn btn-primary"
            >
              {{ applying ? 'Applying...' : 'Apply for this Topic' }}
            </button>
            <button v-else class="btn btn-disabled">
              Not Available
            </button>
            <p class="hint">
              {{ applying ? 'Processing your application...' : 'Click to apply for this topic' }}
            </p>
          </div>

          <div class="info-card">
            <h3>Supervisor Information</h3>
            <p class="supervisor-name">{{ topicStore.selectedTopic.supervisorName }}</p>
            <p class="info-text">For more information, contact the supervisor during office hours.</p>
          </div>

          <div v-if="topicStore.selectedTopic.maxStudents" class="info-card">
            <h3>Availability</h3>
            <div class="availability">
              <div class="avail-stat">
                <span class="avail-label">Spots Available:</span>
                <span class="avail-value">
                  {{ topicStore.selectedTopic.maxStudents - (topicStore.selectedTopic.currentApplications || 0) }}
                </span>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{
                    width: `${(((topicStore.selectedTopic.currentApplications || 0) / topicStore.selectedTopic.maxStudents) * 100)}%`
                  }"
                ></div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>

    <!-- Success Message -->
    <div v-if="successMessage" class="success-toast">
      {{ successMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useTopicStore } from '@/stores/topicStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const topicStore = useTopicStore()

const applying = ref(false)
const successMessage = ref('')

const canApply = computed(() => {
  return (
    authStore.userRole === 'Student' &&
    topicStore.selectedTopic?.status === 'Active'
  )
})

const loadTopic = async () => {
  const topicId = route.params.id as string
  await topicStore.fetchTopicById(topicId)
}

const handleApply = async () => {
  if (!topicStore.selectedTopic) return

  applying.value = true
  try {
    await topicStore.applyForTopic(topicStore.selectedTopic._id)
    successMessage.value = 'Successfully applied for this topic!'
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error) {
    // Error is already handled by store
  } finally {
    applying.value = false
  }
}

const goBack = () => {
  router.push('/topics')
}

onMounted(loadTopic)
</script>

<style scoped>
.topic-detail {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 2rem;
}

.btn-back {
  background: none;
  border: none;
  color: #667eea;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 2rem;
  font-size: 1rem;
  padding: 0;
}

.btn-back:hover {
  text-decoration: underline;
}

.loading-state,
.error-state {
  background: white;
  border-radius: 8px;
  padding: 3rem 2rem;
  text-align: center;
  border: 1px solid #e0e0e0;
  max-width: 800px;
  margin: 0 auto;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f0f0f0;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  background: #fee;
  border-color: #fcc;
  color: #c33;
}

.btn-retry {
  padding: 0.6rem 1.5rem;
  background: #c33;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  margin-top: 1rem;
}

.detail-container {
  max-width: 1200px;
  margin: 0 auto;
}

.detail-header {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 2rem;
}

.detail-header h1 {
  margin: 0;
  font-size: 2rem;
  color: #333;
  flex: 1;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  white-space: nowrap;
  margin-left: 1rem;
}

.status-active {
  background: #d4edda;
  color: #155724;
}

.status-draft {
  background: #e2e3e5;
  color: #383d41;
}

.status-archived {
  background: #f8d7da;
  color: #721c24;
}

.detail-layout {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 2rem;
}

.detail-main {
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  padding: 2rem;
}

.section {
  margin-bottom: 3rem;
}

.section:last-child {
  margin-bottom: 0;
}

.section h2 {
  font-size: 1.3rem;
  color: #333;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #667eea;
}

.section p {
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-item label {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.detail-item span {
  color: #666;
  font-size: 1rem;
}

.keywords-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.keyword-tag {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.detail-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.action-card,
.info-card {
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  padding: 1.5rem;
}

.action-card h3,
.info-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #333;
}

.btn {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-disabled {
  background: #ccc;
  color: #999;
  cursor: not-allowed;
}

.hint {
  margin: 0.75rem 0 0 0;
  font-size: 0.85rem;
  color: #999;
}

.supervisor-name {
  font-weight: 600;
  color: #667eea;
  margin: 0 0 0.5rem 0;
}

.info-text {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
  line-height: 1.5;
}

.availability {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.avail-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.avail-label {
  color: #666;
}

.avail-value {
  font-weight: 700;
  color: #667eea;
  font-size: 1.2rem;
}

.progress-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.success-toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: #d4edda;
  color: #155724;
  padding: 1rem 1.5rem;
  border-radius: 6px;
  border: 1px solid #c3e6cb;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .detail-header {
    flex-direction: column;
  }

  .status-badge {
    margin-left: 0;
    margin-top: 1rem;
  }

  .detail-layout {
    grid-template-columns: 1fr;
  }

  .detail-header h1 {
    font-size: 1.5rem;
  }
}
</style>
