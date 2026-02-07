<template>
  <div class="advanced-search">
    <div class="search-container">
      <div class="search-input-group">
        <input
          v-model="searchInput"
          type="text"
          placeholder="Search topics, keywords..."
          class="search-input"
          @input="debounceSearch"
          @focus="showSuggestions = true"
        />
        <div v-if="searchInput" class="search-icon">🔍</div>
      </div>

      <!-- Suggestions Dropdown -->
      <div v-if="showSuggestions && searchInput && suggestions.length > 0" class="suggestions">
        <div
          v-for="(suggestion, idx) in suggestions"
          :key="idx"
          class="suggestion-item"
          @click="selectSuggestion(suggestion)"
        >
          {{ suggestion }}
        </div>
      </div>
    </div>

    <div class="filter-group">
      <div class="filter-item">
        <label for="concentration">Concentration:</label>
        <select
          v-model="filters.concentration"
          id="concentration"
          @change="applyFilters"
        >
          <option value="">All Concentrations</option>
          <option value="AI">AI & Machine Learning</option>
          <option value="WebDev">Web Development</option>
          <option value="Mobile">Mobile Development</option>
          <option value="DataScience">Data Science</option>
          <option value="Security">Cybersecurity</option>
        </select>
      </div>

      <div class="filter-item">
        <label for="dateFrom">Published From:</label>
        <input
          v-model="filters.dateFrom"
          type="date"
          id="dateFrom"
          @change="applyFilters"
        />
      </div>

      <div class="filter-item">
        <label for="dateTo">Published To:</label>
        <input
          v-model="filters.dateTo"
          type="date"
          id="dateTo"
          @change="applyFilters"
        />
      </div>
    </div>

    <div class="active-filters">
      <div v-if="activeFiltersCount > 0" class="filter-tags">
        <span v-if="filters.concentration" class="filter-tag">
          Concentration: {{ filters.concentration }}
          <button @click="removeFilter('concentration')" class="remove-btn">×</button>
        </span>
        <span v-if="filters.dateFrom" class="filter-tag">
          From: {{ filters.dateFrom }}
          <button @click="removeFilter('dateFrom')" class="remove-btn">×</button>
        </span>
        <span v-if="filters.dateTo" class="filter-tag">
          To: {{ filters.dateTo }}
          <button @click="removeFilter('dateTo')" class="remove-btn">×</button>
        </span>
        <button @click="clearAllFilters" class="clear-all">Clear All</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Filters {
  concentration: string
  dateFrom: string
  dateTo: string
}

interface Props {
  keywords?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  keywords: () => []
})

const emit = defineEmits<{
  search: [term: string, filters: Filters]
  filterChange: [filters: Filters]
}>()

const searchInput = ref('')
const showSuggestions = ref(false)

const filters = ref<Filters>({
  concentration: '',
  dateFrom: '',
  dateTo: ''
})

let searchTimeout: NodeJS.Timeout

const suggestions = computed(() => {
  if (!searchInput.value) return []

  const term = searchInput.value.toLowerCase()
  const uniqueSuggestions = new Set<string>()

  // Add keyword suggestions
  props.keywords.forEach(keyword => {
    if (keyword.toLowerCase().includes(term) && uniqueSuggestions.size < 5) {
      uniqueSuggestions.add(keyword)
    }
  })

  // Add common search suggestions
  const commonTerms = [
    'machine learning',
    'web development',
    'mobile app',
    'data analysis',
    'security'
  ]

  commonTerms.forEach(term_item => {
    if (term_item.includes(term) && uniqueSuggestions.size < 5) {
      uniqueSuggestions.add(term_item)
    }
  })

  return Array.from(uniqueSuggestions)
})

const activeFiltersCount = computed(() => {
  let count = 0
  if (filters.value.concentration) count++
  if (filters.value.dateFrom) count++
  if (filters.value.dateTo) count++
  return count
})

const debounceSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    emit('search', searchInput.value, filters.value)
  }, 300)
}

const selectSuggestion = (suggestion: string) => {
  searchInput.value = suggestion
  showSuggestions.value = false
  emit('search', searchInput.value, filters.value)
}

const applyFilters = () => {
  emit('filterChange', filters.value)
  emit('search', searchInput.value, filters.value)
}

const removeFilter = (filterName: keyof Filters) => {
  filters.value[filterName] = ''
  applyFilters()
}

const clearAllFilters = () => {
  searchInput.value = ''
  filters.value = {
    concentration: '',
    dateFrom: '',
    dateTo: ''
  }
  emit('search', '', filters.value)
}
</script>

<style scoped>
.advanced-search {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  margin-bottom: 1.5rem;
}

.search-container {
  position: relative;
  margin-bottom: 1.5rem;
}

.search-input-group {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 0.75rem 0.75rem 0.75rem 1rem;
  font-size: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e0e0e0;
  border-top: none;
  border-radius: 0 0 6px 6px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.suggestion-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.suggestion-item:hover {
  background: #f0f0f0;
}

.filter-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.filter-item {
  display: flex;
  flex-direction: column;
}

.filter-item label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
  margin-bottom: 0.5rem;
}

.filter-item select,
.filter-item input {
  padding: 0.6rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: border-color 0.2s;
}

.filter-item select:focus,
.filter-item input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  flex: 1;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.5rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.remove-btn {
  background: none;
  border: none;
  color: #1976d2;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  color: #1565c0;
}

.clear-all {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 0.85rem;
  text-decoration: underline;
  padding: 0;
}

.clear-all:hover {
  color: #333;
}

@media (max-width: 768px) {
  .filter-group {
    grid-template-columns: 1fr;
  }
}
</style>
