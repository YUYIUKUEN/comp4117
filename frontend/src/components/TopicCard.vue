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
      <span v-if="topic.pathway" class="meta-item pathway-badge" :class="getPathwayClass()">
        {{ topic.pathway }}
      </span>
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
        v-if="userHasApprovedAssignment && authStore.userRole === 'Student'"
        disabled
        class="btn btn-primary disabled"
        title="You already have an approved topic assignment"
      >
        Already Assigned
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

interface Topic {
  _id: string
  title: string
  description: string
  concentration: string
  pathway?: 'Research-Based' | 'Solution-Based'
  keywords: string[]
  supervisorName: string
  status: string
  maxStudents?: number
  currentApplications?: number
}

const props = defineProps<{
  topic: Topic
  userHasApprovedAssignment?: boolean
}>()

const authStore = useAuthStore()

const truncateText = (text: string, length: number) => {
  return text.length > length ? text.substring(0, length) + '...' : text
}

const getPathwayClass = () => {
  if (!props.topic.pathway) return ''
  return props.topic.pathway === 'Research-Based' 
    ? 'pathway-researchbased' 
    : 'pathway-solutionbased'
}
</script>

<style scoped>
.topic-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  overflow: hidden;
  min-width: 0;
  max-width: 100%;
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

.pathway-badge {
  font-weight: 600 !important;
  font-size: 0.8rem !important;
  padding: 0.35rem 0.6rem !important;
  border-radius: 12px !important;
}

.pathway-researchbased {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #93c5fd;
}

.pathway-solutionbased {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #86efac;
}

.description {
  color: #666;
  margin: 0 0 1rem 0;
  line-height: 1.5;
  font-size: 0.95rem;
  overflow-wrap: anywhere;
  word-break: break-all;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
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

.btn-primary.disabled {
  background: #999;
  opacity: 0.7;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}
</style>
