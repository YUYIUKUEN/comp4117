---
work_package_id: "WP11"
title: "Topic Discovery & Search UI"
lane: "doing"
dependencies: ["WP03", "WP09"]
subtasks: ["T053", "T054", "T055", "T056", "T057"]
created_at: "2026-02-02"
agent: "GitHub Copilot"
shell_pid: "22748"
---

# WP11: Topic Discovery & Search UI

**Objective**: Implement comprehensive topic discovery interface with search, filtering, browsing, and topic detail views.

**Scope**: Topic listing, search by keywords, filter by concentration, topic detail view, supervisor publishing interface, and topic applications.

**Success Criteria**:
- Topic list displays paginated results
- Search works with keywords
- Filters by concentration apply correctly
- Topic detail shows full information
- Students can apply for topics
- Supervisors can manage topics
- 80%+ test coverage

**Estimated Effort**: 4-5 days (frontend developer)

---

## Subtask T053: Implement Topic Listing & Pagination

**Purpose**: Create main topic discovery page with pagination and basic filtering.

**Files to Create**:
- `src/views/TopicDiscovery.vue`
- `src/components/TopicCard.vue`
- `src/services/topicService.js`
- `tests/views/TopicDiscovery.test.js`

**Steps**:

1. Create `src/services/topicService.js`:
   ```javascript
   import client from './httpClient';
   
   export default {
     async getTopics(params = {}) {
       try {
         const response = await client.get('/topics', { params });
         return response.data;
       } catch (error) {
         throw error;
       }
     },
     
     async getTopicById(topicId) {
       return client.get(`/topics/${topicId}`);
     },
     
     async searchTopics(searchTerm, filters = {}) {
       return client.get('/topics/search', {
         params: { q: searchTerm, ...filters },
       });
     },
     
     async getTopicsByConcentration(concentration) {
       return client.get('/topics/concentration', {
         params: { concentration },
       });
     },
     
     async applyForTopic(topicId) {
       return client.post(`/topics/${topicId}/apply`);
     },
     
     async publishTopic(topicId) {
       return client.post(`/topics/${topicId}/publish`);
     },
     
     async updateTopic(topicId, data) {
       return client.put(`/topics/${topicId}`, data);
     },
   };
   ```

2. Create `src/components/TopicCard.vue`:
   ```vue
   <template>
     <div class="topic-card">
       <div class="card-header">
         <h3>{{ topic.title }}</h3>
         <span class="badge" :class="`badge-${topic.status.toLowerCase()}`">
           {{ topic.status }}
         </span>
       </div>
       
       <p class="topic-description">{{ truncateText(topic.description, 150) }}</p>
       
       <div class="topic-meta">
         <span class="meta-item">
           <strong>Concentration:</strong> {{ topic.concentration }}
         </span>
         <span class="meta-item">
           <strong>Supervisor:</strong> {{ topic.supervisorName }}
         </span>
       </div>
       
       <div class="topic-keywords">
         <span v-for="keyword in topic.keywords" :key="keyword" class="keyword-badge">
           {{ keyword }}
         </span>
       </div>
       
       <div class="card-actions">
         <button
           v-if="canApply"
           @click="handleApply"
           class="btn-apply"
           :disabled="applying"
         >
           {{ applying ? 'Applying...' : 'Apply' }}
         </button>
         <router-link :to="`/topics/${topic._id}`" class="btn-view">
           View Details
         </router-link>
       </div>
     </div>
   </template>
   
   <script setup>
   import { ref, computed } from 'vue';
   import { useAuthStore } from '../stores/authStore';
   import topicService from '../services/topicService';
   
   const props = defineProps({
     topic: {
       type: Object,
       required: true,
     },
   });
   
   const emit = defineEmits(['applied', 'error']);
   
   const authStore = useAuthStore();
   const applying = ref(false);
   
   const canApply = computed(() => {
     return authStore.userRole === 'Student' && props.topic.status === 'Active';
   });
   
   const truncateText = (text, length) => {
     return text.length > length ? text.substring(0, length) + '...' : text;
   };
   
   const handleApply = async () => {
     applying.value = true;
     try {
       await topicService.applyForTopic(props.topic._id);
       emit('applied', props.topic._id);
     } catch (error) {
       emit('error', error.response?.data?.error || 'Failed to apply');
     } finally {
       applying.value = false;
     }
   };
   </script>
   
   <style scoped>
   .topic-card {
     background: white;
     border: 1px solid #e0e0e0;
     border-radius: 8px;
     padding: 1.5rem;
     margin-bottom: 1rem;
     transition: all 0.2s;
     display: flex;
     flex-direction: column;
   }
   
   .topic-card:hover {
     box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
     border-color: #667eea;
   }
   
   .card-header {
     display: flex;
     justify-content: space-between;
     align-items: start;
     margin-bottom: 1rem;
   }
   
   .card-header h3 {
     margin: 0;
     color: #333;
     flex: 1;
   }
   
   .badge {
     padding: 0.25rem 0.75rem;
     border-radius: 20px;
     font-size: 0.75rem;
     font-weight: 600;
     text-transform: uppercase;
     white-space: nowrap;
     margin-left: 0.5rem;
   }
   
   .badge-active {
     background: #d4edda;
     color: #155724;
   }
   
   .badge-draft {
     background: #e2e3e5;
     color: #383d41;
   }
   
   .badge-archived {
     background: #f8d7da;
     color: #721c24;
   }
   
   .topic-description {
     color: #666;
     margin: 0 0 1rem 0;
     line-height: 1.5;
   }
   
   .topic-meta {
     display: flex;
     gap: 1.5rem;
     margin-bottom: 1rem;
     font-size: 0.9rem;
   }
   
   .meta-item {
     color: #666;
   }
   
   .topic-keywords {
     display: flex;
     flex-wrap: wrap;
     gap: 0.5rem;
     margin-bottom: 1rem;
   }
   
   .keyword-badge {
     background: #f0f0f0;
     color: #333;
     padding: 0.25rem 0.75rem;
     border-radius: 15px;
     font-size: 0.8rem;
   }
   
   .card-actions {
     display: flex;
     gap: 0.75rem;
     margin-top: auto;
   }
   
   .btn-apply,
   .btn-view {
     flex: 1;
     padding: 0.5rem 1rem;
     border: none;
     border-radius: 4px;
     font-size: 0.9rem;
     cursor: pointer;
     text-align: center;
     text-decoration: none;
     transition: all 0.2s;
   }
   
   .btn-apply {
     background: #667eea;
     color: white;
   }
   
   .btn-apply:hover:not(:disabled) {
     background: #764ba2;
   }
   
   .btn-view {
     background: #f0f0f0;
     color: #333;
   }
   
   .btn-view:hover {
     background: #e0e0e0;
   }
   </style>
   ```

3. Create `src/views/TopicDiscovery.vue`:
   ```vue
   <template>
     <div class="topic-discovery-page">
       <div class="page-header">
         <h1>Topic Discovery</h1>
         <p>Explore available FYP topics</p>
       </div>
       
       <div class="discovery-container">
         <aside class="filters-sidebar">
           <div class="filter-group">
             <h3>Search</h3>
             <input
               v-model="searchTerm"
               type="text"
               placeholder="Search topics..."
               @input="handleSearch"
               class="search-input"
             />
           </div>
           
           <div class="filter-group">
             <h3>Concentration</h3>
             <div class="filter-options">
               <label v-for="conc in concentrations" :key="conc">
                 <input
                   type="checkbox"
                   :value="conc"
                   v-model="selectedConcentrations"
                   @change="applyFilters"
                 />
                 {{ conc }}
               </label>
             </div>
           </div>
           
           <div class="filter-group">
             <h3>Status</h3>
             <select v-model="selectedStatus" @change="applyFilters">
               <option value="">All Status</option>
               <option value="Active">Active</option>
               <option value="Draft">Draft</option>
               <option value="Archived">Archived</option>
             </select>
           </div>
           
           <button @click="resetFilters" class="btn-reset">
             Reset Filters
           </button>
         </aside>
         
         <main class="topics-main">
           <div class="view-controls">
             <span>{{ topics.length }} topics found</span>
           </div>
           
           <div v-if="loading" class="loading">
             Loading topics...
           </div>
           
           <div v-else-if="topics.length === 0" class="empty-state">
             <p>No topics found matching your criteria</p>
           </div>
           
           <div v-else class="topics-list">
             <TopicCard
               v-for="topic in topics"
               :key="topic._id"
               :topic="topic"
               @applied="handleApplied"
               @error="handleError"
             />
           </div>
           
           <div v-if="hasMorePages" class="pagination">
             <button @click="loadMore" :disabled="loading">
               Load More
             </button>
           </div>
         </main>
       </div>
       
       <div v-if="error" class="error-notification">
         {{ error }}
         <button @click="error = null">×</button>
       </div>
     </div>
   </template>
   
   <script setup>
   import { ref, reactive, computed } from 'vue';
   import TopicCard from '../components/TopicCard.vue';
   import topicService from '../services/topicService';
   import { useTopicStore } from '../stores/topicStore';
   
   const topicStore = useTopicStore();
   
   const topics = ref([]);
   const loading = ref(false);
   const error = ref(null);
   const currentPage = ref(1);
   const totalPages = ref(1);
   
   const searchTerm = ref('');
   const selectedConcentrations = ref([]);
   const selectedStatus = ref('');
   
   const concentrations = [
     'Software Engineering',
     'Data Science',
     'Cybersecurity',
     'AI/ML',
     'Web Development',
     'Mobile Development',
     'Cloud Computing',
     'Other',
   ];
   
   const hasMorePages = computed(() => currentPage.value < totalPages.value);
   
   const loadTopics = async () => {
     loading.value = true;
     error.value = null;
     
     try {
       const params = {
         page: currentPage.value,
         limit: 10,
       };
       
       if (searchTerm.value) {
         params.q = searchTerm.value;
       }
       if (selectedConcentrations.value.length > 0) {
         params.concentration = selectedConcentrations.value.join(',');
       }
       if (selectedStatus.value) {
         params.status = selectedStatus.value;
       }
       
       const response = await topicService.getTopics(params);
       topics.value = response.data.topics;
       totalPages.value = response.data.pagination.pages;
       topicStore.setTopics(topics.value);
     } catch (err) {
       error.value = err.response?.data?.error || 'Failed to load topics';
     } finally {
       loading.value = false;
     }
   };
   
   const handleSearch = () => {
     currentPage.value = 1;
     loadTopics();
   };
   
   const applyFilters = () => {
     currentPage.value = 1;
     loadTopics();
   };
   
   const resetFilters = () => {
     searchTerm.value = '';
     selectedConcentrations.value = [];
     selectedStatus.value = '';
     currentPage.value = 1;
     loadTopics();
   };
   
   const loadMore = () => {
     currentPage.value += 1;
     loadTopics();
   };
   
   const handleApplied = (topicId) => {
     error.value = null;
     loadTopics();
   };
   
   const handleError = (message) => {
     error.value = message;
   };
   
   loadTopics();
   </script>
   
   <style scoped>
   .topic-discovery-page {
     padding: 2rem;
   }
   
   .page-header {
     margin-bottom: 2rem;
   }
   
   .page-header h1 {
     margin: 0 0 0.5rem 0;
     font-size: 2rem;
   }
   
   .discovery-container {
     display: grid;
     grid-template-columns: 250px 1fr;
     gap: 2rem;
   }
   
   .filters-sidebar {
     display: flex;
     flex-direction: column;
     gap: 1.5rem;
   }
   
   .filter-group {
     background: white;
     padding: 1rem;
     border-radius: 8px;
     border: 1px solid #e0e0e0;
   }
   
   .filter-group h3 {
     margin: 0 0 1rem 0;
     font-size: 0.95rem;
     text-transform: uppercase;
   }
   
   .search-input,
   .filter-group select {
     width: 100%;
     padding: 0.5rem;
     border: 1px solid #e0e0e0;
     border-radius: 4px;
   }
   
   .filter-options label {
     display: flex;
     align-items: center;
     margin-bottom: 0.5rem;
     cursor: pointer;
   }
   
   .filter-options input {
     margin-right: 0.5rem;
   }
   
   .btn-reset {
     padding: 0.75rem;
     background: #f0f0f0;
     border: none;
     border-radius: 4px;
     cursor: pointer;
   }
   
   .topics-main {
     display: flex;
     flex-direction: column;
   }
   
   .view-controls {
     margin-bottom: 1rem;
     color: #666;
     font-size: 0.9rem;
   }
   
   .loading,
   .empty-state {
     text-align: center;
     padding: 2rem;
     color: #666;
   }
   
   .topics-list {
     display: flex;
     flex-direction: column;
   }
   
   .pagination {
     text-align: center;
     margin-top: 2rem;
   }
   
   .pagination button {
     padding: 0.75rem 2rem;
     background: #667eea;
     color: white;
     border: none;
     border-radius: 4px;
     cursor: pointer;
   }
   
   .error-notification {
     position: fixed;
     bottom: 1rem;
     right: 1rem;
     background: #f8d7da;
     border: 1px solid #f5c6cb;
     color: #721c24;
     padding: 1rem;
     border-radius: 4px;
     display: flex;
     justify-content: space-between;
     align-items: center;
     gap: 1rem;
     max-width: 300px;
   }
   
   .error-notification button {
     background: none;
     border: none;
     cursor: pointer;
     font-size: 1.5rem;
     padding: 0;
   }
   
   @media (max-width: 768px) {
     .discovery-container {
       grid-template-columns: 1fr;
     }
     
     .filters-sidebar {
       flex-direction: row;
       flex-wrap: wrap;
     }
   }
   </style>
   ```

**Validation Checklist**:
- [ ] Topic list loads on page mount
- [ ] Pagination works
- [ ] Search functionality working
- [ ] Filter by concentration applies
- [ ] Filter by status applies
- [ ] Cards display all required fields
- [ ] Tests pass with 80%+ coverage

---

## Subtask T054: Implement Topic Detail View

**Purpose**: Create detailed topic view with full information, applications, and feedback.

**Files to Create**:
- `src/views/TopicDetail.vue`
- `src/components/ApplicationsList.vue`
- `tests/views/TopicDetail.test.js`

**Steps**:

1. Create `src/views/TopicDetail.vue`:
   ```vue
   <template>
     <div class="topic-detail-page">
       <div v-if="loading" class="loading">
         Loading topic details...
       </div>
       
       <div v-else-if="error" class="error">
         {{ error }}
       </div>
       
       <div v-else-if="topic" class="topic-detail">
         <div class="detail-header">
           <button @click="$router.back()" class="btn-back">← Back</button>
           <h1>{{ topic.title }}</h1>
           <span class="status-badge" :class="`badge-${topic.status.toLowerCase()}`">
             {{ topic.status }}
           </span>
         </div>
         
         <div class="detail-grid">
           <div class="main-content">
             <section class="section">
               <h2>Description</h2>
               <p>{{ topic.description }}</p>
             </section>
             
             <section class="section">
               <h2>Requirements</h2>
               <ul>
                 <li v-for="req in topic.requirements" :key="req">
                   {{ req }}
                 </li>
               </ul>
             </section>
             
             <section class="section">
               <h2>Keywords</h2>
               <div class="keywords">
                 <span v-for="keyword in topic.keywords" :key="keyword" class="keyword">
                   {{ keyword }}
                 </span>
               </div>
             </section>
           </div>
           
           <aside class="sidebar">
             <div class="info-box">
               <div class="info-item">
                 <label>Concentration</label>
                 <p>{{ topic.concentration }}</p>
               </div>
               <div class="info-item">
                 <label>Supervisor</label>
                 <p>{{ topic.supervisorName }}</p>
               </div>
               <div class="info-item">
                 <label>Max Students</label>
                 <p>{{ topic.maxStudents }}</p>
               </div>
               <div class="info-item">
                 <label>Applications</label>
                 <p>{{ topic.applicationCount || 0 }}</p>
               </div>
             </div>
             
             <button
               v-if="canApply && !hasApplied"
               @click="handleApply"
               class="btn-apply"
               :disabled="applying"
             >
               {{ applying ? 'Applying...' : 'Apply for Topic' }}
             </button>
             
             <div v-if="hasApplied" class="applied-badge">
               ✓ You have applied
             </div>
           </aside>
         </div>
       </div>
     </div>
   </template>
   
   <script setup>
   import { ref, computed, onMounted } from 'vue';
   import { useRoute } from 'vue-router';
   import { useAuthStore } from '../stores/authStore';
     import topicService from '../services/topicService';
   
   const route = useRoute();
   const authStore = useAuthStore();
   
   const topic = ref(null);
   const loading = ref(true);
   const error = ref(null);
   const applying = ref(false);
   
   const canApply = computed(() => authStore.userRole === 'Student' && topic.value?.status === 'Active');
   const hasApplied = computed(() => topic.value?.userApplied || false);
   
   const loadTopic = async () => {
     try {
       const response = await topicService.getTopicById(route.params.id);
       topic.value = response.data.data;
     } catch (err) {
       error.value = err.response?.data?.error || 'Failed to load topic';
     } finally {
       loading.value = false;
     }
   };
   
   const handleApply = async () => {
     applying.value = true;
     try {
       await topicService.applyForTopic(topic.value._id);
       topic.value.userApplied = true;
     } catch (err) {
       error.value = err.response?.data?.error || 'Failed to apply';
     } finally {
       applying.value = false;
     }
   };
   
   onMounted(loadTopic);
   </script>
   
   <style scoped>
   .topic-detail-page {
     padding: 2rem;
   }
   
   .detail-header {
     display: flex;
     align-items: center;
     gap: 1rem;
     margin-bottom: 2rem;
   }
   
   .btn-back {
     background: none;
     border: none;
     font-size: 1rem;
     cursor: pointer;
     color: #667eea;
   }
   
   .detail-grid {
     display: grid;
     grid-template-columns: 1fr 300px;
     gap: 2rem;
   }
   
   .section {
     background: white;
     padding: 1.5rem;
     border-radius: 8px;
     margin-bottom: 1.5rem;
     border: 1px solid #e0e0e0;
   }
   
   .keywords {
     display: flex;
     flex-wrap: wrap;
     gap: 0.5rem;
   }
   
   .keyword {
     background: #f0f0f0;
     padding: 0.25rem 0.75rem;
     border-radius: 15px;
     font-size: 0.9rem;
   }
   
   .sidebar {
     display: flex;
     flex-direction: column;
     gap: 1rem;
   }
   
   .info-box {
     background: white;
     padding: 1.5rem;
     border-radius: 8px;
     border: 1px solid #e0e0e0;
   }
   
   .info-item {
     margin-bottom: 1rem;
   }
   
   .info-item label {
     display: block;
     font-weight: 600;
     color: #666;
     font-size: 0.85rem;
     margin-bottom: 0.25rem;
   }
   
   .info-item p {
     margin: 0;
     color: #333;
   }
   
   .btn-apply {
     background: #667eea;
     color: white;
     border: none;
     padding: 1rem;
     border-radius: 8px;
     cursor: pointer;
     font-weight: 600;
   }
   
   .applied-badge {
     background: #d4edda;
     color: #155724;
     padding: 1rem;
     border-radius: 8px;
     text-align: center;
     font-weight: 600;
   }
   
   @media (max-width: 768px) {
     .detail-grid {
       grid-template-columns: 1fr;
     }
   }
   </style>
   ```

**Validation Checklist**:
- [ ] Topic details load correctly
- [ ] All fields display properly
- [ ] Apply button works
- [ ] Error handling works
- [ ] Back button navigates
- [ ] Tests pass

---

## Subtask T055: Implement Supervisor Topic Management Interface

**Purpose**: Create interface for supervisors to create, edit, and publish topics.

**Files to Create**:
- `src/views/SupervisorTopics.vue`
- `src/components/TopicForm.vue`
- `src/components/PublishingWorkflow.vue`

**Steps**:

Create supervisor topic management with draft creation, editing, and publishing workflow to Active status.

**Validation Checklist**:
- [ ] Supervisors can create topics
- [ ] Draft topics editable
- [ ] Publishing workflow works
- [ ] Validation enforced
- [ ] Error handling

---

## Subtask T056: Implement Topic Search with Full-Text Search

**Purpose**: Enhance search with full-text search and advanced filtering.

**Files to Create**:
- `src/components/AdvancedSearch.vue`
- `tests/components/AdvancedSearch.test.js`

**Steps**:

Create advanced search component with full-text search, keyword filtering, date range, and concentration filtering.

**Validation Checklist**:
- [ ] Full-text search working
- [ ] Autocomplete for keywords
- [ ] Advanced filters work
- [ ] Results paginated
- [ ] Performance acceptable

---

## Subtask T057: Comprehensive Topic UI Testing & Documentation

**Purpose**: Complete test coverage and topic UI documentation.

**Files to Create**:
- `tests/integration/topic-discovery.integration.test.js`
- `docs/topic-discovery-ui.md`

**Steps**:

Create end-to-end tests for topic discovery flow and comprehensive documentation.

**Validation Checklist**:
- [ ] 80%+ code coverage for topic components
- [ ] E2E tests for discovery flow
- [ ] Supervisor management tested
- [ ] Search tested
- [ ] UI documentation complete

---

## Definition of Done

- [x] All subtasks T053-T057 completed
- [x] Topic listing with pagination
- [x] Topic detail view
- [x] Search and filtering
- [x] Supervisor management interface
- [x] Full-text search
- [x] 80%+ code coverage
- [x] Topic UI documentation created

## Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Search performance on large datasets | Medium | Medium | Index keywords, cache results, paginate |
| Topic status sync issues | Low | Medium | Real-time updates, periodic refresh, polling |
| Supervisor editing conflicts | Low | Low | Optimistic locking, version control |

## Reviewer Guidance

- Verify topic listing loads and paginates
- Check search returns correct results
- Confirm filters apply correctly
- Validate supervisor can manage topics
- Check publishing workflow
- Verify error handling
- Ensure 80%+ code coverage
- Test on multiple screen sizes

---

**Next Work Package**: WP12 (Submission Management UI)  
**Estimated Start**: Can run in parallel with WP11  
**Command**: `spec-kitty implement WP12`

## Activity Log

- 2026-02-07T13:38:03Z – GitHub Copilot – shell_pid=22748 – lane=doing – Started review via workflow command
