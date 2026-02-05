<script setup lang="ts">
import { computed } from 'vue'
import {
  ClockIcon,
  CloudArrowUpIcon,
  ArrowPathIcon,
} from '@heroicons/vue/24/outline'
import SidebarStudent from '../components/layout/SidebarStudent.vue'
import { useDummyData } from '../composables/useDummyData'

const { currentStudent, supervisor, submissions, recentFeedback } = useDummyData()

const completion = computed(() => {
  const values = submissions.value.progress
  const done = Object.values(values).filter((p) =>
    ['completed', 'not-required'].includes(p.status),
  ).length
  return Math.round((done / Object.keys(values).length) * 100)
})
</script>

<template>
  <div class="flex min-h-[calc(100vh-3.25rem)]">
    <SidebarStudent current="home" />

    <main class="flex-1 px-4 sm:px-6 pb-6 pt-4 sm:pt-5">
      <section class="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
        <!-- Current topic hero -->
        <article class="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70">
          <header class="flex items-start justify-between gap-3">
            <div>
              <p class="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Current topic
              </p>
              <h2 class="mt-1 text-sm font-semibold text-slate-900">
                Student Version FYP System
              </h2>
              <p class="mt-1 text-xs text-slate-600">
                {{ currentStudent.programme }} · {{ currentStudent.concentration }}
              </p>
            </div>
            <!-- Progress ring -->
            <div class="flex flex-col items-end gap-1 text-right">
              <div class="relative h-12 w-12">
                <svg class="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
                  <path
                    class="text-slate-200"
                    stroke="currentColor"
                    stroke-width="4"
                    fill="none"
                    stroke-linecap="round"
                    d="M18 2.0845
                       a 15.9155 15.9155 0 0 1 0 31.831
                       a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    class="text-blue-500"
                    stroke="currentColor"
                    stroke-width="4"
                    fill="none"
                    stroke-linecap="round"
                    :stroke-dasharray="`${completion}, 100`"
                    d="M18 2.0845
                       a 15.9155 15.9155 0 0 1 0 31.831
                       a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div class="absolute inset-0 flex items-center justify-center">
                  <span class="text-[11px] font-semibold text-slate-900">
                    {{ completion }}%
                  </span>
                </div>
              </div>
              <p class="text-[11px] text-slate-500">
                Overall progress
              </p>
            </div>
          </header>

          <div class="mt-4 space-y-3 text-xs">
            <p class="font-medium text-slate-900">
              Smart City Walkability in Kowloon East
            </p>

            <div class="flex flex-wrap items-center gap-3">
              <div class="flex items-center gap-2">
                <img
                  :src="supervisor.avatar"
                  alt="Supervisor avatar"
                  class="h-8 w-8 rounded-full object-cover"
                />
                <div>
                  <p class="text-slate-900 text-xs font-medium">
                    {{ supervisor.name }}
                  </p>
                  <p class="text-[11px] text-slate-500">
                    {{ supervisor.email }}
                  </p>
                </div>
              </div>
              <span class="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200">
                Approved topic
              </span>
            </div>

            <div class="flex flex-wrap gap-2 text-[11px] text-slate-600">
              <span class="rounded-full bg-blue-50 px-2.5 py-0.5 border border-blue-200 text-blue-700">
                Concentration · Urban & Regional Studies
              </span>
              <span class="rounded-full bg-slate-100 px-2.5 py-0.5 border border-slate-200">
                Student View
              </span>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap gap-2 text-[11px]">
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-full border border-blue-500 bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-500"
            >
              <ArrowPathIcon class="h-3.5 w-3.5" />
              Request topic change
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50"
            >
              <CloudArrowUpIcon class="h-3.5 w-3.5" />
              Upload document
            </button>
          </div>
        </article>

        <!-- Deadlines / countdown -->
        <article class="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70">
          <header class="flex items-center justify-between gap-2">
            <div>
              <h2 class="text-sm font-semibold text-slate-900">
                Upcoming deadlines
              </h2>
              <p class="mt-1 text-xs text-slate-600">
                Based on programme timeline
              </p>
            </div>
            <ClockIcon class="h-5 w-5 text-slate-400" />
          </header>

          <ul class="mt-3 space-y-2 text-xs">
            <li class="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
              <div>
                <p class="font-medium text-rose-800">
                  Progress Report 1
                </p>
                <p class="text-[11px] text-rose-700">
                  Due 1 Feb 2026 · 3 days overdue
                </p>
              </div>
              <span class="rounded-full bg-rose-600 px-2.5 py-0.5 text-[11px] font-medium text-white">
                Overdue
              </span>
            </li>
            <li class="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <div>
                <p class="font-medium text-amber-900">
                  Progress Report 2
                </p>
                <p class="text-[11px] text-amber-700">
                  Due 10 Apr 2026 · 65 days remaining
                </p>
              </div>
              <span class="rounded-full bg-amber-500 px-2.5 py-0.5 text-[11px] font-medium text-white">
                Upcoming
              </span>
            </li>
          </ul>
        </article>
      </section>

      <!-- Submission status + feedback -->
      <section class="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)]">
        <!-- Submission grid -->
        <article class="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70">
          <header class="flex items-center justify-between gap-2">
            <div>
              <h2 class="text-sm font-semibold text-slate-900">
                Submission status
              </h2>
              <p class="mt-1 text-xs text-slate-600">
                Your checklist for the whole FYP lifecycle.
              </p>
            </div>
          </header>

          <div class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-[11px]">
            <div class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
              <p class="font-medium text-emerald-900">
                Topic Planning
              </p>
              <p class="mt-0.5 text-emerald-700">
                Submitted 10 Nov 2025
              </p>
            </div>
            <div class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5">
              <p class="font-medium text-rose-900">
                Progress Report 1
              </p>
              <p class="mt-0.5 text-rose-700">
                Overdue – please submit soon
              </p>
            </div>
            <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p class="font-medium text-slate-900">
                Ethics Clearance
              </p>
              <p class="mt-0.5 text-slate-600">
                Not required (agreed with supervisor)
              </p>
            </div>
            <div class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
              <p class="font-medium text-amber-900">
                Progress Report 2
              </p>
              <p class="mt-0.5 text-amber-700">
                Due in April 2026
              </p>
            </div>
            <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p class="font-medium text-slate-900">
                Dissertation & Presentation
              </p>
              <p class="mt-0.5 text-slate-600">
                Not started
              </p>
            </div>
          </div>
        </article>

        <!-- Recent feedback -->
        <article class="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70">
          <header class="flex items-center justify-between gap-2">
            <div>
              <h2 class="text-sm font-semibold text-slate-900">
                Recent supervisor feedback
              </h2>
              <p class="mt-1 text-xs text-slate-600">
                Visible to you in the Student Version FYP System.
              </p>
            </div>
          </header>

          <div class="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs">
            <div class="flex items-center gap-2">
              <img
                :src="supervisor.avatar"
                alt="Supervisor avatar"
                class="h-7 w-7 rounded-full object-cover"
              />
              <div>
                <p class="font-medium text-slate-900">
                  {{ recentFeedback.from }}
                </p>
                <p class="text-[11px] text-slate-500">
                  {{ recentFeedback.role }} · {{ recentFeedback.date }}
                </p>
              </div>
            </div>

            <p class="mt-2 text-[11px] text-slate-700 leading-relaxed">
              {{ recentFeedback.visibleToStudent }}
            </p>
          </div>
        </article>
      </section>
    </main>
  </div>
</template>

