<script setup lang="ts">
import { useDummyData } from '../composables/useDummyData';

const { supervisor, recentFeedback } = useDummyData();

const feedbackItems = [
  {
    id: 1,
    from: 'Dr. Emily Lee',
    role: 'Supervisor',
    date: '5 Feb 2026',
    subject: 'Progress Report 1 - Comments',
    content: 'Good progress on the initial research phase. Please ensure you cite all sources properly and consider expanding the methodology section. Let\'s discuss in our next meeting.',
    rating: 4,
  },
  {
    id: 2,
    from: 'Dr. Emily Lee',
    role: 'Supervisor',
    date: '25 Jan 2026',
    subject: 'Topic Planning Form Review',
    content: 'Excellent topic proposal. The scope is well-defined and the research questions are clear. I\'ve approved this for proceeding to the next phase.',
    rating: 5,
  },
  {
    id: 3,
    from: 'Panel Review',
    role: 'Ethics Committee',
    date: '18 Jan 2026',
    subject: 'Ethics Clearance (Not Required)',
    content: 'Your research proposal does not require formal ethics clearance. You may proceed with data collection.',
    rating: 0,
  },
];
</script>

<template>
  <div class="w-full">
    <main class="px-4 sm:px-6 pb-6 pt-4 sm:pt-5">
      <!-- Header -->
      <section class="mb-6">
        <h1 class="text-2xl font-bold text-slate-900">Feedback Received</h1>
        <p class="mt-1 text-sm text-slate-600">
          All feedback from your supervisor and review panels
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

              <p class="mt-2 text-sm text-slate-700 leading-relaxed">
                {{ feedback.content }}
              </p>

              <div v-if="feedback.rating > 0" class="mt-3 flex items-center gap-1">
                <span class="text-xs text-slate-600">Rating:</span>
                <div class="flex gap-0.5">
                  <span v-for="i in 5" :key="i" class="text-lg" :class="i <= feedback.rating ? 'text-amber-400' : 'text-slate-300'">
                    ★
                  </span>
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
