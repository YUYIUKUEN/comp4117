<template>
  <div class="create-topic-page">
    <div class="page-header">
      <button @click="goBack" class="btn-back">
        ← Back to Topics
      </button>
      <h1>{{ isEditing ? 'Edit Topic' : 'Create New Topic' }}</h1>
    </div>

    <div class="form-container">
      <form @submit.prevent="submitForm" class="topic-form">
        <div class="form-group">
          <label for="title">Title *</label>
          <input
            v-model="formData.title"
            type="text"
            id="title"
            placeholder="Enter topic title"
            required
          />
        </div>

        <div class="form-group">
          <label for="description">Description *</label>
          <textarea
            v-model="formData.description"
            id="description"
            placeholder="Detailed description of the topic"
            rows="6"
            required
          ></textarea>
        </div>

        <div class="form-group">
          <label for="concentration">Concentration *</label>
          <select v-model="formData.concentration" id="concentration" required>
            <option value="">Select concentration</option>
            <option value="Health and Social Wellness Concentration (HSW)">Health and Social Wellness Concentration (HSW)</option>
            <option value="Health Technology and Informatics Concentration (HTI)">Health Technology and Informatics Concentration (HTI)</option>
          </select>
        </div>

        <div class="form-group">
          <label for="keywords">Keywords (comma-separated) *</label>
          <input
            v-model="formData.keywords"
            type="text"
            id="keywords"
            placeholder="keyword1, keyword2, keyword3"
            required
          />
        </div>

        <div class="form-group">
          <label for="maxStudents">Max Students</label>
          <input
            v-model.number="formData.maxStudents"
            type="number"
            id="maxStudents"
            min="1"
            max="10"
          />
        </div>

        <div v-if="formError" class="form-error">
          {{ formError }}
        </div>

        <div class="form-actions">
          <button type="button" @click="goBack" class="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" :disabled="formLoading">
            {{ formLoading ? 'Saving...' : (isEditing ? 'Update Topic' : 'Create Topic') }}
          </button>
        </div>
      </form>
    </div>

    <!-- Success Toast -->
    <div v-if="successMessage" class="success-toast">
      {{ successMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import topicService from '@/services/topicService'

const router = useRouter()
const route = useRoute()

const topicId = computed(() => route.params.id as string | undefined)
const isEditing = computed(() => !!topicId.value)

const formData = reactive({
  title: '',
  description: '',
  concentration: '',
  keywords: '',
  maxStudents: 1
})

const formLoading = ref(false)
const formError = ref('')
const successMessage = ref('')

const goBack = () => {
  router.push('/supervisor/topics')
}

const loadTopic = async () => {
  if (!topicId.value) return

  formLoading.value = true
  try {
    const topic = await topicService.getTopicById(topicId.value)
    formData.title = topic.title
    formData.description = topic.description
    formData.concentration = topic.concentration
    formData.keywords = topic.keywords?.join(', ') || ''
    formData.maxStudents = topic.maxStudents || 1
  } catch (error: any) {
    formError.value = error.response?.data?.error || 'Failed to load topic'
  } finally {
    formLoading.value = false
  }
}

const submitForm = async () => {
  if (!formData.title || !formData.description) {
    formError.value = 'Title and description are required'
    return
  }

  formLoading.value = true
  formError.value = ''

  try {
    const keywords = formData.keywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0)

    const topicData = {
      title: formData.title,
      description: formData.description,
      concentration: formData.concentration,
      keywords,
      maxStudents: formData.maxStudents
    }

    if (isEditing.value && topicId.value) {
      await topicService.updateTopic(topicId.value, topicData)
      successMessage.value = 'Topic updated successfully!'
    } else {
      await topicService.createTopic(topicData)
      successMessage.value = 'Topic created successfully!'
    }

    setTimeout(() => {
      router.push('/supervisor/topics')
    }, 1500)
  } catch (error: any) {
    formError.value = error.response?.data?.error || 'Failed to save topic'
  } finally {
    formLoading.value = false
  }
}

onMounted(() => {
  if (isEditing.value) {
    loadTopic()
  }
})
</script>

<style scoped>
.create-topic-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.btn-back {
  background: none;
  border: none;
  color: #6366f1;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
  margin-bottom: 1rem;
  display: block;
}

.btn-back:hover {
  text-decoration: underline;
}

.page-header h1 {
  font-size: 2rem;
  color: #1f2937;
  margin: 0;
}

.form-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.topic-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #374151;
}

.form-group input,
.form-group textarea,
.form-group select {
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 120px;
}

.form-error {
  background: #fee2e2;
  color: #dc2626;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: #6366f1;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #4f46e5;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.success-toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: #10b981;
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
