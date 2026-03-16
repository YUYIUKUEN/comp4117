<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  ArrowLeftIcon,
  CheckIcon,
  ShieldExclamationIcon,
  ArrowDownTrayIcon,
} from '@heroicons/vue/24/outline';
import { getSupervisorSubmissionById, downloadSupervisorFile } from '../services/submissionService';
import gradingStandardService from '../services/gradingStandardService';
import type { GradingStandard } from '../services/gradingStandardService';
import feedbackService from '../services/feedbackService';
import httpClient from '../services/httpClient';

const router = useRouter();
const route = useRoute();

const submissionId = route.query.id as string;

// State
const submission = ref<any>(null);
const applicableStandard = ref<GradingStandard | null>(null);
const existingFeedback = ref<any[]>([]);
const isLoading = ref(true);
const loadError = ref('');

const feedbackText = ref('');
const selectedGrade = ref('');
const pointsInput = ref<number | string>('');
const isSaving = ref(false);
const saveError = ref('');
const internalNote = ref('');

// Rubric grading state - map of criterion index to selected level index
const selectedRubricLevels = ref<Map<number, number>>(new Map());

// Autosave state for internal note
const internalNoteAutoSaveStatus = ref<'unsaved' | 'saving' | 'saved'>('saved');
const internalNoteSaveError = ref('');
let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;

// Reply state - per feedback
const replyingToFeedbackId = ref<string | null>(null);
const replyText = ref('');
const submittingReply = ref(false);

// Delete state
const isDeletingFeedback = ref(false);

// Download state
const downloadingFile = ref<string | null>(null);

// Edit state
const editingFeedbackId = ref<string | null>(null);

// Autosave function for internal note
const autoSaveInternalNote = async () => {
  if (!editingFeedbackId.value) return;
  
  internalNoteAutoSaveStatus.value = 'saving';
  internalNoteSaveError.value = '';
  
  try {
    // Only send the internal note field to avoid conflicts
    await httpClient.put(`/feedback/${editingFeedbackId.value}`, {
      internalNote: internalNote.value.trim(),
    });
    internalNoteAutoSaveStatus.value = 'saved';
  } catch (e: any) {
    internalNoteSaveError.value = e?.response?.data?.error || 'Failed to save note';
    internalNoteAutoSaveStatus.value = 'unsaved';
  }
};

// Debounced autosave watcher
watch(internalNote, () => {
  if (!editingFeedbackId.value) return;
  
  internalNoteAutoSaveStatus.value = 'unsaved';
  internalNoteSaveError.value = '';
  
  if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
  
  autoSaveTimeout = setTimeout(() => {
    autoSaveInternalNote();
  }, 2000); // Autosave 2 seconds after user stops typing
});

// Fetch data
onMounted(async () => {
  if (!submissionId) {
    loadError.value = 'No submission ID provided';
    isLoading.value = false;
    return;
  }

  try {
    isLoading.value = true;

    // Fetch submission details
    submission.value = await getSupervisorSubmissionById(submissionId);

    // Fetch grading standard for this submission's phase using optimized endpoint
    // This is more efficient than calling getAll() to fetch all standards
    applicableStandard.value = await gradingStandardService.getBySubmissionType(submission.value.phase);

    // If no standard found, that's okay - supervisor can provide feedback without grading
    if (!applicableStandard.value) {
      console.log(`No active grading standard for phase: ${submission.value.phase}`);
    }

    // Fetch existing feedback for this submission
    try {
      existingFeedback.value = await feedbackService.getSubmissionFeedback(submissionId);
    } catch {
      // No feedback yet — that's fine
    }
  } catch (e: any) {
    loadError.value = e?.response?.data?.error || 'Failed to load submission';
  } finally {
    isLoading.value = false;
  }
});

// Validation
const isValid = computed(() => {
  if (!feedbackText.value.trim()) return false;
  
  // If no grading standard, just need feedback text
  if (!applicableStandard.value) return true;

  // Rubric-based grading: all criteria must have a selected level
  if (applicableStandard.value.rubricItems && applicableStandard.value.rubricItems.length > 0) {
    const rubricItemCount = applicableStandard.value.rubricItems.filter(item => item.levels && item.levels.length > 0).length;
    const selectedCount = selectedRubricLevels.value.size;
    return selectedCount === rubricItemCount;
  }

  if (applicableStandard.value.gradingSystem === 'point-range') {
    const points = parseFloat(String(pointsInput.value));
    const min = applicableStandard.value.pointRange?.min || 0;
    const max = applicableStandard.value.pointRange?.max || 100;
    return !isNaN(points) && points >= min && points <= max;
  }

  if (applicableStandard.value.gradingSystem === 'letter-grade') {
    return applicableStandard.value.letterGrades?.includes(selectedGrade.value) || false;
  }

  if (applicableStandard.value.gradingSystem === 'custom') {
    return applicableStandard.value.customOptions?.includes(selectedGrade.value) || false;
  }

  return true;
});

const handleSaveFeedback = async () => {
  if (!feedbackText.value.trim()) {
    alert('Please add feedback');
    return;
  }

  isSaving.value = true;
  saveError.value = '';

  try {
    let gradeValue = '';

    // Handle rubric-based grading
    if (applicableStandard.value?.rubricItems && applicableStandard.value.rubricItems.length > 0) {
      let totalPoints = 0;
      applicableStandard.value.rubricItems.forEach((item, index) => {
        const selectedLevelIndex = selectedRubricLevels.value.get(index);
        if (selectedLevelIndex !== undefined && item.levels && item.levels[selectedLevelIndex]) {
          const level = item.levels[selectedLevelIndex];
          if (level.points !== undefined) {
            totalPoints += level.points;
          }
        }
      });
      gradeValue = String(totalPoints);
    } else {
      // Handle other grading systems
      gradeValue = applicableStandard.value?.gradingSystem === 'point-range'
        ? String(pointsInput.value)
        : selectedGrade.value;
    }

    const feedbackData = {
      feedbackText: feedbackText.value.trim(),
      grade: gradeValue || undefined,
      gradingStandard_id: applicableStandard.value?._id || undefined,
      rubricSelections: selectedRubricLevels.value.size > 0 ? Object.fromEntries(selectedRubricLevels.value) : undefined,
      internalNote: internalNote.value.trim() || undefined,
    };

    // If editing existing feedback, update it; otherwise create new
    if (editingFeedbackId.value) {
      await feedbackService.updateFeedback(editingFeedbackId.value, feedbackData);
      // Update the feedback in the list
      const index = existingFeedback.value.findIndex(fb => fb._id === editingFeedbackId.value);
      if (index !== -1) {
        existingFeedback.value[index] = { ...existingFeedback.value[index], ...feedbackData };
      }
      editingFeedbackId.value = null;
    } else {
      const newFeedback = await feedbackService.addFeedback(submissionId, feedbackData);
      existingFeedback.value.push(newFeedback);
    }

    alert('Feedback and grade saved successfully!');
    handleClearForm();
  } catch (e: any) {
    saveError.value = e?.response?.data?.error || 'Failed to save feedback';
  } finally {
    isSaving.value = false;
  }
};

const handleCancel = () => {
  router.back();
};

const handleEditFeedback = (feedback: any) => {
  editingFeedbackId.value = feedback._id;
  feedbackText.value = feedback.feedbackText || '';
  selectedGrade.value = feedback.grade || '';
  pointsInput.value = parseFloat(feedback.grade) || '';
  internalNote.value = feedback.internalNote || '';
  // Scroll to form
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleClearForm = () => {
  feedbackText.value = '';
  selectedGrade.value = '';
  pointsInput.value = '';
  internalNote.value = '';
  selectedRubricLevels.value.clear();
  editingFeedbackId.value = null;
  replyingToFeedbackId.value = null;
  replyText.value = '';
};

// Rubric helper functions
const selectRubricLevel = (criterionIndex: number, levelIndex: number) => {
  selectedRubricLevels.value.set(criterionIndex, levelIndex);
};

const isRubricLevelSelected = (criterionIndex: number, levelIndex: number): boolean => {
  return selectedRubricLevels.value.get(criterionIndex) === levelIndex;
};

const calculateRubricTotal = (): number => {
  let total = 0;
  if (applicableStandard.value?.rubricItems) {
    applicableStandard.value.rubricItems.forEach((item, index) => {
      const selectedLevelIndex = selectedRubricLevels.value.get(index);
      if (selectedLevelIndex !== undefined && item.levels && item.levels[selectedLevelIndex]) {
        const level = item.levels[selectedLevelIndex];
        if (level.points !== undefined) {
          total += level.points;
        }
      }
    });
  }
  return total;
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const avatarUrl = (name: string, bg = '0F172A') => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff`;
};

const toggleReplying = (feedbackId: string) => {
  if (replyingToFeedbackId.value === feedbackId) {
    replyingToFeedbackId.value = null;
    replyText.value = '';
  } else {
    replyingToFeedbackId.value = feedbackId;
    replyText.value = '';
  }
};

const submitReply = async (feedbackId: string) => {
  if (!replyText.value.trim() || submittingReply.value) return;

  submittingReply.value = true;
  try {
    const newReply = await feedbackService.replyToFeedback(feedbackId, replyText.value.trim());
    
    // Update the feedback with the new reply
    const feedback = existingFeedback.value.find(f => f._id === feedbackId);
    if (feedback) {
      if (!feedback.replies) {
        feedback.replies = [];
      }
      feedback.replies.push(newReply);
    }
    
    replyingToFeedbackId.value = null;
    replyText.value = '';
  } catch (error: any) {
    console.error('Reply error:', error);
    alert('Failed to submit reply. Please try again.');
  } finally {
    submittingReply.value = false;
  }
};

const handleDeleteFeedback = async (feedbackId: string) => {
  if (!confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
    return;
  }

  isDeletingFeedback.value = true;
  try {
    await feedbackService.deleteFeedback(feedbackId);
    alert('Feedback deleted successfully!');
    // Remove deleted feedback from the list instead of navigating away
    existingFeedback.value = existingFeedback.value.filter(fb => fb._id !== feedbackId);
  } catch (error: any) {
    console.error('Failed to delete feedback:', error);
    const errorCode = error.response?.data?.code;
    let errorMessage = 'Failed to delete feedback. Only the supervisor who created it can delete it.';
    
    if (errorCode === 'FEEDBACK_TOO_OLD') {
      errorMessage = 'Feedback cannot be deleted after 30 minutes of creation.';
    }
    
    alert(error.response?.data?.error || errorMessage);
  } finally {
    isDeletingFeedback.value = false;
  }
};

const handleAddNewFeedback = () => {
  // Clear form fields to prepare for adding new feedback
  feedbackText.value = '';
  selectedGrade.value = '';
  pointsInput.value = '';
  internalNote.value = '';
  replyingToFeedbackId.value = null;
  replyText.value = '';
};

const handleDownloadFile = async (file: any) => {
  downloadingFile.value = file.filename;
  try {
    const studentId = submission.value.student_id._id;
    const phase = submission.value.phase;
    const blob = await downloadSupervisorFile(studentId, phase, file.filename);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    console.error('Download error:', error);
    alert('Failed to download file. Please try again.');
  } finally {
    downloadingFile.value = null;
  }
};
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <header class="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur">
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        @click="handleCancel"
      >
        <ArrowLeftIcon class="h-6 w-6" />
      </button>
      <div>
        <p class="text-[11px] uppercase tracking-[0.2em] text-slate-500">Feedback Form</p>
        <p class="text-sm font-semibold text-slate-900">{{ editingFeedbackId ? 'Edit Feedback & Grade' : 'Add Feedback & Grade' }}</p>
      </div>
      <button
        @click="router.push('/supervisor')"
        class="ml-auto text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-2 rounded hover:bg-blue-50"
      >
        Back to Menu
      </button>
    </header>

    <main class="max-w-4xl mx-auto px-4 sm:px-6 pb-6 pt-4 sm:pt-5">
      <!-- Loading -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <span class="loading loading-spinner loading-md text-blue-600"></span>
        <span class="ml-2 text-sm text-slate-600">Loading submission...</span>
      </div>

      <!-- Load Error -->
      <div v-else-if="loadError" class="rounded-xl border border-red-200 bg-red-50 p-5 text-center">
        <p class="text-sm font-medium text-red-700">{{ loadError }}</p>
        <button @click="router.back()" class="mt-3 text-sm text-blue-600 hover:underline">Go Back</button>
      </div>

      <template v-else-if="submission">
        <!-- Save Error -->
        <div v-if="saveError" class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {{ saveError }}
        </div>

        <!-- Submission Details -->
        <div class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm mb-6">
          <div class="mb-4">
            <p class="text-xs font-semibold text-blue-600 uppercase tracking-wide">{{ submission.phase }}</p>
            <h2 class="text-lg font-semibold text-slate-900 mt-2">{{ submission.student_id?.fullName || 'Unknown Student' }}</h2>
            <p class="text-sm text-slate-600 mt-1">{{ submission.topic_id?.title || 'Unknown Topic' }}</p>
            <p class="text-xs text-slate-500 mt-2">Submitted: {{ submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : 'Not yet' }}</p>
            <div v-if="editingFeedbackId" class="mt-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 font-medium">✎ Editing feedback</div>
          </div>

          <!-- Files -->
          <div v-if="submission.files?.length" class="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 class="text-sm font-semibold text-slate-900 mb-2">Submitted Files:</h3>
            <div class="space-y-2">
              <div v-for="file in submission.files" :key="file.filename" class="flex items-center justify-between">
                <span class="text-sm text-slate-700">
                  {{ file.originalName }} ({{ (file.size / 1024).toFixed(1) }} KB)
                </span>
                <button
                  type="button"
                  @click="handleDownloadFile(file)"
                  :disabled="downloadingFile === file.filename"
                  class="inline-flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 disabled:text-slate-400 disabled:hover:bg-transparent rounded transition"
                  :title="`Download ${file.originalName}`"
                >
                  <ArrowDownTrayIcon class="h-4 w-4" />
                  {{ downloadingFile === file.filename ? 'Downloading...' : 'Download' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Info: No Grading Standard -->
        <div v-if="!applicableStandard" class="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 sm:p-5 mb-6">
          <h3 class="text-sm font-semibold text-amber-900 mb-2">No Grading Standard Configured</h3>
          <p class="text-sm text-amber-800">
            The administrator has not set up a grading standard for "{{ submission.phase }}".
            You can still provide feedback without a grade, or contact the admin to configure the grading standard.
          </p>
        </div>

        <!-- Feedback & Grading Form -->
        <div class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm mb-6">
          <h3 class="text-lg font-semibold text-slate-900 mb-4">{{ editingFeedbackId ? 'Edit' : 'Add' }} Feedback{{ applicableStandard ? ' & Grade' : '' }}</h3>

          <!-- Grading Standard Info -->
          <div v-if="applicableStandard" class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p class="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Grading Standard</p>
            <p class="text-sm text-slate-900 font-medium">{{ applicableStandard.submissionType }}</p>
            <p v-if="applicableStandard.description" class="text-xs text-slate-600 mt-1">
              {{ applicableStandard.description }}
            </p>
          </div>

        <!-- Feedback Text -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-slate-900 mb-2">
            Feedback Comments *
          </label>
          <textarea
            v-model="feedbackText"
            placeholder="Write your detailed feedback here... Include strengths, areas for improvement, and suggestions."
            class="block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
            rows="6"
          ></textarea>
        </div>

        <!-- Grade Input - Rubric-based -->
        <div v-if="applicableStandard?.rubricItems && applicableStandard.rubricItems.length > 0" class="mb-6">
          <label class="block text-sm font-medium text-slate-900 mb-4">
            Performance Assessment (Rubric) *
          </label>
          <div class="space-y-6">
            <div
              v-for="(criterion, criterionIndex) in applicableStandard.rubricItems"
              :key="criterionIndex"
              class="border border-slate-200 rounded-lg p-4 bg-slate-50"
            >
              <!-- Criterion header -->
              <div class="mb-4">
                <h4 class="font-semibold text-slate-900">{{ criterion.title }}</h4>
                <p v-if="criterion.description" class="text-sm text-slate-600 mt-1">
                  {{ criterion.description }}
                </p>
              </div>

              <!-- Performance levels as clickable buttons -->
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                <button
                  v-for="(level, levelIndex) in (criterion.levels || [])"
                  :key="levelIndex"
                  @click="selectRubricLevel(criterionIndex, levelIndex)"
                  type="button"
                  :class="[
                    'px-3 py-4 rounded-lg border-2 transition text-center',
                    isRubricLevelSelected(criterionIndex, levelIndex)
                      ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500/50'
                      : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50'
                  ]"
                >
                  <div v-if="level.name" class="font-semibold text-sm text-slate-900">{{ level.name }}</div>
                  <div :class="['text-xs text-slate-600', level.name ? 'mt-1' : '']">{{ level.description }}</div>
                  <div class="text-xs font-semibold text-blue-600 mt-1">{{ level.points }} pts</div>
                </button>
              </div>
            </div>
          </div>

          <!-- Rubric total score -->
          <div class="mt-4 p-3 bg-white border border-slate-200 rounded-lg">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-slate-700">Rubric Total Points:</span>
              <span class="text-lg font-bold text-blue-600">{{ calculateRubricTotal() }} pts</span>
            </div>
          </div>
        </div>

        <!-- Grade Input - Point Range -->
        <div v-if="applicableStandard?.gradingSystem === 'point-range' && (!applicableStandard.rubricItems || applicableStandard.rubricItems.length === 0)" class="mb-6">
          <label class="block text-sm font-medium text-slate-900 mb-2">
            Points * (supports 0.5 increments)
          </label>
          <div class="flex gap-2 items-end">
            <input
              v-model.number="pointsInput"
              type="number"
              :min="applicableStandard.pointRange?.min"
              :max="applicableStandard.pointRange?.max"
              :step="applicableStandard.pointRange?.step || 0.5"
              :placeholder="`Enter points (${applicableStandard.pointRange?.min} - ${applicableStandard.pointRange?.max})`"
              class="block flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/60"
            />
            <div class="px-4 py-2 bg-slate-100 rounded-lg border border-slate-300 font-medium text-slate-600 whitespace-nowrap">
              / {{ applicableStandard.pointRange?.max }}
            </div>
          </div>
          <p v-if="pointsInput && Number(pointsInput) >= (applicableStandard.pointRange?.min || 0) && Number(pointsInput) <= (applicableStandard.pointRange?.max || 100)" 
            class="text-xs text-slate-600 mt-2">
            Percentage: <span class="font-semibold text-blue-600">{{ ((Number(pointsInput) / (applicableStandard.pointRange?.max || 100)) * 100).toFixed(1) }}%</span>
          </p>
          <p v-if="pointsInput && (Number(pointsInput) < (applicableStandard.pointRange?.min || 0) || Number(pointsInput) > (applicableStandard.pointRange?.max || 100))" 
            class="text-xs text-red-600 mt-2">
            Invalid: Must be between {{ applicableStandard.pointRange?.min }} - {{ applicableStandard.pointRange?.max }}
          </p>
        </div>

        <!-- Grade Input - Letter Grade -->
        <div v-else-if="applicableStandard?.gradingSystem === 'letter-grade'" class="mb-6">
          <label class="block text-sm font-medium text-slate-900 mb-3">
            Grade *
          </label>
          <div class="grid grid-cols-5 gap-2">
            <button
              v-for="grade in applicableStandard.letterGrades"
              :key="grade"
              @click="selectedGrade = grade"
              type="button"
              :class="[
                'py-2 px-1 rounded-lg font-semibold text-sm transition',
                selectedGrade === grade
                  ? 'bg-blue-600 text-white border border-blue-600'
                  : 'border border-slate-300 bg-white text-slate-900 hover:border-blue-500 hover:bg-blue-50'
              ]"
            >
              {{ grade }}
            </button>
          </div>
        </div>

        <!-- Grade Input - Custom Options -->
        <div v-else-if="applicableStandard?.gradingSystem === 'custom'" class="mb-6">
          <label class="block text-sm font-medium text-slate-900 mb-3">
            Grade *
          </label>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              v-for="option in applicableStandard.customOptions"
              :key="option"
              @click="selectedGrade = option"
              type="button"
              :class="[
                'py-2 px-3 rounded-lg font-medium text-sm transition',
                selectedGrade === option
                  ? 'bg-blue-600 text-white border border-blue-600'
                  : 'border border-slate-300 bg-white text-slate-900 hover:border-blue-500 hover:bg-blue-50'
              ]"
            >
              {{ option }}
            </button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3">
          <button
            @click="handleSaveFeedback"
            :disabled="isSaving || !isValid"
            class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckIcon class="h-5 w-5" />
            {{ isSaving ? 'Saving...' : editingFeedbackId ? (applicableStandard ? 'Update Feedback & Grade' : 'Update Feedback') : (applicableStandard ? 'Save Feedback & Grade' : 'Save Feedback') }}
          </button>
          <button
            v-if="editingFeedbackId"
            @click="handleClearForm"
            class="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel Edit
          </button>
          <button
            v-else
            @click="handleCancel"
            class="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>

      <!-- Existing Feedback -->
      <div v-if="existingFeedback.length > 0" class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm mb-6">
        <h3 class="text-lg font-semibold text-slate-900 mb-4">Previous Feedback</h3>
        <div v-for="fb in existingFeedback" :key="fb._id" class="mb-4 last:mb-0 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <!-- Feedback header with edit and delete buttons -->
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="flex-1">
              <!-- Feedback text and details -->
              <p class="text-sm text-slate-700 whitespace-pre-wrap">{{ fb.feedbackText }}</p>
              <div class="mt-2 flex items-center gap-3 text-xs text-slate-500">
                <span>{{ formatDate(fb.createdAt) }}</span>
                <span v-if="fb.grade" class="font-semibold text-blue-600">Grade: {{ fb.grade }}</span>
              </div>
            </div>
            <div class="flex-shrink-0 flex gap-2">
              <button
                @click="handleEditFeedback(fb)"
                class="inline-flex items-center rounded-lg px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 bg-blue-50 border border-blue-200 transition-colors"
                title="Edit this feedback"
              >
                Edit
              </button>
              <button
                @click="handleDeleteFeedback(fb._id)"
                :disabled="isDeletingFeedback"
                class="inline-flex items-center rounded-lg px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 bg-red-50 border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Delete this feedback"
              >
                {{ isDeletingFeedback ? 'Deleting...' : 'Delete' }}
              </button>
            </div>
          </div>

          <!-- Student Replies with inline reply form -->
          <div class="mt-4 space-y-3 border-t border-slate-200 pt-3">
            <!-- Student replies list -->
            <div v-if="fb.replies?.length" class="space-y-2">
              <p class="text-xs font-semibold uppercase text-slate-500 tracking-wide">Student Replies</p>
              <div
                v-for="reply in fb.replies"
                :key="reply._id"
                class="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3"
              >
                <img
                  :src="avatarUrl(reply.user_id?.fullName || 'U', reply.user_id?.role === 'Supervisor' ? '7C3AED' : '3B82F6')"
                  class="h-7 w-7 rounded-full mt-0.5 flex-shrink-0"
                >
                <div class="min-w-0 flex-1">
                  <p class="text-xs">
                    <span class="font-medium text-slate-900">{{ reply.user_id?.fullName ?? 'User' }}</span>
                    <span class="text-slate-400 ml-2">{{ formatDate(reply.createdAt) }}</span>
                  </p>
                  <p class="mt-0.5 text-xs text-slate-600 leading-relaxed">{{ reply.replyText }}</p>
                </div>
              </div>
            </div>

            <!-- Reply button and form -->
            <div v-if="replyingToFeedbackId !== fb._id" class="pt-2">
              <button
                @click="toggleReplying(fb._id)"
                class="inline-flex items-center rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition"
              >
                Reply to Student
              </button>
            </div>

            <!-- Reply form -->
            <div v-if="replyingToFeedbackId === fb._id" class="pt-2 space-y-2">
              <textarea
                v-model="replyText"
                rows="3"
                placeholder="Write your reply to the student…"
                class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              ></textarea>
              <div class="flex gap-2 justify-end">
                <button
                  @click="submitReply(fb._id)"
                  :disabled="!replyText.trim() || submittingReply"
                  class="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {{ submittingReply ? 'Sending…' : 'Send Reply' }}
                </button>
                <button
                  @click="toggleReplying(fb._id)"
                  class="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Internal Note for Admin Card -->
      <div class="rounded-xl border-2 border-amber-400 bg-amber-50/50 p-4 sm:p-5 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <ShieldExclamationIcon class="h-5 w-5 text-amber-600" />
          <h3 class="text-lg font-semibold text-amber-900">Internal Note for Admin</h3>
          <!-- Autosave Status Indicator -->
          <div v-if="editingFeedbackId" class="ml-auto flex items-center gap-1.5 text-xs">
            <span
              v-if="internalNoteAutoSaveStatus === 'unsaved'"
              class="text-amber-600 font-medium"
            >
              Unsaved
            </span>
            <span
              v-else-if="internalNoteAutoSaveStatus === 'saving'"
              class="text-amber-600 font-medium flex items-center gap-1"
            >
              <span class="inline-block w-1.5 h-1.5 bg-amber-600 rounded-full animate-pulse"></span>
              Saving...
            </span>
            <span
              v-else
              class="text-green-600 font-medium flex items-center gap-1"
            >
              <CheckIcon class="h-3.5 w-3.5" />
              Saved
            </span>
          </div>
        </div>
        <p class="text-xs text-amber-700 mb-3">
          This note is <strong>only visible to you and the admin</strong>. Students will never see this.
          Use it to communicate concerns, special circumstances, or internal remarks about this student's work.
          <span v-if="editingFeedbackId" class="block mt-1.5 font-semibold text-green-700">
            💾 Autosave enabled — changes are saved automatically after you stop typing
          </span>
        </p>
        <textarea
          v-model="internalNote"
          placeholder="E.g. Student may need additional support with methodology. Recommend follow-up meeting with programme coordinator..."
          class="block w-full rounded-lg border border-amber-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-amber-400/70 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
          rows="4"
        ></textarea>
        <!-- Error message for autosave -->
        <div v-if="internalNoteSaveError" class="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <p class="text-xs text-red-700">{{ internalNoteSaveError }}</p>
        </div>
      </div>
      </template>
    </main>
  </div>
</template>

<style scoped>
</style>
