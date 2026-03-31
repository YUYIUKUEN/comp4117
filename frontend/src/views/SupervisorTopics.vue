<template>
  <div class="supervisor-topics">
    <div class="topics-header">
      <h1>My Topics</h1>
      <button @click="navigateTo('/supervisor/topics/create')" class="btn btn-create">
        + Create New Topic
      </button>
    </div>

    <!-- Topics List -->
    <div v-if="supervisorTopics.loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading your topics...</p>
    </div>

    <div v-else-if="supervisorTopics.error" class="error-state">
      <p>{{ supervisorTopics.error }}</p>
      <button @click="loadTopics" class="btn-retry">Retry</button>
    </div>

    <div v-else-if="supervisorTopics.topics.length === 0" class="empty-state">
      <p>No topics yet. Create your first topic to get started.</p>
    </div>

    <div v-else class="topics-grid">
      <div v-for="topic in supervisorTopics.topics" :key="topic._id" class="topic-item">
        <div class="topic-status">
          <span :class="['status-badge', `status-${topic.status.toLowerCase()}`]">
            {{ topic.status }}
          </span>
        </div>

        <h3>{{ topic.title }}</h3>
        <p class="description">{{ truncateText(topic.description, 100) }}</p>

        <div class="metadata">
          <span class="meta">{{ topic.concentration }}</span>
          <span v-if="topic.pathway" class="meta pathway-badge">{{ topic.pathway }}</span>
          <span class="meta">{{ topic.keywords.length }} keywords</span>
        </div>

        <div class="topic-actions">
          <button
            v-if="topic.status === 'Draft'"
            @click="navigateTo(`/supervisor/topics/edit/${topic._id}`)"
            class="btn-action btn-edit"
          >
            Edit
          </button>
          <button
            v-if="topic.status === 'Draft'"
            @click="publishTopic(topic._id)"
            class="btn-action btn-publish"
          >
            Publish
          </button>
          <button
            v-if="topic.status === 'Active'"
            @click="archiveTopic(topic._id)"
            class="btn-action btn-archive"
          >
            Archive
          </button>
          <button
            @click="deleteTopic(topic._id)"
            class="btn-action btn-delete"
          >
            Delete
          </button>
          <router-link
            :to="`/topic/${topic._id}`"
            class="btn-action btn-view"
          >
            View
          </router-link>
        </div>
      </div>
    </div>

    <!-- Success Toast -->
    <div v-if="successMessage" class="success-toast">
      {{ successMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import topicService from '@/services/topicService'

const router = useRouter()

const navigateTo = (path: string) => {
  router.push(path)
}

interface Topic {
  _id: string
  title: string
  description: string
  concentration: string
  pathway?: string
  keywords: string[]
  supervisorName: string
  status: string
  maxStudents?: number
  currentApplications?: number
}

const supervisorTopics = reactive({
  topics: [] as Topic[],
  loading: false,
  error: null as string | null
})

const successMessage = ref('')

const truncateText = (text: string, length: number) => {
  return text.length > length ? text.substring(0, length) + '...' : text
}

const publishTopic = async (topicId: string) => {
  if (!confirm('Are you sure you want to publish this topic?')) return

  try {
    await topicService.publishTopic(topicId)
    successMessage.value = 'Topic published successfully!'
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
    await loadTopics()
  } catch (error: any) {
    supervisorTopics.error = error.response?.data?.error || 'Failed to publish topic'
  }
}

const deleteTopic = async (topicId: string) => {
  if (!confirm('Are you sure you want to delete this topic? This action cannot be undone.')) return

  try {
    await topicService.deleteTopic(topicId)
    successMessage.value = 'Topic deleted successfully!'
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
    await loadTopics()
  } catch (error: any) {
    supervisorTopics.error = error.response?.data?.error || 'Failed to delete topic'
  }
}

const archiveTopic = async (topicId: string) => {
  if (!confirm('Are you sure you want to archive this topic?')) return

  try {
    await topicService.archiveTopic(topicId)
    successMessage.value = 'Topic archived successfully!'
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
    await loadTopics()
  } catch (error: any) {
    supervisorTopics.error = error.response?.data?.error || 'Failed to archive topic'
  }
}

const loadTopics = async () => {
  supervisorTopics.loading = true
  supervisorTopics.error = null

  try {
    const response = await topicService.getSupervisorTopics()
    // API returns { data: { topics: [...], count: ... }, status: 200 }
    supervisorTopics.topics = (response as any).data?.topics || (response as any).topics || []
  } catch (error: any) {
    supervisorTopics.error = error.response?.data?.error || 'Failed to load topics'
  } finally {
    supervisorTopics.loading = false
  }
}

onMounted(() => {
  // Check if user is supervisor (disabled for demo)
  // if (authStore.userRole !== 'Supervisor') {
  //   supervisorTopics.error = 'Access denied. Supervisors only.'
  //   return
  // }
  loadTopics()
})
</script>

<style scoped>
.supervisor-topics {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 2rem;
}

.topics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.topics-header h1 {
  margin: 0;
  color: #333;
  font-size: 2rem;
}

.btn-create {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-create:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.modal-overlay {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background: rgba(0, 0, 0, 0.7) !important;
  z-index: 9998 !important;
}

.modal {
  background: white !important;
  border-radius: 12px !important;
  max-width: 600px !important;
  width: 90% !important;
  max-height: 90vh !important;
  overflow-y: auto !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3) !important;
  z-index: 9999 !important;
  position: relative !important;
  display: flex !important;
  flex-direction: column !important;
}

.modal-header {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  padding: 2rem !important;
  border-bottom: 1px solid #e0e0e0 !important;
  background: white !important;
}

.modal-header h2 {
  margin: 0 !important;
  color: #333 !important;
  font-size: 1.5rem !important;
}

.btn-close {
  background: none !important;
  border: none !important;
  font-size: 1.5rem !important;
  color: #999 !important;
  cursor: pointer !important;
  padding: 0 !important;
}

.btn-close:hover {
  color: #333 !important;
}

.form {
  padding: 2rem !important;
  background: white !important;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-family: inherit;
  font-size: 1rem;
}

.form-group textarea {
  resize: vertical;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-error {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 6px;
  color: #c33;
  font-size: 0.9rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.loading-state,
.error-state,
.empty-state {
  background: white;
  border-radius: 8px;
  padding: 3rem 2rem;
  text-align: center;
  border: 1px solid #e0e0e0;
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

.topics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.topic-item {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.topic-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #667eea;
}

.topic-status {
  margin-bottom: 1rem;
}

.status-badge {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-draft {
  background: #e2e3e5;
  color: #383d41;
}

.status-active {
  background: #d4edda;
  color: #155724;
}

.status-archived {
  background: #f8d7da;
  color: #721c24;
}

.topic-item h3 {
  margin: 0 0 0.75rem 0;
  color: #333;
  font-size: 1.1rem;
}

.description {
  color: #666;
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
  line-height: 1.5;
  flex: 1;
}

.metadata {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  font-size: 0.85rem;
}

.meta {
  color: #999;
}

.pathway-badge {
  display: inline-block;
  padding: 0.3rem 0.8rem;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.topic-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-action {
  flex: 1;
  min-width: 80px;
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  text-align: center;
}

.btn-edit {
  background: #e3f2fd;
  color: #1976d2;
}

.btn-edit:hover {
  background: #bbdefb;
}

.btn-publish {
  background: #e8f5e9;
  color: #388e3c;
}

.btn-publish:hover {
  background: #c8e6c9;
}

.btn-delete {
  background: #ffebee;
  color: #c62828;
}

.btn-delete:hover {
  background: #ffcdd2;
}

.btn-archive {
  background: #fff3e0;
  color: #f57c00;
}

.btn-archive:hover {
  background: #ffe0b2;
}

.btn-view {
  background: #f3e5f5;
  color: #7b1fa2;
  text-decoration: none;
}

.btn-view:hover {
  background: #e1bee7;
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
  .topics-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .modal {
    width: 95%;
  }

  .topics-grid {
    grid-template-columns: 1fr;
  }
}

.supervisor-nav-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
}

.nav-button {
  padding: 1rem;
  border-radius: 0.5rem;
  border: 2px solid #e2e8f0;
  background-color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  font-family: inherit;
}

.nav-button:hover {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.nav-button.active {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.nav-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.nav-button.active .nav-label {
  color: #1e40af;
}

.nav-desc {
  font-size: 0.75rem;
  color: #94a3b8;
}

.nav-button.active .nav-desc {
  color: #0369a1;
}
</style>
