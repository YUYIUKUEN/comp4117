<script setup lang="ts">
import { useRouter } from 'vue-router';
import {
  UsersIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  AcademicCapIcon,
  PencilIcon,
} from '@heroicons/vue/24/outline';

const router = useRouter();

const stats = {
  totalStudents: 128,
  topicsProposed: 94,
  submissionsThisMonth: 312,
};

const rows = [
  {
    id: 1,
    student: 'Student Chan Hoi Ting',
    programme: 'BSocSc Geography',
    supervisor: 'Dr. Emily Lee',
    topic: 'Smart City Walkability in Kowloon East',
    status: 'Active',
  },
  {
    id: 2,
    student: 'Student Ho Pui Kwan',
    programme: 'BSocSc Sociology',
    supervisor: 'Prof. Agnes Ng',
    topic: 'Digital Platforms and Youth Political Participation',
    status: 'Pending',
  },
];

const activityLog = [
  {
    id: 1,
    time: '10:42',
    actor: 'Student Chan Hoi Ting',
    description: 'Submitted Progress Report 1 for review.',
    type: 'submission',
  },
  {
    id: 2,
    time: '10:15',
    actor: 'Supervisor Emily Lee',
    description: 'Approved topic change request (FYP-GEOG-2026-018).',
    type: 'approval',
  },
];
</script>

<template>
  <div class="min-h-[calc(100vh-3.25rem)] bg-slate-50 text-slate-900">
    <header
      class="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur"
    >
      <div>
        <p class="text-[11px] uppercase tracking-[0.2em] text-slate-500">
          Admin overview
        </p>
        <p class="text-sm font-semibold text-slate-900">
          Programme‑wide FYP monitoring
        </p>
      </div>
    </header>

    <main class="px-4 sm:px-6 pb-6 pt-4 sm:pt-5">
        <section
          aria-label="Key metrics"
          class="grid gap-4 sm:grid-cols-3"
        >
          <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70">
            <p class="text-xs text-slate-500">
              Total students
            </p>
            <p class="mt-2 text-2xl font-semibold text-slate-900">
              {{ stats.totalStudents }}
            </p>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70">
            <p class="text-xs text-slate-500">
              Topics proposed
            </p>
            <p class="mt-2 text-2xl font-semibold text-slate-900">
              {{ stats.topicsProposed }}
            </p>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70">
            <p class="text-xs text-slate-500">
              Submissions this month
            </p>
            <p class="mt-2 text-2xl font-semibold text-sky-600">
              {{ stats.submissionsThisMonth }}
            </p>
          </div>
        </section>

        <section
          class="mt-5 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70"
          aria-label="Students and topics"
        >
          <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-sm font-semibold text-slate-900">
                All students & topics
              </h2>
              <p class="mt-1 text-xs text-slate-500">
                Lightweight search to replace hunting through spreadsheets and scattered Moodle spaces.
              </p>
            </div>
            <div class="flex flex-col sm:flex-row gap-2 text-[11px]">
              <button
                type="button"
                class="inline-flex items-center rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-slate-200 hover:border-blue-500 hover:text-blue-100"
              >
                Export to Excel (demo)
              </button>
              <button
                type="button"
                class="inline-flex items-center rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-slate-200 hover:border-blue-500 hover:text-blue-100"
              >
                Bulk email supervisors (demo)
              </button>
            </div>
          </header>

          <div class="mt-4 flex items-center gap-3">
            <div class="relative flex-1 max-w-md">
              <MagnifyingGlassIcon
                class="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                class="block w-full rounded-lg border border-slate-300 bg-white px-9 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                placeholder="Search by student, topic, or supervisor"
              >
            </div>
          </div>

          <div class="mt-4 overflow-x-auto">
            <table class="min-w-full text-xs">
              <thead class="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th
                    scope="col"
                    class="px-3 py-2 text-left font-medium"
                  >
                    <input
                      type="checkbox"
                      class="h-3.5 w-3.5 rounded border-slate-300 bg-white text-blue-500 focus:ring-blue-500"
                      aria-label="Select all rows"
                    >
                  </th>
                  <th
                    scope="col"
                    class="px-3 py-2 text-left font-medium"
                  >
                    Student
                  </th>
                  <th
                    scope="col"
                    class="px-3 py-2 text-left font-medium"
                  >
                    Supervisor
                  </th>
                  <th
                    scope="col"
                    class="px-3 py-2 text-left font-medium"
                  >
                    Topic
                  </th>
                  <th
                    scope="col"
                    class="px-3 py-2 text-left font-medium"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    class="px-3 py-2 text-right font-medium"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800">
                <tr
                  v-for="row in rows"
                  :key="row.id"
                  class="hover:bg-slate-900/80"
                >
                  <td class="px-3 py-3 align-top">
                    <input
                      type="checkbox"
                      class="h-3.5 w-3.5 rounded border-slate-300 bg-white text-blue-500 focus:ring-blue-500"
                      :aria-label="`Select ${row.student}`"
                    >
                  </td>
                  <td class="px-3 py-3 align-top">
                    <div class="flex items-center gap-2">
                      <img
                        :src="`https://ui-avatars.com/api/?name=${encodeURIComponent(row.student)}&background=2563EB&color=fff`"
                        :alt="row.student"
                        class="h-7 w-7 rounded-full object-cover"
                      >
                      <div>
                        <p class="font-medium text-slate-900">
                          {{ row.student }}
                        </p>
                        <p class="text-[11px] text-slate-500">
                          {{ row.programme }}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td class="px-3 py-3 align-top">
                    <p class="text-[11px] text-slate-900">
                      {{ row.supervisor }}
                    </p>
                    <p class="text-[11px] text-slate-500">
                      Supervisor
                    </p>
                  </td>
                  <td class="px-3 py-3 align-top max-w-xs">
                    <p class="text-[11px] font-medium text-slate-900 line-clamp-2">
                      {{ row.topic }}
                    </p>
                  </td>
                  <td class="px-3 py-3 align-top">
                    <span
                      class="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
                      :class="row.status === 'Active'
                        ? 'border-emerald-500/50 bg-emerald-50 text-emerald-700'
                        : 'border-amber-500/50 bg-amber-50 text-amber-700'"
                    >
                      <span
                        class="h-1.5 w-1.5 rounded-full"
                        :class="row.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'"
                      />
                      {{ row.status }}
                    </span>
                  </td>
                  <td class="px-3 py-3 align-top text-right">
                    <button
                      type="button"
                      @click="router.push(`/admin/students-cohorts`)"
                      class="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] text-slate-700 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50"
                    >
                      Open record
                      <ChevronRightIcon class="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section
          class="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
        >
          <div class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70">
            <h2 class="text-sm font-semibold text-slate-900">
              Bulk actions
            </h2>
            <p class="mt-1 text-xs text-slate-500">
              Visual mock‑up of staff tools to coordinate cohorts without manual spreadsheet work.
            </p>
            <div class="mt-4 flex flex-wrap gap-2 text-[11px]">
              <button
                type="button"
                @click="alert('Marking selected students as ethics not required')"
                class="inline-flex items-center rounded-full border border-blue-500/70 bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-500"
              >
                Mark selected as "Ethics not required"
              </button>
              <button
                type="button"
                @click="alert('Opening supervisor assignment pilot')"
                class="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50"
              >
                Assign selected to supervisor (pilot)
              </button>
            </div>
          </div>

          <aside
            class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70"
            aria-label="Activity log"
          >
            <h2 class="text-sm font-semibold text-slate-900">
              Activity log
            </h2>
            <p class="mt-1 text-xs text-slate-500">
              Recent system events across students, supervisors, and staff.
            </p>

            <ol class="mt-3 space-y-2 text-[11px]">
              <li
                v-for="item in activityLog"
                :key="item.id"
                class="flex gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2"
              >
                <div class="flex flex-col items-center mt-0.5">
                  <span class="text-slate-500">{{ item.time }}</span>
                  <span
                    class="mt-1 h-1 w-1 rounded-full"
                    :class="item.type === 'submission'
                      ? 'bg-sky-500'
                      : item.type === 'approval'
                        ? 'bg-emerald-500'
                        : 'bg-slate-400'"
                  />
                </div>
                <div>
                  <div class="text-slate-800">
                    <p class="font-medium">{{ item.actor }}</p>
                    <p class="text-slate-600 text-xs mt-1">{{ item.description }}</p>
                  </div>
                </div>
              </li>
            </ol>
          </aside>
        </section>
      </main>
    </div>
</template>

