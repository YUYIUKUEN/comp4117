<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  ArrowLeftIcon,
  CheckIcon,
  ShieldExclamationIcon,
} from '@heroicons/vue/24/outline';
import { getSupervisorSubmissionById } from '../services/submissionService';
import gradingStandardService from '../services/gradingStandardService';
import type { GradingStandard } from '../services/gradingStandardService';
import feedbackService from '../services/feedbackService';

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

    // Fetch grading standard for this submission's phase
    const standards = await gradingStandardService.getAll(true);
    applicableStandard.value = standards.find(
      (s) => s.submissionType === submission.value.phase
    ) || null;

    // Fetch existing feedback for this submission
    try {
      existingFeedback.value = await feedbackService.getSubmissionFeedback(submissionId);
      
      // Pre-populate form fields if feedback exists
      if (existingFeedback.value.length > 0) {
        const feedback = existingFeedback.value[0];
        feedbackText.value = feedback.feedbackText || '';
        selectedGrade.value = feedback.grade || '';
        pointsInput.value = parseFloat(feedback.grade) || undefined;
        internalNote.value = feedback.internalNote || '';
      }
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
    const gradeValue = applicableStandard.value?.gradingSystem === 'point-range'
      ? String(pointsInput.value)
      : selectedGrade.value;

    const feedbackData = {
      feedbackText: feedbackText.value.trim(),
      grade: gradeValue || undefined,
      gradingStandard_id: applicableStandard.value?._id || undefined,
      internalNote: internalNote.value.trim() || undefined,
    };

    // If editing existing feedback, update it; otherwise create new
    if (existingFeedback.value.length > 0) {
      await feedbackService.updateFeedback(existingFeedback.value[0]._id, feedbackData);
    } else {
      await feedbackService.addFeedback(submissionId, feedbackData);
    }

    alert('Feedback and grade saved successfully!');
    // Navigate back to feedback & grading page with a refresh
    router.push('/supervisor/feedback-grading');
  } catch (e: any) {
    saveError.value = e?.response?.data?.error || 'Failed to save feedback';
  } finally {
    isSaving.value = false;
  }
};

const handleCancel = () => {
  router.back();
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
        <p class="text-sm font-semibold text-slate-900">{{ existingFeedback.length > 0 ? 'Edit Feedback & Grade' : 'Add Feedback & Grade' }}</p>
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
          </div>

          <!-- Files -->
          <div v-if="submission.files?.length" class="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 class="text-sm font-semibold text-slate-900 mb-2">Submitted Files:</h3>
            <ul class="space-y-1">
              <li v-for="file in submission.files" :key="file.filename" class="text-sm text-slate-700">
                {{ file.originalName }} ({{ (file.size / 1024).toFixed(1) }} KB)
              </li>
            </ul>
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
          <h3 class="text-lg font-semibold text-slate-900 mb-4">Provide Feedback{{ applicableStandard ? ' & Grade' : '' }}</h3>

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

        <!-- Grade Input - Point Range -->
        <div v-if="applicableStandard?.gradingSystem === 'point-range'" class="mb-6">
          <label class="block text-sm font-medium text-slate-900 mb-2">
            Points *
          </label>
          <div class="flex gap-2 items-end">
            <input
              v-model.number="pointsInput"
              type="number"
              :min="applicableStandard.pointRange?.min"
              :max="applicableStandard.pointRange?.max"
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
            {{ isSaving ? 'Saving...' : existingFeedback.length > 0 ? (applicableStandard ? 'Update Feedback & Grade' : 'Update Feedback') : (applicableStandard ? 'Save Feedback & Grade' : 'Save Feedback') }}
          </button>
          <button
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
        <div v-for="fb in existingFeedback" :key="fb._id" class="mb-4 last:mb-0 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <p class="text-sm text-slate-700 whitespace-pre-wrap">{{ fb.feedbackText }}</p>
          <div class="mt-2 flex items-center gap-3 text-xs text-slate-500">
            <span>{{ new Date(fb.createdAt).toLocaleDateString() }}</span>
            <span v-if="fb.grade" class="font-semibold text-blue-600">Grade: {{ fb.grade }}</span>
          </div>
        </div>
      </div>

      <!-- Internal Note for Admin Card -->
      <div class="rounded-xl border-2 border-amber-400 bg-amber-50/50 p-4 sm:p-5 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <ShieldExclamationIcon class="h-5 w-5 text-amber-600" />
          <h3 class="text-lg font-semibold text-amber-900">Internal Note for Admin</h3>
        </div>
        <p class="text-xs text-amber-700 mb-3">
          This note is <strong>only visible to you and the admin</strong>. Students will never see this.
          Use it to communicate concerns, special circumstances, or internal remarks about this student's work.
        </p>
        <textarea
          v-model="internalNote"
          placeholder="E.g. Student may need additional support with methodology. Recommend follow-up meeting with programme coordinator..."
          class="block w-full rounded-lg border border-amber-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-amber-400/70 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
          rows="4"
        ></textarea>
      </div>
      </template>
    </main>
  </div>
</template>

<style scoped>
</style>
