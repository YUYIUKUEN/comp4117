<template>
  <div class="topic-management-widget">
    <div class="topic-header">
      <h3>{{ topic.title }}</h3>
      <span class="capacity">{{ topic.applications }}/{{ topic.capacity }}</span>
    </div>
    <p class="description">{{ topic.description }}</p>
    <div class="progress-bar">
      <div :style="{ width: `${(topic.applications / topic.capacity) * 100}%` }" class="progress-fill"></div>
    </div>
    <div class="actions">
      <button class="btn-secondary">Edit</button>
      <button class="btn-secondary">View Applications</button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Topic {
  _id: string
  title: string
  description: string
  capacity: number
  applications: number
}

interface Props {
  topic: Topic
}

withDefaults(defineProps<Props>(), {})
</script>

<style scoped>
.topic-management-widget {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
}

.topic-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.topic-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.capacity {
  font-size: 0.875rem;
  background-color: #e0f2fe;
  color: #0369a1;
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
}

.description {
  margin: 0.5rem 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #e5e7eb;
  border-radius: 4px;
  margin-bottom: 1rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #2563eb;
  transition: width 0.2s;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-secondary {
  flex: 1;
  padding: 0.5rem;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}
</style>
