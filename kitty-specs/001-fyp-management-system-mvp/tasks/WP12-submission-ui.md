---
work_package_id: "WP12"
title: "Submission Management UI (Upload, Tracking, Status)"
lane: "doing"
dependencies: ["WP05", "WP09"]
subtasks: ["T058", "T059", "T060", "T061", "T062"]
created_at: "2026-02-02"
agent: "GitHub Copilot"
shell_pid: "16844"
---

# WP12: Submission Management UI (Upload, Tracking, Status)

**Objective**: Implement submission management interface for students to upload documents, track status, and view feedback from supervisors.

**Scope**: Submission upload form, file management, deadline tracking, status display, feedback viewing, declaration interface, and submission history.

**Success Criteria**:
- File upload works with drag-and-drop
- File validation enforced (PDF/DOCX, 50MB max)
- Deadline tracking displayed
- Submission status shows correctly
- Students can view supervisor feedback
- Can declare non-submission
- 80%+ test coverage

**Estimated Effort**: 4-5 days (frontend developer)

---

## Subtask T058: Implement File Upload Component with Validation

**Purpose**: Create robust file upload component with validation and progress tracking.

**Files to Create**:
- `src/components/FileUpload.vue`
- `src/utils/fileValidation.js`
- `src/services/submissionService.js`
- `tests/components/FileUpload.test.js`

**Steps**:

1. Create `src/utils/fileValidation.js`:
   ```javascript
   const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
   const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
   
   export const validateFile = (file) => {
     const errors = [];
     
     if (!file) {
       return { valid: false, errors: ['No file selected'] };
     }
     
     if (!ALLOWED_TYPES.includes(file.type)) {
       errors.push('Only PDF and DOCX files are allowed');
     }
     
     if (file.size > MAX_FILE_SIZE) {
       errors.push('File size must not exceed 50MB');
     }
     
     if (file.name.length > 255) {
       errors.push('File name too long');
     }
     
     return {
       valid: errors.length === 0,
       errors,
     };
   };
   
   export const getFileExtension = (filename) => {
     return filename.split('.').pop().toUpperCase();
   };
   
   export const formatFileSize = (bytes) => {
     if (bytes === 0) return '0 Bytes';
     const k = 1024;
     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
     const i = Math.floor(Math.log(bytes) / Math.log(k));
     return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
   };
   ```

2. Create `src/services/submissionService.js`:
   ```javascript
   import client from './httpClient';
   
   export default {
     async getSubmissions() {
       return client.get('/submissions');
     },
     
     async getSubmissionById(submissionId) {
       return client.get(`/submissions/${submissionId}`);
     },
     
     async uploadSubmission(assignmentId, file, onProgress) {
       const formData = new FormData();
       formData.append('file', file);
       
       return client.post(
         `/assignments/${assignmentId}/submissions/upload`,
         formData,
         {
           headers: { 'Content-Type': 'multipart/form-data' },
           onUploadProgress: onProgress,
         }
       );
     },
     
     async declareNotNeeded(submissionId, reason) {
       return client.post(
         `/submissions/${submissionId}/declare-not-needed`,
         { reason }
       );
     },
     
     async getFeedback(submissionId) {
       return client.get(`/submissions/${submissionId}/feedback`);
     },
     
     async getSubmissionHistory(submissionId) {
       return client.get(`/submissions/${submissionId}/history`);
     },
   };
   ```

3. Create `src/components/FileUpload.vue`:
   ```vue
   <template>
     <div class="file-upload">
       <div class="upload-area" :class="{ 'drag-over': dragOver }">
         <input
           ref="fileInput"
           type="file"
           @change="handleFileSelect"
           @dragover.prevent="dragOver = true"
           @dragleave.prevent="dragOver = false"
           @drop.prevent="handleDrop"
           :accept="acceptedFormats"
           class="file-input"
         />
         
         <div v-if="!file" class="upload-prompt">
           <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
             <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
             <polyline points="17 8 12 3 7 8"/>
             <line x1="12" y1="3" x2="12" y2="15"/>
           </svg>
           <p class="upload-text">Drag & drop your file here</p>
           <p class="upload-subtext">or click to browse</p>
           <p class="file-requirements">
             PDF or DOCX • Max 50MB
           </p>
         </div>
         
         <div v-else class="file-preview">
           <div class="file-info">
             <span class="file-icon">📄</span>
             <div class="file-details">
               <p class="file-name">{{ file.name }}</p>
               <p class="file-size">{{ formatFileSize(file.size) }}</p>
             </div>
           </div>
           <button
             type="button"
             @click="clearFile"
             class="btn-remove"
           >
             ✕
           </button>
         </div>
       </div>
       
       <div v-if="errors.length > 0" class="errors">
         <div v-for="error in errors" :key="error" class="error-item">
           ⚠ {{ error }}
         </div>
       </div>
       
       <div v-if="uploading" class="upload-progress">
         <div class="progress-bar">
           <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
         </div>
         <span class="progress-text">{{ uploadProgress }}%</span>
       </div>
     </div>
   </template>
   
   <script setup>
   import { ref } from 'vue';
   import { validateFile, formatFileSize } from '../utils/fileValidation';
   
   const props = defineProps({
     acceptedFormats: {
       type: String,
       default: '.pdf,.docx',
     },
   });
   
   const emit = defineEmits(['file-selected', 'error']);
   
   const fileInput = ref(null);
   const file = ref(null);
   const dragOver = ref(false);
   const errors = ref([]);
   const uploading = ref(false);
   const uploadProgress = ref(0);
   
   const handleFileSelect = (event) => {
     const files = event.target.files;
     if (files && files.length > 0) {
       processFile(files[0]);
     }
   };
   
   const handleDrop = (event) => {
     dragOver.value = false;
     const files = event.dataTransfer.files;
     if (files && files.length > 0) {
       processFile(files[0]);
     }
   };
   
   const processFile = (selectedFile) => {
     errors.value = [];
     const validation = validateFile(selectedFile);
     
     if (!validation.valid) {
       errors.value = validation.errors;
       emit('error', validation.errors);
       return;
     }
     
     file.value = selectedFile;
     emit('file-selected', selectedFile);
   };
   
   const clearFile = () => {
     file.value = null;
     errors.value = [];
     if (fileInput.value) {
       fileInput.value.value = '';
     }
   };
   
   const setUploadProgress = (progress) => {
     uploading.value = true;
     uploadProgress.value = progress;
   };
   
   const completeUpload = () => {
     uploading.value = false;
     uploadProgress.value = 0;
   };
   
   defineExpose({
     setUploadProgress,
     completeUpload,
     clearFile,
     getFile: () => file.value,
   });
   </script>
   
   <style scoped>
   .file-upload {
     width: 100%;
   }
   
   .upload-area {
     border: 2px dashed #ddd;
     border-radius: 8px;
     padding: 2rem;
     text-align: center;
     cursor: pointer;
     transition: all 0.2s;
     background: #fafafa;
   }
   
   .upload-area:hover,
   .upload-area.drag-over {
     border-color: #667eea;
     background: #f0f4ff;
   }
   
   .file-input {
     display: none;
   }
   
   .upload-prompt {
     display: flex;
     flex-direction: column;
     align-items: center;
   }
   
   .upload-icon {
     width: 48px;
     height: 48px;
     color: #667eea;
     margin-bottom: 1rem;
   }
   
   .upload-text {
     margin: 0;
     font-weight: 600;
     color: #333;
     font-size: 1.1rem;
   }
   
   .upload-subtext {
     margin: 0.5rem 0 0;
     color: #666;
   }
   
   .file-requirements {
     margin: 1rem 0 0;
     color: #999;
     font-size: 0.85rem;
   }
   
   .file-preview {
     display: flex;
     justify-content: space-between;
     align-items: center;
     background: white;
     padding: 1rem;
     border-radius: 6px;
   }
   
   .file-info {
     display: flex;
     align-items: center;
     gap: 1rem;
   }
   
   .file-icon {
     font-size: 2rem;
   }
   
   .file-details {
     text-align: left;
   }
   
   .file-name {
     margin: 0;
     font-weight: 600;
     color: #333;
   }
   
   .file-size {
     margin: 0.25rem 0 0;
     color: #666;
     font-size: 0.9rem;
   }
   
   .btn-remove {
     background: #f0f0f0;
     border: none;
     width: 2rem;
     height: 2rem;
     border-radius: 50%;
     cursor: pointer;
     font-size: 1.2rem;
   }
   
   .btn-remove:hover {
     background: #e0e0e0;
   }
   
   .errors {
     margin-top: 1rem;
   }
   
   .error-item {
     background: #f8d7da;
     color: #721c24;
     padding: 0.75rem;
     border-radius: 4px;
     margin-bottom: 0.5rem;
     font-size: 0.9rem;
   }
   
   .upload-progress {
     margin-top: 1rem;
   }
   
   .progress-bar {
     background: #e0e0e0;
     border-radius: 4px;
     height: 6px;
     overflow: hidden;
   }
   
   .progress-fill {
     background: #667eea;
     height: 100%;
     transition: width 0.3s;
   }
   
   .progress-text {
     display: block;
     text-align: center;
     margin-top: 0.5rem;
     color: #666;
     font-size: 0.9rem;
   }
   </style>
   ```

**Validation Checklist**:
- [ ] File upload works with click
- [ ] Drag & drop works
- [ ] File validation enforces PDF/DOCX
- [ ] File size limit enforced (50MB)
- [ ] Progress bar shows
- [ ] Error messages display
- [ ] File can be cleared
- [ ] Tests pass

---

## Subtask T059: Implement Submission Tracking & Status Display

**Purpose**: Create submission status tracking and deadline management UI.

**Files to Create**:
- `src/views/StudentSubmissions.vue`
- `src/components/SubmissionCard.vue`
- `src/components/DeadlineTracker.vue`
- `tests/views/StudentSubmissions.test.js`

**Steps**:

1. Create `src/views/StudentSubmissions.vue`:
   ```vue
   <template>
     <div class="submissions-page">
       <div class="page-header">
         <h1>My Submissions</h1>
         <p>Track your FYP submissions and deadlines</p>
       </div>
       
       <div v-if="loading" class="loading">
         Loading submissions...
       </div>
       
       <div v-else class="submissions-container">
         <div class="submissions-overview">
           <div class="overview-card">
             <span class="overview-label">Total Submissions</span>
             <span class="overview-value">{{ submissions.length }}</span>
           </div>
           <div class="overview-card">
             <span class="overview-label">Submitted</span>
             <span class="overview-value">{{ submittedCount }}</span>
           </div>
           <div class="overview-card">
             <span class="overview-label">Pending</span>
             <span class="overview-value">{{ pendingCount }}</span>
           </div>
           <div class="overview-card">
             <span class="overview-label">Overdue</span>
             <span class="overview-value warning">{{ overdueCount }}</span>
           </div>
         </div>
         
         <div v-if="submissions.length === 0" class="empty-state">
           <p>No submissions yet</p>
         </div>
         
         <div v-else class="submissions-list">
           <SubmissionCard
             v-for="submission in submissions"
             :key="submission._id"
             :submission="submission"
             @upload="handleUpload"
             @declare="handleDeclare"
             @view-feedback="handleViewFeedback"
           />
         </div>
       </div>
     </div>
   </template>
   
   <script setup>
   import { ref, computed, onMounted } from 'vue';
   import SubmissionCard from '../components/SubmissionCard.vue';
   import submissionService from '../services/submissionService';
   
   const submissions = ref([]);
   const loading = ref(true);
   
   const submittedCount = computed(() =>
     submissions.value.filter(s => s.status === 'Submitted').length
   );
   
   const pendingCount = computed(() =>
     submissions.value.filter(s => s.status === 'Not Submitted').length
   );
   
   const overdueCount = computed(() =>
     submissions.value.filter(s => s.status === 'Overdue').length
   );
   
   const loadSubmissions = async () => {
     try {
       const response = await submissionService.getSubmissions();
       submissions.value = response.data.data;
     } finally {
       loading.value = false;
     }
   };
   
   const handleUpload = (submissionId) => {
     loadSubmissions();
   };
   
   const handleDeclare = (submissionId) => {
     loadSubmissions();
   };
   
   const handleViewFeedback = (submissionId) => {
     // Navigate to feedback view
   };
   
   onMounted(loadSubmissions);
   </script>
   
   <style scoped>
   .submissions-page {
     padding: 2rem;
   }
   
   .page-header {
     margin-bottom: 2rem;
   }
   
   .submissions-overview {
     display: grid;
     grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
     gap: 1rem;
     margin-bottom: 2rem;
   }
   
   .overview-card {
     background: white;
     padding: 1.5rem;
     border-radius: 8px;
     border: 1px solid #e0e0e0;
     text-align: center;
   }
   
   .overview-label {
     display: block;
     color: #666;
     font-size: 0.9rem;
     margin-bottom: 0.5rem;
   }
   
   .overview-value {
     display: block;
     font-size: 2rem;
     font-weight: 700;
     color: #333;
   }
   
   .overview-value.warning {
     color: #dc3545;
   }
   
   .submissions-list {
     display: flex;
     flex-direction: column;
     gap: 1rem;
   }
   </style>
   ```

2. Create `src/components/SubmissionCard.vue`:
   ```vue
   <template>
     <div class="submission-card">
       <div class="card-header">
         <div class="header-content">
           <h3>{{ submission.assignmentName }}</h3>
           <span class="status-badge" :class="`status-${submission.status.toLowerCase()}`">
             {{ submission.status }}
           </span>
         </div>
         <div class="deadline-info">
           <span :class="{ 'text-danger': isOverdue }">
             Due: {{ formatDate(submission.dueDate) }}
           </span>
         </div>
       </div>
       
       <div v-if="submission.status === 'Not Submitted'" class="submission-actions">
         <button @click="$emit('upload')" class="btn-upload">
           Upload Submission
         </button>
       </div>
       
       <div v-else-if="submission.status === 'Submitted'" class="submission-info">
         <p>
           <strong>Submitted:</strong>
           {{ formatDate(submission.submittedDate) }}
         </p>
         <p v-if="submission.fileName">
           <strong>File:</strong> {{ submission.fileName }}
         </p>
       </div>
       
       <div class="card-footer">
         <button @click="$emit('view-feedback')" class="btn-secondary">
           View Feedback
         </button>
         <button v-if="canDeclare" @click="$emit('declare')" class="btn-secondary">
           Declare Not Needed
         </button>
       </div>
     </div>
   </template>
   
   <script setup>
   import { computed } from 'vue';
   
   const props = defineProps({
     submission: {
       type: Object,
       required: true,
     },
   });
   
   defineEmits(['upload', 'declare', 'view-feedback']);
   
   const isOverdue = computed(() => new Date() > new Date(props.submission.dueDate));
   const canDeclare = computed(() => props.submission.status === 'Not Submitted');
   
   const formatDate = (date) => {
     return new Date(date).toLocaleDateString();
   };
   </script>
   
   <style scoped>
   .submission-card {
     background: white;
     border: 1px solid #e0e0e0;
     border-radius: 8px;
     padding: 1.5rem;
   }
   
   .card-header {
     display: flex;
     justify-content: space-between;
     margin-bottom: 1rem;
   }
   
   .header-content {
     display: flex;
     gap: 1rem;
     align-items: center;
   }
   
   .header-content h3 {
     margin: 0;
   }
   
   .status-badge {
     padding: 0.25rem 0.75rem;
     border-radius: 20px;
     font-size: 0.75rem;
     font-weight: 600;
     text-transform: uppercase;
   }
   
   .status-submitted {
     background: #d4edda;
     color: #155724;
   }
   
   .status-not-submitted {
     background: #e2e3e5;
     color: #383d41;
   }
   
   .status-overdue {
     background: #f8d7da;
     color: #721c24;
   }
   </style>
   ```

**Validation Checklist**:
- [ ] Submission list loads
- [ ] Status badges display correctly
- [ ] Deadlines shown and formatted
- [ ] Overdue indicated visually
- [ ] Cards display all required info
- [ ] Tests pass

---

## Subtask T060: Implement Submission Upload Form & Modal

**Purpose**: Create modal dialog for file upload and submission.

**Files to Create**:
- `src/components/SubmissionUploadModal.vue`
- `tests/components/SubmissionUploadModal.test.js`

**Steps**:

Create modal with file upload component, submission notes, and submit button.

**Validation Checklist**:
- [ ] Modal opens/closes
- [ ] File upload integrated
- [ ] Submit button triggers upload
- [ ] Progress shown during upload
- [ ] Success/error messages
- [ ] Resets on close

---

## Subtask T061: Implement Supervisor Feedback View & Declaration

**Purpose**: Create feedback viewing and submission declaration interface.

**Files to Create**:
- `src/views/SubmissionFeedback.vue`
- `src/components/FeedbackDisplay.vue`
- `src/components/DeclarationModal.vue`

**Steps**:

Create interface for students to:
1. View feedback from supervisors
2. See ratings if provided
3. Declare submission not needed with reason

**Validation Checklist**:
- [ ] Feedback displays correctly
- [ ] Private feedback hidden appropriately
- [ ] Ratings show if available
- [ ] Declaration modal works
- [ ] Reason captured

---

## Subtask T062: Comprehensive Submission UI Testing & Documentation

**Purpose**: Complete test coverage and submission UI documentation.

**Files to Create**:
- `tests/integration/submission-flow.integration.test.js`
- `docs/submission-ui.md`

**Steps**:

Create end-to-end tests for complete submission flow from upload to feedback viewing. Document all submission components and workflows.

**Validation Checklist**:
- [ ] 80%+ code coverage for submission components
- [ ] E2E upload flow tested
- [ ] Status tracking tested
- [ ] Feedback view tested
- [ ] Declaration flow tested
- [ ] Submission UI documentation complete

---

## Definition of Done

- [x] All subtasks T058-T062 completed
- [x] File upload with validation
- [x] Submission status tracking
- [x] Upload form/modal
- [x] Feedback viewing
- [x] Declaration interface
- [x] 80%+ code coverage
- [x] Submission UI documentation created

## Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| File upload failure (network) | Medium | Medium | Resume capability, retry logic, clear errors |
| File too large | Low | Low | Client validation, clear limits, compression info |
| Deadline display issues | Low | Low | Timezone handling, server time sync, NTP |
| Feedback visibility bug | Low | High | Role-based testing, privacy enforcement |

## Reviewer Guidance

- Verify file upload works and validates correctly
- Check progress bar during upload
- Confirm submission status updates
- Verify deadline tracking
- Check feedback viewing with privacy
- Test declaration flow
- Ensure 80%+ code coverage
- Test error scenarios thoroughly
- Validate on slow network

---

**Next Work Package**: WP13 (Dashboard UI)  
**Estimated Start**: Can run in parallel with WP12  
**Command**: `spec-kitty implement WP13`

## Activity Log

- 2026-02-07T14:07:24Z – GitHub Copilot – shell_pid=16844 – lane=doing – Started review via workflow command
