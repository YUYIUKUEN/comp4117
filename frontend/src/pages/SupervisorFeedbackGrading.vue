<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  PencilIcon,
  DocumentTextIcon,
} from '@heroicons/vue/24/outline';
import httpClient from '@/services/httpClient';

interface SubmissionItem {
  _id: string;
  student_id: { _id: string; fullName: string; email: string } | null;
  topic_id: { _id: string; title: string } | null;
  phase: string;
  status: string;
  submittedAt: string | null;
  dueDate: string | null;
  files: Array<{ filename: string; originalName: string; size: number }>;
  feedbacks: Array<{ _id: string; feedbackText: string; createdAt: string }>;
}

const router = useRouter();
const submissions = ref<SubmissionItem[]>([]);
const isLoading = ref(false);
const errorMessage = ref('');

const fetchSubmissions = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';
    const response = await httpClient.get('/submissions/supervisor/submissions');
    const subs = response.data.data || [];

    // For each submission, fetch its feedback
    const subsWithFeedback: SubmissionItem[] = [];
    for (const sub of subs) {
      let feedbacks: any[] = [];
      try {
        const fbRes = await httpClient.get(`/feedback/submissions/${sub._id}/feedback`);
        feedbacks = fbRes.data.data || [];
      } catch {
        // No feedback yet
      }
      subsWithFeedback.push({ ...sub, feedbacks });
    }
    submissions.value = subsWithFeedback;
  } catch (error: any) {
    console.error('Failed to fetch submissions:', error);
    errorMessage.value = error.response?.data?.message || error.response?.data?.error || 'Failed to load submissions. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchSubmissions();
});

const feedbackItems = computed(() => {
  return submissions.value.map(sub => ({
    id: sub._id,
    studentName: sub.student_id?.fullName || 'Unknown Student',
    studentEmail: sub.student_id?.email || '',
    topic: sub.topic_id?.title || 'Unknown Topic',
    phase: sub.phase,
    submissionDate: sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : '—',
    dueDate: sub.dueDate ? new Date(sub.dueDate).toLocaleDateString() : '—',
    status: sub.feedbacks.length > 0 ? 'Reviewed' : (sub.status === 'Submitted' ? 'Pending Review' : sub.status),
    feedback: sub.feedbacks.length > 0 ? sub.feedbacks[0].feedbackText : null,
    fileCount: sub.files?.length || 0,
  }));
});

const pendingCount = computed(() => feedbackItems.value.filter(i => !i.feedback).length);
const reviewedCount = computed(() => feedbackItems.value.filter(i => i.feedback).length);

const handleProvideFeedback = (id: string) => {
  router.push(`/supervisor/feedback-form?id=${id}`);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Reviewed':
      return 'border-emerald-500/50 bg-emerald-50 text-emerald-700';
    case 'Pending Review':
      return 'border-amber-500/50 bg-amber-50 text-amber-700';
    case 'Submitted':
      return 'border-blue-500/50 bg-blue-50 text-blue-700';
    case 'Overdue':
      return 'border-red-500/50 bg-red-50 text-red-700';
    default:
      return 'border-slate-500/50 bg-slate-50 text-slate-700';
  }
};
</script>

<template>
  <div class="px-4 sm:px-6 pb-6 pt-4 sm:pt-5">
    <!-- Header -->
    <section class="mb-6">
      <h1 class="text-2xl font-bold text-slate-900">Feedback & Grading</h1>
      <p class="mt-1 text-sm text-slate-600">
        Review and grade student submissions
      </p>
    </section>

    <!-- Error Message -->
    <div v-if="errorMessage" class="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
      <p class="text-sm text-red-800">{{ errorMessage }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70 p-8">
      <div class="flex items-center justify-center gap-3">
        <div class="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"></div>
        <p class="text-sm text-slate-600">Loading submissions...</p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="feedbackItems.length === 0 && !errorMessage" class="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70 p-8">
      <div class="flex flex-col items-center justify-center gap-2">
        <DocumentTextIcon class="h-12 w-12 text-slate-300" />
        <p class="text-sm font-medium text-slate-900">No submissions yet</p>
        <p class="text-xs text-slate-500">Student submissions will appear here once they submit their work</p>
      </div>
    </div>

    <!-- Submissions List -->
    <div v-else class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-semibold text-slate-900">
          {{ feedbackItems.length }} Submission{{ feedbackItems.length !== 1 ? 's' : '' }}
        </h2>
        <div class="flex gap-3 text-xs">
          <span class="text-amber-600 font-medium">{{ pendingCount }} pending</span>
          <span class="text-emerald-600 font-medium">{{ reviewedCount }} reviewed</span>
        </div>
      </div>

      <div class="space-y-3">
        <div
          v-for="item in feedbackItems"
          :key="item.id"
          class="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
        >
          <div class="flex items-start justify-between gap-4 mb-3">
            <div class="flex-1">
              <p class="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                {{ item.phase }}
              </p>
              <h3 class="text-sm font-semibold text-slate-900 mt-1">{{ item.studentName }}</h3>
              <p class="text-xs text-slate-500 mt-0.5">{{ item.studentEmail }}</p>
              <p class="text-xs text-slate-600 mt-1">{{ item.topic }}</p>
            </div>
            <div class="flex flex-col items-end gap-2">
              <span
                :class="['inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', getStatusColor(item.status)]"
              >
                {{ item.status }}
              </span>
              <p v-if="item.fileCount" class="text-[11px] text-slate-400">
                {{ item.fileCount }} file{{ item.fileCount !== 1 ? 's' : '' }}
              </p>
            </div>
          </div>

          <div class="mb-4">
            <div class="flex gap-4 text-[11px] text-slate-500 mb-2">
              <span>Submitted: {{ item.submissionDate }}</span>
              <span>Due: {{ item.dueDate }}</span>
            </div>

            <div v-if="item.feedback" class="bg-slate-50 rounded p-3 text-xs text-slate-700">
              <p class="font-medium text-slate-900 mb-1">Your Feedback:</p>
              <p>{{ item.feedback }}</p>
            </div>
            <div v-else class="bg-amber-50 rounded p-3 text-xs text-amber-700">
              <p class="font-medium">No feedback provided yet</p>
            </div>
          </div>

          <div class="flex gap-2">
            <button
              @click="handleProvideFeedback(item.id)"
              class="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 border border-blue-200"
            >
              <PencilIcon class="h-4 w-4" />
              {{ item.feedback ? 'Edit' : 'Add' }} Feedback
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
