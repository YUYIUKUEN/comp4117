<template>
  <div class="topic-discovery">
    <div class="discovery-header">
      <h1>Discover Topics</h1>
      <p>Browse and apply for Final Year Project topics</p>
    </div>

    <div class="discovery-layout">
      <!-- Sidebar Filters -->
      <aside class="filters-sidebar">
        <div class="filter-section">
          <h3>Search Topics</h3>
          <input
            v-model="searchInput"
            type="text"
            placeholder="Search by title or keywords..."
            class="search-input"
            @input="handleSearch"
          />
        </div>

        <div class="filter-section">
          <h3>Concentration</h3>
          <div class="filter-options">
            <label
              v-for="concentration in topicStore.concentrations"
              :key="concentration"
              class="filter-checkbox"
            >
              <input
                type="checkbox"
                :checked="topicStore.filters.concentration === concentration"
                @change="topicStore.setConcentrationFilter(concentration)"
              />
              {{ concentration }}
            </label>
            <label class="filter-checkbox">
              <input
                type="checkbox"
                :checked="topicStore.filters.concentration === ''"
                @change="topicStore.setConcentrationFilter('')"
              />
              All Concentrations
            </label>
          </div>
        </div>

        <div class="filter-section">
          <h3>Status</h3>
          <div class="filter-options">
            <label class="filter-checkbox">
              <input
                type="radio"
                name="status"
                value="Active"
                v-model="selectedStatus"
                @change="topicStore.setStatusFilter('Active')"
              />
              Active
            </label>
            <label class="filter-checkbox">
              <input
                type="radio"
                name="status"
                value="All"
                v-model="selectedStatus"
                @change="topicStore.setStatusFilter('')"
              />
              All
            </label>
          </div>
        </div>

        <button @click="topicStore.resetFilters" class="btn-reset">
          Reset Filters
        </button>
      </aside>

      <!-- Main Content -->
      <main class="topics-main">
        <!-- Loading State -->
        <div v-if="topicStore.loading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading topics...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="topicStore.error" class="error-state">
          <p>{{ topicStore.error }}</p>
          <button @click="topicStore.fetchTopics" class="btn-retry">
            Retry
          </button>
        </div>

        <!-- Empty State -->
        <div v-else-if="topicStore.topics.length === 0" class="empty-state">
          <p>No topics found matching your filters</p>
        </div>

        <!-- Topics List -->
        <div v-else class="topics-list">
          <div class="topics-count">
            Showing {{ topicStore.topics.length }} of
            {{ topicStore.pagination.total }} topics
          </div>
          <topic-card
            v-for="topic in topicStore.topics"
            :key="topic._id"
            :topic="topic"
            @applied="handleTopicApplied"
            @error="handleError"
          />
        </div>

        <!-- Pagination -->
        <div v-if="topicStore.pagination.pages > 1" class="pagination">
          <button
            @click="topicStore.setPage(topicStore.filters.page - 1)"
            :disabled="topicStore.filters.page === 1"
            class="btn btn-pagination"
          >
            Previous
          </button>

          <div class="pagination-info">
            Page {{ topicStore.filters.page }} of {{ topicStore.pagination.pages }}
          </div>

          <button
            @click="topicStore.setPage(topicStore.filters.page + 1)"
            :disabled="topicStore.filters.page === topicStore.pagination.pages"
            class="btn btn-pagination"
          >
            Next
          </button>
        </div>
      </main>
    </div>

    <!-- Success Message -->
    <div v-if="successMessage" class="success-toast">
      {{ successMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTopicStore } from '@/stores/topicStore'
import TopicCard from '@/components/TopicCard.vue'

const topicStore = useTopicStore()
const searchInput = ref('')
const selectedStatus = ref('Active')
const successMessage = ref('')

let searchTimeout: NodeJS.Timeout

const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    topicStore.searchTopics(searchInput.value)
  }, 300)
}

const handleTopicApplied = (topicId: string) => {
  successMessage.value = 'Successfully applied for the topic!'
  setTimeout(() => {
    successMessage.value = ''
  }, 3000)
}

const handleError = (error: string) => {
  topicStore.error = error
  setTimeout(() => {
    topicStore.clearError()
  }, 5000)
}

onMounted(async () => {
  await topicStore.fetchTopics()
})
</script>

<style scoped>
.topic-discovery {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f8f9fa;
}

.discovery-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 3rem 2rem;
  text-align: center;
}

.discovery-header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  font-weight: 700;
}

.discovery-header p {
  margin: 0;
  font-size: 1.1rem;
  opacity: 0.9;
}

.discovery-layout {
  display: flex;
  gap: 2rem;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.filters-sidebar {
  flex: 0 0 250px;
  position: sticky;
  top: 2rem;
  height: fit-content;
}

.filter-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid #e0e0e0;
}

.filter-section h3 {
  margin: 0 0 1rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #333;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.filter-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: #555;
  user-select: none;
}

.filter-checkbox input {
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.filter-checkbox:hover {
  color: #333;
}

.btn-reset {
  width: 100%;
  padding: 0.75rem;
  background: #f0f0f0;
  border: none;
  border-radius: 6px;
  color: #333;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 1rem;
}

.btn-reset:hover {
  background: #e0e0e0;
}

.topics-main {
  flex: 1;
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

.error-state p {
  margin: 0 0 1rem 0;
}

.btn-retry {
  padding: 0.6rem 1.5rem;
  background: #c33;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-retry:hover {
  background: #a22;
}

.topics-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.topics-count {
  font-size: 0.9rem;
  color: #666;
  padding: 0 0 0.5rem 0;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e0e0e0;
}

.pagination-info {
  color: #666;
  font-size: 0.9rem;
  min-width: 150px;
  text-align: center;
}

.btn {
  padding: 0.6rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-pagination {
  background: #667eea;
  color: white;
}

.btn-pagination:hover:not(:disabled) {
  background: #5568d3;
}

.btn-pagination:disabled {
  background: #ccc;
  cursor: not-allowed;
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
  .discovery-layout {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }

  .filters-sidebar {
    flex: none;
    position: static;
  }

  .discovery-header h1 {
    font-size: 1.8rem;
  }
}
</style>
