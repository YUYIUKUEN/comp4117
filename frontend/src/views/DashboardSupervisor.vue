<script setup lang="ts">
import { useDummyData } from '../composables/useDummyData';
import { useRouter } from 'vue-router';

const router = useRouter();
const { role, supervisedStudents, topicChangeRequests, systemOverview } = useDummyData();
</script>

<template>
  <div>
    <main class="px-4 sm:px-6 pb-6 pt-4 sm:pt-5">
      <!-- Main Navigation Menu -->
      <div class="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <button
          @click="router.push('/supervisor')"
          class="p-4 rounded-lg border-2 border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50 transition-all text-left cursor-pointer"
        >
          <p class="text-sm font-semibold text-slate-900">📊 Main Menu</p>
          <p class="text-xs text-slate-500 mt-1">Back to supervisor hub</p>
        </button>
        <button
          @click="router.push('/supervisor/students')"
          class="p-4 rounded-lg border-2 border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left cursor-pointer"
        >
          <p class="text-sm font-semibold text-slate-900">👥 All Students</p>
          <p class="text-xs text-slate-500 mt-1">View supervised students</p>
        </button>
        <button
          @click="router.push('/supervisor/topics')"
          class="p-4 rounded-lg border-2 border-slate-200 bg-white hover:border-purple-500 hover:bg-purple-50 transition-all text-left cursor-pointer"
        >
          <p class="text-sm font-semibold text-slate-900">📝 Topic Proposals</p>
          <p class="text-xs text-slate-500 mt-1">Create & manage topics</p>
        </button>
        <button
          @click="router.push('/supervisor/pending-approvals')"
          class="p-4 rounded-lg border-2 border-slate-200 bg-white hover:border-amber-500 hover:bg-amber-50 transition-all text-left cursor-pointer"
        >
          <p class="text-sm font-semibold text-slate-900">✅ Pending Approvals</p>
          <p class="text-xs text-slate-500 mt-1">Review requests</p>
        </button>
        <button
          @click="router.push('/supervisor/feedback-grading')"
          class="p-4 rounded-lg border-2 border-slate-200 bg-white hover:border-pink-500 hover:bg-pink-50 transition-all text-left cursor-pointer"
        >
          <p class="text-sm font-semibold text-slate-900">⭐ Feedback & Grading</p>
          <p class="text-xs text-slate-500 mt-1">Grade submissions</p>
        </button>
        <button
          @click="router.push('/supervisor/activity-logs')"
          class="p-4 rounded-lg border-2 border-slate-200 bg-white hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left cursor-pointer"
        >
          <p class="text-sm font-semibold text-slate-900">📋 Activity Logs</p>
          <p class="text-xs text-slate-500 mt-1">View system activity</p>
        </button>
        <button
          @click="router.push('/supervisor/reminders')"
          class="p-4 rounded-lg border-2 border-slate-200 bg-white hover:border-red-500 hover:bg-red-50 transition-all text-left cursor-pointer"
        >
          <p class="text-sm font-semibold text-slate-900">🔔 Reminders Queue</p>
          <p class="text-xs text-slate-500 mt-1">Manage deadlines</p>
        </button>
      </div>

      <!-- Stats row -->
      <section class="grid gap-4 sm:grid-cols-3">
        <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 text-xs">
          <p class="text-slate-600">
            Supervising students
          </p>
          <p class="mt-1 text-2xl font-semibold text-slate-900">
            8
          </p>
          <p class="mt-1 text-[11px] text-slate-500">
            Across the current Social Sciences FYP cohort.
          </p>
        </article>
        <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 text-xs">
          <p class="text-slate-600">
            Pending approvals
          </p>
          <p class="mt-1 text-2xl font-semibold text-amber-600">
            3
          </p>
          <p class="mt-1 text-[11px] text-slate-500">
            Topic changes and progress forms waiting for your review.
          </p>
        </article>
        <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 text-xs">
          <p class="text-slate-600">
            Overdue submissions
          </p>
          <p class="mt-1 text-2xl font-semibold text-rose-600">
            5
          </p>
          <p class="mt-1 text-[11px] text-slate-500">
            Students needing gentle reminders in the Supervisor/Admin Version.
          </p>
        </article>
      </section>

      <!-- Supervised students + pending requests -->
      <section class="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1.1fr)]">
        <article class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70 text-xs">
          <header class="flex items-center justify-between gap-2">
            <div>
              <h2 class="text-sm font-semibold text-slate-900">
                My supervised students
              </h2>
              <p class="mt-1 text-[11px] text-slate-600">
                Same topics and submissions as in Student Version FYP System, with supervisor actions.
              </p>
            </div>
          </header>

          <div class="mt-3 overflow-x-auto">
            <table class="min-w-full text-[11px]">
              <thead class="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th class="px-3 py-2 text-left font-medium">
                    Student
                  </th>
                  <th class="px-3 py-2 text-left font-medium">
                    Topic
                  </th>
                  <th class="px-3 py-2 text-left font-medium">
                    Last submission
                  </th>
                  <th class="px-3 py-2 text-left font-medium">
                    Status
                  </th>
                  <th class="px-3 py-2 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="s in supervisedStudents"
                  :key="s.id"
                  class="hover:bg-slate-50"
                >
                  <td class="px-3 py-2 align-top">
                    <div class="flex items-center gap-2">
                      <img
                        :src="`https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=2563EB&color=fff`"
                        :alt="s.name"
                        class="h-7 w-7 rounded-full object-cover"
                      >
                      <div>
                        <p class="font-medium text-slate-900">
                          {{ s.name }}
                        </p>
                        <p class="text-[11px] text-slate-500">
                          {{ s.id }}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td class="px-3 py-2 align-top max-w-xs">
                    <p class="font-medium text-slate-900 line-clamp-2">
                      {{ s.topicTitle }}
                    </p>
                  </td>
                  <td class="px-3 py-2 align-top">
                    <p class="text-slate-700">
                      {{ s.lastSubmission || '—' }}
                    </p>
                    <p class="text-[11px] text-slate-500">
                      {{ s.lastSubmissionDate || '—' }}
                    </p>
                  </td>
                  <td class="px-3 py-2 align-top">
                    <span
                      class="inline-flex items-center rounded-full border px-2.5 py-0.5"
                      :class="s.status === 'Overdue'
                        ? 'border-rose-200 bg-rose-50 text-rose-700'
                        : s.status === 'On Track'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-slate-50 text-slate-600'"
                    >
                      {{ s.status }}
                    </span>
                  </td>
                  <td class="px-3 py-2 align-top text-right">
                    <div class="flex flex-col gap-1 items-end">
                      <button
                        type="button"
                        class="inline-flex items-center rounded-full border border-emerald-500 bg-emerald-600 px-2.5 py-1 text-[11px] text-white hover:bg-emerald-500"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        class="inline-flex items-center rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] text-slate-700 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50"
                      >
                        View docs
                      </button>
                      <button
                        type="button"
                        class="inline-flex items-center rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] text-slate-700 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50"
                      >
                        Send reminder
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <!-- Pending topic change + admin system overview -->
        <div class="space-y-4">
          <article class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70 text-xs">
            <header class="flex items-center justify-between gap-2">
              <h2 class="text-sm font-semibold text-slate-900">
                Pending topic change requests
              </h2>
              <span class="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] text-amber-700 border border-amber-200">
                {{ topicChangeRequests.length }} pending
              </span>
            </header>

            <ul class="mt-3 space-y-2">
              <li
                v-for="req in topicChangeRequests"
                :key="req.id"
                class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <p class="text-[11px] font-medium text-slate-900">
                  {{ req.studentName }}
                </p>
                <p class="mt-0.5 text-[11px] text-slate-600">
                  <span class="font-semibold">From:</span> {{ req.currentTitle }}
                </p>
                <p class="mt-0.5 text-[11px] text-slate-600">
                  <span class="font-semibold">To:</span> {{ req.requestedTitle }}
                </p>
                <p class="mt-0.5 text-[11px] text-slate-500">
                  Requested on {{ req.submittedAt }}
                </p>
                <div class="mt-2 flex gap-2">
                  <button
                    type="button"
                    class="inline-flex items-center rounded-full border border-emerald-500 bg-emerald-600 px-2.5 py-1 text-[11px] text-white hover:bg-emerald-500"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center rounded-full border border-rose-500 bg-rose-50 px-2.5 py-1 text-[11px] text-rose-700 hover:bg-rose-100"
                  >
                    Reject
                  </button>
                </div>
              </li>
            </ul>
          </article>

          <article
            v-if="role === 'admin'"
            class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70 text-xs"
          >
            <header class="flex items-center justify-between gap-2">
              <h2 class="text-sm font-semibold text-slate-900">
                System overview
              </h2>
              <span class="rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] text-slate-700 border border-slate-200">
                Admin View
              </span>
            </header>

            <dl class="mt-3 grid grid-cols-2 gap-3">
              <div>
                <dt class="text-[11px] text-slate-500">
                  Total students
                </dt>
                <dd class="text-lg font-semibold text-slate-900">
                  {{ systemOverview.totalStudents }}
                </dd>
              </div>
              <div>
                <dt class="text-[11px] text-slate-500">
                  Topics
                </dt>
                <dd class="text-lg font-semibold text-slate-900">
                  {{ systemOverview.totalTopics }}
                </dd>
              </div>
              <div>
                <dt class="text-[11px] text-slate-500">
                  Overdue submissions
                </dt>
                <dd class="text-lg font-semibold text-rose-600">
                  {{ systemOverview.overdueSubmissions }}
                </dd>
              </div>
              <div>
                <dt class="text-[11px] text-slate-500">
                  Pending approvals
                </dt>
                <dd class="text-lg font-semibold text-amber-600">
                  {{ systemOverview.pendingApprovals }}
                </dd>
              </div>
            </dl>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>

