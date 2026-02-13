<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  PencilIcon,
} from '@heroicons/vue/24/outline';
import { useGradingStandards } from '../composables/useGradingStandards';

interface FeedbackItem {
  id: number;
  studentName: string;
  topic: string;
  assignmentType: string;
  submissionDate: string;
  status: string;
  feedback: string | null;
  grade: string | null;
}

const router = useRouter();
const { gradingStandards } = useGradingStandards();

const feedbackItems = ref<FeedbackItem[]>([
  {
    id: 1,
    studentName: 'Student Chan Hoi Ting',
    topic: 'Smart City Walkability in Kowloon East',
    assignmentType: 'Progress Report',
    submissionDate: '2025-02-13',
    status: 'Pending Grading',
    feedback: null,
    grade: null,
  },
  {
    id: 2,
    studentName: 'Student Ho Pui Kwan',
    topic: 'Digital Platforms and Youth Political Participation',
    assignmentType: 'Final Presentation',
    submissionDate: '2025-02-12',
    status: 'Graded',
    feedback: 'Good progress on research methodology. Need more analysis on youth engagement.',
    grade: 'A',
  },
  {
    id: 3,
    studentName: 'Student Lee Man Kei',
    topic: 'Literary Analysis and Digital Storytelling',
    assignmentType: 'Final Report',
    submissionDate: '2025-02-10',
    status: 'Pending Grading',
    feedback: null,
    grade: null,
  },
  {
    id: 4,
    studentName: 'Student Chen Wei',
    topic: 'AI Applications in Healthcare',
    assignmentType: 'Proposal Review',
    submissionDate: '2025-02-08',
    status: 'Graded',
    feedback: 'Excellent comprehensive review. Consider adding more recent papers from 2024.',
    grade: 'Approved',
  },
  {
    id: 5,
    studentName: 'Student Wong Man Ho',
    topic: 'Climate Change Resilience',
    assignmentType: 'Progress Report',
    submissionDate: '2025-02-05',
    status: 'Graded',
    feedback: 'Strong proposal with clear objectives. Timeline needs adjustment.',
    grade: '85',
  },
]);

const getGradingStandardForType = (submissionType: string) => {
  return gradingStandards.value.find(
    (gs) => gs.submissionType === submissionType && gs.enabled
  );
};

const handleProvideFeedback = (id: number) => {
  router.push(`/supervisor/feedback-form?id=${id}`);
};

const getStatusColor = (status: string) => {
  return status === 'Graded'
    ? 'border-emerald-500/50 bg-emerald-50 text-emerald-700'
    : 'border-amber-500/50 bg-amber-50 text-amber-700';
};

const getGradeColor = (grade: string) => {
  // Check if it's a letter grade
  if (/^[A-F][+-]?$/.test(grade)) return 'text-emerald-700';
  // Check if it's a number
  if (/^\d+$/.test(grade)) return 'text-blue-700';
  // Custom grades
  return 'text-slate-700';
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

    <div class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <h2 class="text-sm font-semibold text-slate-900 mb-4">
          {{ feedbackItems.length }} Submissions to Review
        </h2>

        <div class="space-y-3">
          <div
            v-for="item in feedbackItems"
            :key="item.id"
            class="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
          >
            <div class="flex items-start justify-between gap-4 mb-3">
              <div class="flex-1">
                <p class="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                  {{ item.assignmentType }}
                </p>
                <h3 class="text-sm font-semibold text-slate-900 mt-1">{{ item.studentName }}</h3>
                <p class="text-xs text-slate-600 mt-1">{{ item.topic }}</p>
              </div>
              <div class="flex flex-col items-end gap-2">
                <span
                  :class="['inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', getStatusColor(item.status)]"
                >
                  {{ item.status }}
                </span>
                <p v-if="item.grade" :class="['text-lg font-bold', getGradeColor(item.grade)]">
                  {{ item.grade }}
                </p>
              </div>
            </div>

            <div class="mb-4">
              <p class="text-[11px] text-slate-500 mb-2">Submitted: {{ item.submissionDate }}</p>

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
                {{ item.feedback ? 'Edit' : 'Add' }} Feedback & Grade
              </button>
            </div>
          </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
</style>
