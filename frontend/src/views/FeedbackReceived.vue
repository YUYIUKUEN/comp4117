<script setup lang="ts">
import { computed } from 'vue';
import { useGradingStandards } from '../composables/useGradingStandards';
import { useDummyData } from '../composables/useDummyData';

const { supervisor } = useDummyData();
const { gradingStandards } = useGradingStandards();

interface FeedbackItem {
  id: number;
  from: string;
  role: string;
  date: string;
  subject: string;
  submissionType: string;
  content: string;
  grade: string | number;
  gradingSystemType: 'point-range' | 'letter-grade' | 'custom';
}

const feedbackItems: FeedbackItem[] = [
  {
    id: 1,
    from: 'Dr. Emily Lee',
    role: 'Supervisor',
    date: '5 Feb 2026',
    subject: 'Progress Report 1 - Feedback & Grade',
    submissionType: 'Progress Report',
    content: 'Good progress on the initial research phase. Please ensure you cite all sources properly and consider expanding the methodology section. Let\'s discuss in our next meeting.',
    grade: 78,
    gradingSystemType: 'point-range',
  },
  {
    id: 2,
    from: 'Dr. Emily Lee',
    role: 'Supervisor',
    date: '25 Jan 2026',
    subject: 'Topic Planning Form Review',
    submissionType: 'Proposal Review',
    content: 'Excellent topic proposal. The scope is well-defined and the research questions are clear. I\'ve approved this for proceeding to the next phase.',
    grade: 'Approved',
    gradingSystemType: 'custom',
  },
  {
    id: 3,
    from: 'Dr. Emily Lee',
    role: 'Supervisor',
    date: '18 Jan 2026',
    subject: 'Final Presentation - Feedback & Grade',
    submissionType: 'Final Presentation',
    content: 'Excellent presentation with clear communication of your research. Strong methodology and results discussion. Minor improvements needed in the discussion section.',
    grade: 'A',
    gradingSystemType: 'letter-grade',
  },
];

const getGradeDisplayColor = (grade: string | number, gradingSystemType: string) => {
  if (gradingSystemType === 'point-range') {
    const points = grade as number;
    if (points >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (points >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (points >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  } else if (gradingSystemType === 'letter-grade') {
    const letterGrade = grade as string;
    if (letterGrade === 'A') return 'text-green-600 bg-green-50 border-green-200';
    if (letterGrade === 'B') return 'text-blue-600 bg-blue-50 border-blue-200';
    if (letterGrade === 'C') return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  } else {
    return 'text-slate-600 bg-slate-50 border-slate-200';
  }
};

const getGradeLabel = (gradingSystemType: string) => {
  if (gradingSystemType === 'point-range') return 'Points';
  if (gradingSystemType === 'letter-grade') return 'Grade';
  return 'Status';
};
</script>

<template>
  <div>
    <main class="px-4 sm:px-6 pb-6 pt-4 sm:pt-5">
      <!-- Header -->
      <section class="mb-6">
        <h1 class="text-2xl font-bold text-slate-900">Feedback Received</h1>
        <p class="mt-1 text-sm text-slate-600">
          All feedback and grades from your supervisor
        </p>
      </section>

      <!-- Feedback Items -->
      <section class="space-y-4">
        <div v-for="feedback in feedbackItems" :key="feedback.id" class="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-3">
                <img
                  src="https://ui-avatars.com/api/?name=Dr+Emily&background=7C3AED&color=fff"
                  alt="Feedback from avatar"
                  class="h-10 w-10 rounded-full object-cover"
                >
                <div>
                  <p class="font-medium text-slate-900">{{ feedback.from }}</p>
                  <p class="text-xs text-slate-500">{{ feedback.role }} · {{ feedback.date }}</p>
                </div>
              </div>

              <h3 class="mt-3 text-sm font-semibold text-slate-900">
                {{ feedback.subject }}
              </h3>

              <p class="mt-2 text-xs text-slate-500 font-medium uppercase tracking-wide">
                Submission Type: {{ feedback.submissionType }}
              </p>

              <p class="mt-2 text-sm text-slate-700 leading-relaxed">
                {{ feedback.content }}
              </p>

              <!-- Grade Display -->
              <div class="mt-4 flex items-center gap-3">
                <div
                  class="rounded-lg border px-3 py-2"
                  :class="getGradeDisplayColor(feedback.grade, feedback.gradingSystemType)"
                >
                  <p class="text-xs font-medium opacity-75">{{ getGradeLabel(feedback.gradingSystemType) }}</p>
                  <p class="text-lg font-bold">
                    {{ feedback.gradingSystemType === 'point-range' ? `${feedback.grade}/100` : feedback.grade }}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Reply
            </button>
          </div>
        </div>
      </section>

      <!-- Empty State -->
      <div v-if="feedbackItems.length === 0" class="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <p class="text-sm text-slate-600">No feedback received yet</p>
      </div>
    </main>
  </div>
</template>
