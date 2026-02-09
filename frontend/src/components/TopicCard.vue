<template>
  <div class="topic-card">
    <div class="card-header">
      <div>
        <h3>{{ topic.title }}</h3>
        <p class="supervisor">{{ topic.supervisorName }}</p>
      </div>
      <span :class="['status-badge', `status-${topic.status.toLowerCase()}`]">
        {{ topic.status }}
      </span>
    </div>

    <p class="description">{{ truncateText(topic.description, 150) }}</p>

    <div class="metadata">
      <span class="meta-item">{{ topic.concentration }}</span>
      <span v-if="topic.maxStudents" class="meta-item">
        {{ topic.currentApplications || 0 }}/{{ topic.maxStudents }} students
      </span>
    </div>

    <div class="keywords">
      <span v-for="keyword in topic.keywords.slice(0, 3)" :key="keyword" class="keyword">
        {{ keyword }}
      </span>
      <span v-if="topic.keywords.length > 3" class="keyword more">
        +{{ topic.keywords.length - 3 }} more
      </span>
    </div>

    <div class="actions">
      <button
        v-if="canApply"
        @click="handleApply"
        class="btn btn-primary"
        :disabled="applying"
      >
        {{ applying ? 'Applying...' : 'Apply' }}
      </button>
      <router-link :to="`/topic/${topic._id}`" class="btn btn-secondary">
        View Details
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import topicService from '@/services/topicService'

interface Topic {
  _id: string
  title: string
  description: string
  concentration: string
  keywords: string[]
  supervisorName: string
  status: string
  maxStudents?: number
  currentApplications?: number
}

const props = defineProps<{
  topic: Topic
}>()

const emit = defineEmits<{
  applied: [topicId: string]
  error: [message: string]
}>()

const authStore = useAuthStore()
const applying = ref(false)

const canApply = computed(() => {
  return authStore.userRole === 'Student' && props.topic.status === 'Active'
})

const truncateText = (text: string, length: number) => {
  return text.length > length ? text.substring(0, length) + '...' : text
}

const handleApply = async () => {
  applying.value = true
  try {
    await topicService.applyForTopic(props.topic._id)
    emit('applied', props.topic._id)
  } catch (error: any) {
    emit('error', error.response?.data?.error || 'Failed to apply for topic')
  } finally {
    applying.value = false
  }
}
</script>

<style scoped>
.topic-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.topic-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #667eea;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.card-header h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
  color: #333;
}

.supervisor {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
}

.status-badge {
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  white-space: nowrap;
  flex-shrink: 0;
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

.description {
  color: #666;
  margin: 0 0 1rem 0;
  line-height: 1.5;
  font-size: 0.95rem;
}

.metadata {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  flex-wrap: wrap;
}

.meta-item {
  color: #666;
}

.keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.keyword {
  background: #f0f0f0;
  color: #333;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.8rem;
}

.keyword.more {
  background: transparent;
  color: #667eea;
  padding: 0.25rem 0;
}

.actions {
  display: flex;
  gap: 0.75rem;
}

.btn {
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  text-align: center;
  transition: all 0.2s;
  flex: 1;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5568d3;
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
</style>
