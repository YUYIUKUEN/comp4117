<script setup lang="ts">
import { ref, computed, onMounted, onActivated, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  PencilIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  UserIcon,
} from '@heroicons/vue/24/outline';
import httpClient from '@/services/httpClient';
import feedbackService from '@/services/feedbackService';

interface FeedbackReply {
  _id: string;
  user_id: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
  replyText: string;
  createdAt: string;
}

interface FeedbackItem {
  _id: string;
  feedbackText: string;
  createdAt: string;
  replies?: FeedbackReply[];
  isPrivate?: boolean;
  grade?: string;
  supervisor_id?: { _id: string; fullName: string; email: string };
}

interface SubmissionItem {
  _id: string;
  student_id: { _id: string; fullName: string; email: string } | null;
  topic_id: { _id: string; title: string } | null;
  phase: string;
  status: string;
  submittedAt: string | null;
  dueDate: string | null;
  files: Array<{ filename: string; originalName: string; size: number }>;
  feedbacks: FeedbackItem[];
}

const router = useRouter();
const route = useRoute();
const submissions = ref<SubmissionItem[]>([]);
const isLoading = ref(false);
const errorMessage = ref('');
const filterStudentId = ref<string | null>(null);

const fetchSubmissions = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';
    const response = await httpClient.get('/submissions/supervisor/submissions');
    const subs = response.data.data || [];
    console.log(`Loaded ${subs.length} submissions`, subs);
    console.log(`Loaded ${subs.length} submissions`, subs);

    // For each submission, fetch its feedback
    const subsWithFeedback: SubmissionItem[] = [];
    for (const sub of subs) {
      let feedbacks: any[] = [];
      try {
        const fbRes = await httpClient.get(`/feedback/submissions/${sub._id}/feedback`);
        // Handle different response structures
        if (fbRes.data.data?.feedback) {
          feedbacks = Array.isArray(fbRes.data.data.feedback) ? fbRes.data.data.feedback : [];
        } else if (fbRes.data.data && Array.isArray(fbRes.data.data)) {
          feedbacks = fbRes.data.data;
        }
        if (feedbacks.length > 0) {
          console.log(`Submission ${sub._id} has ${feedbacks.length} feedback(s)`);
        }
      } catch (error) {
        // Log error for debugging but don't break the flow
        console.warn(`Failed to fetch feedback for submission ${sub._id}:`, error);
      }
      subsWithFeedback.push({ ...sub, feedbacks });
    }
    submissions.value = subsWithFeedback;
    console.log(`Loaded submissions with feedback:`, subsWithFeedback);
  } catch (error: any) {
    console.error('Failed to fetch submissions:', error);
    errorMessage.value = error.response?.data?.message || error.response?.data?.error || 'Failed to load submissions. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  filterStudentId.value = (route.query.student as string) || null;
  fetchSubmissions();
});

// Refetch when returning to this page from navigation
onActivated(() => {
  // Always refetch to ensure we have the latest feedback
  fetchSubmissions();
});

// Watch for route query changes
watch(() => route.query.student, (val) => {
  filterStudentId.value = (val as string) || null;
});

const clearFilter = () => {
  filterStudentId.value = null;
  router.replace({ query: {} });
};

const filteredStudentName = computed(() => {
  if (!filterStudentId.value) return null;
  const sub = submissions.value.find(
    s => s.student_id?._id === filterStudentId.value
  );
  return sub?.student_id?.fullName || null;
});

const feedbackItems = computed(() => {
  let subs = submissions.value;
  if (filterStudentId.value) {
    subs = subs.filter(s => s.student_id?._id === filterStudentId.value);
  }
  return subs.map(sub => ({
    id: sub._id,
    studentId: sub.student_id?._id || '',
    studentName: sub.student_id?.fullName || 'Unknown Student',
    studentEmail: sub.student_id?.email || '',
    topic: sub.topic_id?.title || 'Unknown Topic',
    phase: sub.phase,
    submissionDate: sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : '—',
    dueDate: sub.dueDate ? new Date(sub.dueDate).toLocaleDateString() : '—',
    status: sub.feedbacks?.length > 0 ? 'Reviewed' : (sub.status === 'Submitted' ? 'Pending Review' : sub.status),
    feedback: sub.feedbacks?.length ? sub.feedbacks[0]!.feedbackText : null,
    files: sub.files || [],
    fileCount: sub.files?.length || 0,
  }));
});

const pendingCount = computed(() => feedbackItems.value.filter(i => !i.feedback).length);
const reviewedCount = computed(() => feedbackItems.value.filter(i => i.feedback).length);

// Group submissions by student
interface StudentGroup {
  studentId: string;
  studentName: string;
  studentEmail: string;
  topic: string;
  submissions: typeof feedbackItems.value;
  pendingCount: number;
  reviewedCount: number;
}

const groupedByStudent = computed<StudentGroup[]>(() => {
  const map = new Map<string, StudentGroup>();
  for (const item of feedbackItems.value) {
    const key = item.studentEmail || item.studentName;
    if (!map.has(key)) {
      map.set(key, {
        studentId: key,
        studentName: item.studentName,
        studentEmail: item.studentEmail,
        topic: item.topic,
        submissions: [],
        pendingCount: 0,
        reviewedCount: 0,
      });
    }
    const group = map.get(key)!;
    group.submissions.push(item);
    if (item.feedback) {
      group.reviewedCount++;
    } else {
      group.pendingCount++;
    }
  }
  // Sort groups by student name
  return Array.from(map.values()).sort((a, b) => a.studentName.localeCompare(b.studentName));
});

const expandedStudents = ref<Set<string>>(new Set());

// Expand all by default on load
watch(groupedByStudent, (groups) => {
  if (expandedStudents.value.size === 0 && groups.length > 0) {
    groups.forEach(g => expandedStudents.value.add(g.studentId));
  }
}, { immediate: true });

const toggleStudent = (studentId: string) => {
  if (expandedStudents.value.has(studentId)) {
    expandedStudents.value.delete(studentId);
  } else {
    expandedStudents.value.add(studentId);
  }
};

const handleProvideFeedback = (id: string) => {
  if (!id) {
    console.error('❌ Cannot provide feedback: submission ID is missing');
    alert('Error: Cannot find submission ID. Please try again.');
    return;
  }
  router.push(`/supervisor/feedback-form?id=${encodeURIComponent(id)}`);
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

const downloadFile = async (studentId: string, phase: string, filename: string, originalName: string) => {
  try {
    const response = await httpClient.get(
      `/submissions/supervisor/student/${encodeURIComponent(studentId)}/${encodeURIComponent(phase)}/files/${encodeURIComponent(filename)}`,
      { responseType: 'blob' }
    );
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', originalName);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    console.error('Failed to download file:', error);
    errorMessage.value = 'Failed to download file. Please try again.';
  }
};
</script>

<template>
  <div class="px-4 sm:px-6 pb-6 pt-4 sm:pt-5">
    <!-- Header -->
    <section class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Feedback & Grading</h1>
        <p class="mt-1 text-sm text-slate-600">
          Review and grade student submissions
        </p>
      </div>
      <button
        @click="fetchSubmissions"
        :disabled="isLoading"
        class="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition-colors"
      >
        <svg v-if="!isLoading" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        <svg v-else class="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        {{ isLoading ? 'Refreshing...' : 'Refresh' }}
      </button>
    </section>

    <!-- Student filter banner -->
    <div v-if="filterStudentId" class="mb-4 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5">
      <p class="text-sm text-blue-800">
        Showing submissions for <span class="font-semibold">{{ filteredStudentName || 'selected student' }}</span>
      </p>
      <button
        @click="clearFilter"
        class="ml-auto inline-flex items-center rounded-full border border-blue-300 bg-white px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
      >
        Show all students
      </button>
    </div>

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

    <!-- Submissions List grouped by student -->
    <div v-else class="space-y-4">
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-sm font-semibold text-slate-900">
          {{ groupedByStudent.length }} Student{{ groupedByStudent.length !== 1 ? 's' : '' }} · {{ feedbackItems.length }} Submission{{ feedbackItems.length !== 1 ? 's' : '' }}
        </h2>
        <div class="flex gap-3 text-xs">
          <span class="text-amber-600 font-medium">{{ pendingCount }} pending</span>
          <span class="text-emerald-600 font-medium">{{ reviewedCount }} reviewed</span>
        </div>
      </div>

      <div
        v-for="group in groupedByStudent"
        :key="group.studentId"
        class="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70 overflow-hidden"
      >
        <!-- Student Header (clickable to expand/collapse) -->
        <button
          type="button"
          class="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-slate-50 transition-colors text-left"
          @click="toggleStudent(group.studentId)"
        >
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 flex-shrink-0">
            <UserIcon class="h-5 w-5 text-blue-600" />
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-semibold text-slate-900 truncate">{{ group.studentName }}</h3>
            <p class="text-xs text-slate-500 truncate">{{ group.studentEmail }} · {{ group.topic }}</p>
          </div>
          <div class="flex items-center gap-3 flex-shrink-0">
            <div class="flex gap-2 text-[11px]">
              <span v-if="group.pendingCount" class="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700 font-medium">
                {{ group.pendingCount }} pending
              </span>
              <span v-if="group.reviewedCount" class="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-700 font-medium">
                {{ group.reviewedCount }} reviewed
              </span>
            </div>
            <span class="text-xs text-slate-400">{{ group.submissions.length }} phase{{ group.submissions.length !== 1 ? 's' : '' }}</span>
            <ChevronDownIcon v-if="expandedStudents.has(group.studentId)" class="h-4 w-4 text-slate-400" />
            <ChevronRightIcon v-else class="h-4 w-4 text-slate-400" />
          </div>
        </button>

        <!-- Student Submissions (collapsible) -->
        <div v-if="expandedStudents.has(group.studentId)" class="border-t border-slate-100 px-4 sm:px-5 py-3 space-y-3">
          <div
            v-for="item in group.submissions"
            :key="item.id"
            class="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
          >
            <div class="flex items-start justify-between gap-4 mb-3">
              <div class="flex-1">
                <p class="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                  {{ item.phase }}
                </p>
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

              <!-- Files Section -->
              <div v-if="item.files.length > 0" class="mb-4 bg-blue-50 rounded p-3">
                <p class="text-[11px] font-medium text-blue-900 mb-2">Submitted Files:</p>
                <div class="space-y-2">
                  <div
                    v-for="file in item.files"
                    :key="file.filename"
                    class="flex items-center justify-between gap-2 bg-white rounded px-2.5 py-2 border border-blue-200"
                  >
                    <div class="flex-1 min-w-0">
                      <p class="text-[11px] font-medium text-slate-900 truncate">{{ file.originalName }}</p>
                      <p class="text-[10px] text-slate-500">{{ (file.size / 1024).toFixed(2) }} KB</p>
                    </div>
                    <button
                      @click="downloadFile(item.studentId, item.phase, file.filename, file.originalName)"
                      class="inline-flex items-center gap-1 flex-shrink-0 rounded px-2 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 text-[11px] font-medium transition-colors"
                    >
                      <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v6h16v-6m-2-4l-8.147 8.147a1 1 0 01-1.414-1.414L16.439 6.44M9 13H5m8 0h4"></path>
                      </svg>
                      Download
                    </button>
                  </div>
                </div>
              </div>

              <div v-if="item.feedback" class="bg-slate-50 rounded p-3 text-xs text-slate-700">
                <div class="flex items-start justify-between gap-2 mb-1">
                  <p class="font-medium text-slate-900">Recent Feedback:</p>
                </div>
                <p>{{ item.feedback }}</p>

                <!-- Student Replies -->
                <div v-if="submissions.find(s => s._id === item.id)?.feedbacks[0]?.replies?.length" class="mt-3 space-y-2 border-t border-slate-200 pt-2">
                  <p class="text-[10px] font-semibold uppercase text-slate-500 tracking-wide">Student Replies</p>
                  <div
                    v-for="reply in submissions.find(s => s._id === item.id)?.feedbacks[0]?.replies"
                    :key="reply._id"
                    class="flex items-start gap-2 rounded bg-white px-2 py-1.5 border border-slate-200"
                  >
                    <img
                      :src="avatarUrl(reply.user_id?.fullName || 'U', reply.user_id?.role === 'Supervisor' ? '7C3AED' : '3B82F6')"
                      class="h-6 w-6 rounded-full mt-0.5 flex-shrink-0"
                    >
                    <div class="min-w-0 flex-1">
                      <p class="text-[10px]">
                        <span class="font-medium text-slate-900">{{ reply.user_id?.fullName ?? 'User' }}</span>
                        <span class="text-slate-400 ml-1">{{ formatDate(reply.createdAt) }}</span>
                      </p>
                      <p class="mt-0.5 text-[10px] text-slate-600 leading-relaxed">{{ reply.replyText }}</p>
                    </div>
                  </div>
                </div>
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
  </div>
</template>

<style scoped>
</style>
