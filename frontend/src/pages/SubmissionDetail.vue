<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  Bars3Icon,
  ChevronRightIcon,
  PaperClipIcon,
  CloudArrowUpIcon,
  LockClosedIcon,
  EyeSlashIcon,
  DocumentArrowUpIcon,
  ClipboardDocumentListIcon,
  HomeIcon,
  CheckCircleIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline';
import { AcademicCapIcon } from '@heroicons/vue/24/outline';
import { useSubmissionStore } from '../stores/submissionStore';
import { useAuthStore } from '../stores/authStore';
import submissionService from '../services/submissionService';
import httpClient from '../services/httpClient';
import feedbackService from '../services/feedbackService';
import gradingStandardService from '../services/gradingStandardService';

const router = useRouter();
const submissionStore = useSubmissionStore();
const authStore = useAuthStore();
const isStudent = computed(() => authStore.userRole === 'Student');
const sidebarOpen = ref(false);
const declarationSubmitting = ref(false);
const declarationError = ref<string | null>(null);
const activeView = ref<'submissions' | 'checklist'>('submissions');
const uploading = ref(false);
const uploadError = ref<string | null>(null);
const uploadSuccess = ref<string | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const deletingFile = ref<string | null>(null);
const feedback = ref<any[]>([]);
const feedbackLoading = ref(false);
const deletingFeedbackId = ref<string | null>(null);
const gradingStandard = ref<any>(null);

const goToDashboard = () => {
  router.push('/dashboard');
};

// Fetch feedback for current submission
const fetchFeedback = async () => {
  if (!currentPhase.value) return;
  
  feedbackLoading.value = true;
  try {
    const response = await httpClient.get(`/feedback/submissions/${currentPhase.value._id}/feedback`);
    // Handle both response formats
    if (response.data.data?.feedback) {
      feedback.value = Array.isArray(response.data.data.feedback) ? response.data.data.feedback : [];
    } else if (response.data.data && Array.isArray(response.data.data)) {
      feedback.value = response.data.data;
    } else {
      feedback.value = [];
    }
    console.log(`Feedback for submission ${currentPhase.value._id}:`, feedback.value);
  } catch (error) {
    console.warn('Failed to fetch feedback:', error);
    feedback.value = [];
  } finally {
    feedbackLoading.value = false;
  }
};

// Fetch grading standard for current phase
const fetchGradingStandard = async () => {
  if (!currentPhase.value) return;
  
  try {
    gradingStandard.value = await gradingStandardService.getBySubmissionType(currentPhase.value.phase);
  } catch (error) {
    console.warn('Failed to fetch grading standard:', error);
    gradingStandard.value = null;
  }
};

// Delete feedback
const deleteFeedback = async (feedbackId: string) => {
  if (!confirm('Are you sure you want to delete this feedback?')) {
    return;
  }

  deletingFeedbackId.value = feedbackId;
  try {
    await feedbackService.deleteFeedback(feedbackId);
    // Remove from feedback list
    feedback.value = feedback.value.filter(fb => fb._id !== feedbackId);
    console.log(`Feedback ${feedbackId} deleted successfully`);
  } catch (error: any) {
    console.error('Failed to delete feedback:', error);
    const errorCode = error.response?.data?.code;
    let errorMessage = 'Failed to delete feedback. Only the supervisor who created it can delete it.';
    
    if (errorCode === 'FEEDBACK_TOO_OLD') {
      errorMessage = 'Feedback cannot be deleted after 30 minutes of creation.';
    }
    
    alert(error.response?.data?.error || errorMessage);
  } finally {
    deletingFeedbackId.value = null;
  }
};

// Sync checkbox with current phase status
const currentPhaseIsDeclared = computed(() => currentPhase.value?.status === 'Declared Not Needed');

watch(() => submissionStore.selectedPhase, (phase) => {
  declarationError.value = null;
  // Fetch feedback for this submission
  if (phase?._id) {
    fetchFeedback();
  }
}, { immediate: true });

async function toggleDeclaration() {
  if (!currentPhase.value || declarationSubmitting.value) return;
  
  declarationSubmitting.value = true;
  declarationError.value = null;
  
  try {
    if (currentPhaseIsDeclared.value) {
      // Undo the declaration
      await submissionStore.undoDeclaration(currentPhase.value.phase);
    } else {
      // Submit new declaration
      const reason = 'This report is not required for my project as agreed with my supervisor.';
      await submissionStore.submitDeclaration(currentPhase.value.phase, reason);
    }
    
    // Refresh phases
    await submissionStore.fetchSubmissionPhases();
    const updated = submissionStore.phases.find(p => p.phase === currentPhase.value?.phase);
    if (updated) submissionStore.setSelectedPhase(updated);
  } catch (err: any) {
    declarationError.value = err.message || 'Failed to update declaration';
  } finally {
    declarationSubmitting.value = false;
  }
}

// Fetch submissions on mount
onMounted(async () => {
  if (submissionStore.phases.length === 0) {
    await submissionStore.fetchSubmissionPhases();
  }
  // Select first non-submitted phase, or first phase
  if (submissionStore.phases.length > 0 && !submissionStore.selectedPhase) {
    const pending = submissionStore.phases.find(p => p.status !== 'Submitted' && p.status !== 'Declared Not Needed');
    submissionStore.setSelectedPhase(pending ?? submissionStore.phases[0] ?? null);
  }
  // Load feedback and grading standard when phase is set
  if (submissionStore.selectedPhase) {
    await fetchFeedback();
    await fetchGradingStandard();
  }
});

const currentPhase = computed(() => submissionStore.selectedPhase);
const currentFiles = computed(() => currentPhase.value?.files ?? []);

// Watch for phase changes and fetch feedback and grading standard
watch(
  () => currentPhase.value,
  async (newPhase) => {
    if (newPhase) {
      await fetchFeedback();
      await fetchGradingStandard();
    }
  }
);

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function selectPhase(phase: any) {
  submissionStore.setSelectedPhase(phase);
}

function triggerFileInput() {
  fileInputRef.value?.click();
}

async function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length || !currentPhase.value) return;
  await doUpload(input.files[0]!);
  input.value = ''; // reset
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  const file = event.dataTransfer?.files?.[0];
  if (file && currentPhase.value) {
    doUpload(file);
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault();
}

async function doUpload(file: File) {
  if (!currentPhase.value) return;
  uploading.value = true;
  uploadError.value = null;
  uploadSuccess.value = null;
  try {
    await submissionStore.uploadFile(currentPhase.value.phase, file);
    uploadSuccess.value = `"${file.name}" uploaded successfully!`;
    // Refresh the phases list
    await submissionStore.fetchSubmissionPhases();
    // Re-select the current phase to get updated data
    const updated = submissionStore.phases.find(p => p.phase === currentPhase.value?.phase);
    if (updated) submissionStore.setSelectedPhase(updated);
  } catch (err: any) {
    uploadError.value = err.message || 'Upload failed';
  } finally {
    uploading.value = false;
  }
}

async function handleDownload(file: any) {
  if (!currentPhase.value) return;
  try {
    await submissionStore.triggerDownload(currentPhase.value.phase, file.filename, file.originalName);
  } catch (err: any) {
    console.error('Download failed:', err);
  }
}

async function handleDeleteFile(file: any) {
  if (!currentPhase.value) return;
  
  if (!confirm(`Are you sure you want to delete "${file.originalName}"?`)) {
    return;
  }

  deletingFile.value = file.filename;
  try {
    await submissionService.deleteSubmissionFile(currentPhase.value.phase, file.filename);
    
    // Refresh submission phases to get updated status and files
    await submissionStore.fetchSubmissionPhases();
    
    // Re-select the current phase to ensure it's updated
    const updatedPhase = submissionStore.phases.find(p => p.phase === currentPhase.value?.phase);
    if (updatedPhase) {
      submissionStore.setSelectedPhase(updatedPhase);
    }
    
    uploadSuccess.value = `"${file.originalName}" deleted successfully`;
    setTimeout(() => {
      uploadSuccess.value = null;
    }, 3000);
  } catch (err: any) {
    console.error('Delete failed:', err);
    uploadError.value = err.message || 'Failed to delete file';
  } finally {
    deletingFile.value = null;
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-3.25rem)] bg-slate-50 text-slate-900 flex">
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-20 bg-black/40 lg:hidden"
      aria-hidden="true"
      @click="sidebarOpen = false"
    />

    <aside
      class="fixed z-30 inset-y-0 left-0 w-64 transform bg-white border-r border-slate-200 transition-transform duration-200 ease-out
             lg:static lg:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
      aria-label="Student navigation"
    >
      <div class="flex h-14 items-center gap-2 px-4 border-b border-slate-200">
        <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 shadow-sm shadow-blue-500/40">
          <AcademicCapIcon
            class="h-5 w-5 text-white"
            aria-hidden="true"
          />
        </div>
        <div class="flex flex-col">
          <span class="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            Submissions
          </span>
          <span class="text-xs font-semibold text-slate-900">
            Progress Report
          </span>
        </div>
      </div>

      <nav
        class="mt-3 px-2 space-y-1 text-sm"
        aria-label="Primary"
      >
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-800 hover:text-slate-50"
          :class="activeView === 'submissions' ? 'bg-slate-800 text-slate-50' : 'text-slate-300'"
          @click="activeView = 'submissions'"
        >
          <DocumentArrowUpIcon class="h-5 w-5 text-slate-200" />
          <span class="flex-1 text-left">My Submissions</span>
        </button>
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-800 hover:text-slate-50"
          :class="activeView === 'checklist' ? 'bg-slate-800 text-slate-50' : 'text-slate-300'"
          @click="activeView = 'checklist'"
        >
          <ClipboardDocumentListIcon class="h-5 w-5" />
          <span class="flex-1 text-left">Submission checklist</span>
        </button>
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-slate-50"
          @click="goToDashboard"
        >
          <HomeIcon class="h-5 w-5 text-slate-300" />
          <span class="flex-1 text-left">Back to Dashboard</span>
        </button>
      </nav>
    </aside>

    <div class="flex-1 flex flex-col min-w-0">
      <header
        class="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur"
      >
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            aria-label="Toggle navigation"
            @click="sidebarOpen = !sidebarOpen"
          >
            <Bars3Icon
              class="h-6 w-6"
              aria-hidden="true"
            />
          </button>
          <nav
            class="flex items-center gap-1 text-[11px] text-slate-500"
            aria-label="Breadcrumb"
          >
            <button
              type="button"
              class="hover:text-slate-900"
              @click="goToDashboard"
            >
              My Submissions
            </button>
            <ChevronRightIcon class="h-3.5 w-3.5" />
            <button
              type="button"
              class="hover:text-slate-900"
            >
              Progress Report 1
            </button>
          </nav>
        </div>
        <div class="hidden sm:flex items-center gap-3 text-xs text-slate-500">
          <span class="rounded-full border border-slate-200 px-3 py-1 bg-slate-50">
            Draft saved locally
          </span>
        </div>
      </header>

      <main class="flex-1 px-4 sm:px-6 pb-6 pt-4 sm:pt-5">
        <!-- Submissions View -->
        <div v-if="activeView === 'submissions'">
        <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p class="text-xs uppercase tracking-[0.2em] text-slate-500">
              {{ currentPhase?.phase ?? 'Submission' }}
            </p>
            <h1 class="mt-1 text-sm sm:text-base font-semibold text-slate-900">
              {{ currentPhase?.phase ?? 'Select a phase' }}
              <template v-if="currentPhase?.topic_id?.title"> · {{ currentPhase.topic_id.title }}</template>
            </h1>
            <p class="mt-1 text-xs text-slate-500">
              <template v-if="currentPhase?.dueDate">Due {{ formatDate(currentPhase.dueDate) }}</template>
              <template v-else>Upload files and manage your submission.</template>
            </p>
          </div>
          <div class="flex flex-wrap gap-2 text-[11px] items-center">
            <span
              class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-medium text-[11px]"
              :class="{
                'border border-emerald-200 bg-emerald-50 text-emerald-700': currentPhase?.status === 'Submitted',
                'border border-amber-200 bg-amber-50 text-amber-700': currentPhase?.status === 'Overdue' || currentPhase?.status === 'Not Submitted',
                'border border-blue-200 bg-blue-50 text-blue-700': currentPhase?.status === 'Declared Not Needed',
              }"
            >
              <span
                class="h-1.5 w-1.5 rounded-full"
                :class="{
                  'bg-emerald-400': currentPhase?.status === 'Submitted',
                  'bg-amber-400': currentPhase?.status === 'Overdue' || currentPhase?.status === 'Not Submitted',
                  'bg-blue-400': currentPhase?.status === 'Declared Not Needed',
                }"
              />
              {{ currentPhase?.status ?? 'Unknown' }}
            </span>
            <button
              type="button"
              class="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50"
            >
              Download all as ZIP
            </button>
          </div>
        </header>

        <div class="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1.1fr)]">
          <section class="space-y-4">
            <section
              aria-labelledby="files-heading"
              class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70"
            >
              <header class="flex items-center justify-between gap-2">
                <div>
                  <h2
                    id="files-heading"
                    class="text-sm font-semibold text-slate-900"
                  >
                    Uploaded files
                  </h2>
                  <p class="mt-1 text-xs text-slate-500">
                    {{ currentFiles.length }} file(s) uploaded for this phase.
                  </p>
                </div>
                <CloudArrowUpIcon class="h-5 w-5 text-slate-500" />
              </header>

              <!-- Upload success/error messages -->
              <div v-if="uploadSuccess" class="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {{ uploadSuccess }}
              </div>
              <div v-if="uploadError" class="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {{ uploadError }}
              </div>

              <div
                class="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
                @click="triggerFileInput"
                @drop="handleDrop"
                @dragover="handleDragOver"
              >
                <input
                  ref="fileInputRef"
                  type="file"
                  class="hidden"
                  accept=".pdf,.docx,.doc,.zip,.pptx,.ppt,.xlsx,.xls"
                  @change="handleFileSelect"
                >
                <PaperClipIcon v-if="!uploading" class="h-6 w-6 text-slate-500" />
                <div v-else class="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                <p class="mt-2">
                  <template v-if="uploading">Uploading… {{ submissionStore.uploadProgress }}%</template>
                  <template v-else>
                    Drag and drop files here, or
                    <span class="text-blue-500 font-medium">browse</span>
                    from your device.
                  </template>
                </p>
                <p class="mt-1 text-[11px]">
                  PDF, DOCX, ZIP up to 50MB.
                </p>
              </div>

              <ul v-if="currentFiles.length > 0" class="mt-4 space-y-2 text-xs">
                <li
                  v-for="file in currentFiles"
                  :key="file.filename"
                  class="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  <div class="flex items-center gap-2">
                    <div
                      class="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-700"
                    >
                      <PaperClipIcon class="h-4 w-4" />
                    </div>
                    <div>
                      <p class="text-slate-900">
                        {{ file.originalName }}
                      </p>
                      <p class="text-[11px] text-slate-500">
                        {{ formatDate(file.uploadedAt) }} · {{ formatFileSize(file.size) }}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      class="inline-flex items-center rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] text-slate-700 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50"
                      @click="handleDownload(file)"
                    >
                      Download
                    </button>
                    <button
                      type="button"
                      :disabled="deletingFile === file.filename"
                      class="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] text-red-600 hover:border-red-500 hover:text-red-700 hover:bg-red-50 disabled:text-slate-400 disabled:hover:bg-white disabled:hover:border-slate-300 transition"
                      @click="handleDeleteFile(file)"
                      :title="`Delete ${file.originalName}`"
                    >
                      <TrashIcon class="h-3.5 w-3.5" />
                      {{ deletingFile === file.filename ? 'Deleting...' : 'Delete' }}
                    </button>
                  </div>
                </li>
              </ul>
              <p v-else class="mt-4 text-xs text-slate-500 text-center py-2">
                No files uploaded yet. Use the drop zone above to upload.
              </p>
            </section>

            <section
              aria-labelledby="feedback-heading"
              class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70"
            >
              <h2
                id="feedback-heading"
                class="text-sm font-semibold text-slate-900"
              >
                Supervisor Feedback
              </h2>

              <!-- Loading state -->
              <div v-if="feedbackLoading" class="mt-4 flex items-center justify-center gap-2">
                <div class="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"></div>
                <p class="text-xs text-slate-600">Loading feedback...</p>
              </div>

              <!-- No feedback yet -->
              <div v-else-if="feedback.length === 0" class="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <p class="text-xs text-amber-700">
                  No feedback provided yet. Your supervisor will leave comments after reviewing your submission.
                </p>
              </div>

              <!-- Display feedback -->
              <div v-else class="mt-4 space-y-3">
                <div
                  v-for="(fb, idx) in feedback"
                  :key="fb._id || idx"
                  class="rounded-lg border border-slate-200 bg-slate-50 p-3"
                >
                  <div class="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p class="text-xs font-semibold text-slate-900">{{ fb.supervisor_id?.fullName || 'Supervisor' }}</p>
                      <p class="text-[11px] text-slate-500">
                        {{ fb.createdAt ? new Date(fb.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' }}
                      </p>
                    </div>
                    <div class="flex items-center gap-2">
                      <span v-if="fb.grade" class="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        Grade: {{ fb.grade }} / {{ gradingStandard?.pointRange?.max || 20 }}
                      </span>
                      <!-- Delete button (only for supervisors) -->
                      <button
                        v-if="authStore.userRole === 'Supervisor'"
                        @click="deleteFeedback(fb._id)"
                        :disabled="deletingFeedbackId === fb._id"
                        class="inline-flex items-center rounded px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-100 bg-red-50 border border-red-200 disabled:opacity-50 transition-colors"
                        title="Delete feedback"
                      >
                        {{ deletingFeedbackId === fb._id ? 'Deleting...' : 'Delete' }}
                      </button>
                    </div>
                  </div>
                  <p class="text-xs text-slate-800 whitespace-pre-wrap">{{ fb.feedbackText }}</p>
                </div>
              </div>
            </section>

            <section
              aria-labelledby="declarations-heading"
              class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70"
            >
              <h2
                id="declarations-heading"
                class="text-sm font-semibold text-slate-900"
              >
                Declarations
              </h2>

              <!-- Already declared banner -->
              <div v-if="currentPhaseIsDeclared" class="mt-3 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                <CheckCircleIcon class="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p class="text-[11px] font-medium text-green-800">
                    Declared as not needed
                  </p>
                  <p v-if="currentPhase?.declarationReason" class="text-[10px] text-green-700 mt-0.5">
                    Reason: {{ currentPhase.declarationReason }}
                  </p>
                  <p v-if="currentPhase?.declaredAt" class="text-[10px] text-green-600 mt-0.5">
                    Declared on {{ formatDate(currentPhase.declaredAt) }}
                  </p>
                </div>
              </div>

              <!-- Declaration button (only for students, only if not already submitted) -->
              <div v-if="isStudent && currentPhase?.status !== 'Submitted'" class="mt-4">
                <p class="text-[11px] text-slate-700 mb-3">
                  If this report is not required for your project as agreed with your supervisor, you can declare it as not needed.
                </p>
                <button
                  :disabled="declarationSubmitting"
                  @click="toggleDeclaration"
                  :class="[
                    'inline-flex items-center justify-center px-4 py-2 text-[12px] font-medium rounded-lg border transition-colors',
                    currentPhaseIsDeclared 
                      ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-400' 
                      : 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-400',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  ]"
                >
                  <span v-if="!declarationSubmitting">
                    {{ currentPhaseIsDeclared ? 'Undo Declaration' : 'Declare as Not Needed' }}
                  </span>
                  <span v-else>{{ currentPhaseIsDeclared ? 'Undoing...' : 'Submitting...' }}</span>
                </button>
              </div>
              <p v-if="declarationError" class="mt-2 text-[11px] text-red-600">{{ declarationError }}</p>
            </section>
          </section>
        </div>
        </div>

        <!-- Checklist View -->
        <div v-else-if="activeView === 'checklist'">
          <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <p class="text-xs uppercase tracking-[0.2em] text-slate-500">
                Submission Tracking
              </p>
              <h1 class="mt-1 text-sm sm:text-base font-semibold text-slate-900">
                All Submission Phases
              </h1>
              <p class="mt-1 text-xs text-slate-500">
                Track the status and deadlines of all your dissertation submission phases.
              </p>
            </div>
          </header>

          <section class="space-y-3">
            <div
              v-for="phase in submissionStore.phases"
              :key="phase._id"
              class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70 hover:border-blue-300 hover:shadow-md hover:shadow-blue-100 cursor-pointer transition-all"
              @click="selectPhase(phase); activeView = 'submissions'"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <h3 class="font-semibold text-slate-900">{{ phase.phase }}</h3>
                  <div class="mt-2 grid grid-cols-2 gap-3 text-xs text-slate-600">
                    <div>
                      <p class="text-slate-500">Due Date</p>
                      <p class="font-medium text-slate-900">{{ phase.dueDate ? formatDate(phase.dueDate) : 'TBD' }}</p>
                    </div>
                    <div>
                      <p class="text-slate-500">Submitted</p>
                      <p class="font-medium text-slate-900">{{ phase.submittedAt ? formatDate(phase.submittedAt) : 'Not submitted' }}</p>
                    </div>
                  </div>
                </div>
                <div class="flex flex-col items-end gap-2">
                  <span
                    class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                    :class="{
                      'bg-emerald-50 text-emerald-700 border border-emerald-200': phase.status === 'Submitted',
                      'bg-amber-50 text-amber-700 border border-amber-200': phase.status === 'Overdue',
                      'bg-blue-50 text-blue-700 border border-blue-200': phase.status === 'Not Submitted',
                      'bg-slate-100 text-slate-600 border border-slate-200': phase.status === 'Declared Not Needed',
                    }"
                  >
                    <span
                      class="h-2 w-2 rounded-full"
                      :class="{
                        'bg-emerald-500': phase.status === 'Submitted',
                        'bg-amber-500': phase.status === 'Overdue',
                        'bg-blue-500': phase.status === 'Not Submitted',
                        'bg-slate-400': phase.status === 'Declared Not Needed',
                      }"
                    />
                    {{ phase.status }}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  </div>
</template>

