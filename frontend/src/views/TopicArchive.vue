<script setup lang="ts">
const archivedTopics = [
  {
    id: 1,
    title: 'Initial Research on Urban Planning Trends',
    year: '2025',
    semester: 'Semester 1',
    supervisor: 'Dr. Michael Wong',
    status: 'Archived - Not Approved',
    reason: 'Scope too broad - student requested change',
    submissionDate: '15 Oct 2025',
  },
  {
    id: 2,
    title: 'Comparative Analysis of Metro Systems',
    year: '2024',
    semester: 'Semester 2',
    supervisor: 'Dr. Sarah Johnson',
    status: 'Archived - Completed',
    reason: 'Final submission completed',
    submissionDate: '20 May 2024',
  },
];
</script>

<template>
  <div class="w-full">
    <main class="px-4 sm:px-6 pb-6 pt-4 sm:pt-5">
      <!-- Header -->
      <section class="mb-6">
        <h1 class="text-2xl font-bold text-slate-900">Topic Archive</h1>
        <p class="mt-1 text-sm text-slate-600">
          All previous FYP topics and archived submissions
        </p>
      </section>

      <!-- Archived Topics -->
      <section class="space-y-4">
        <div v-for="topic in archivedTopics" :key="topic.id" class="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70">
          <div class="mb-3 flex flex-wrap items-center gap-2">
            <span class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
              {{ topic.year }} · {{ topic.semester }}
            </span>
            <span
              class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium"
              :class="topic.status.includes('Completed') ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-rose-200 bg-rose-50 text-rose-700'"
            >
              {{ topic.status }}
            </span>
          </div>

          <h3 class="text-sm font-semibold text-slate-900">
            {{ topic.title }}
          </h3>

          <div class="mt-3 space-y-2 text-xs text-slate-600">
            <p>
              <span class="font-medium text-slate-700">Supervisor:</span> {{ topic.supervisor }}
            </p>
            <p>
              <span class="font-medium text-slate-700">Submitted:</span> {{ topic.submissionDate }}
            </p>
            <p>
              <span class="font-medium text-slate-700">Reason:</span> {{ topic.reason }}
            </p>
          </div>

          <div class="mt-4 flex gap-2">
            <button
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              View Details
            </button>
            <button
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Reuse for New Topic
            </button>
          </div>
        </div>
      </section>

      <!-- Empty State -->
      <div v-if="archivedTopics.length === 0" class="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <p class="text-sm text-slate-600">No archived topics yet</p>
      </div>
    </main>
  </div>
</template>
