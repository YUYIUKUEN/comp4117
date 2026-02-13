<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  Bars3Icon,
  AcademicCapIcon,
  UserGroupIcon,
  EnvelopeOpenIcon,
  BellAlertIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  PencilIcon,
} from '@heroicons/vue/24/outline';

const sidebarOpen = ref(false);

const router = useRouter();
const currentPage = ref('dashboard');

const supervisor = {
  name: 'Dr. Emily Lee',
  dept: 'Department of Geography',
  avatar:
    'https://ui-avatars.com/api/?name=Emily+Lee&background=0F172A&color=fff',
};

const students = ref([
  {
    id: 1,
    name: 'Student Chan Hoi Ting',
    programme: 'BSocSc Geography',
    topic: 'Smart City Walkability in Kowloon East',
    submissions: {
      topicPlanning: 'Completed',
      ethics: 'Not Required',
      progress1: 'Overdue',
    },
    pendingApprovals: 1,
  },
  {
    id: 2,
    name: 'Student Lau Tsz Yan',
    programme: 'BSocSc Geography',
    topic: 'Urban Farming and Community Resilience in Sham Shui Po',
    submissions: {
      topicPlanning: 'Completed',
      ethics: 'Completed',
      progress1: 'In Review',
    },
    pendingApprovals: 0,
  },
]);

const stats = computed(() => {
  const total = students.value.length;
  const pending = students.value.filter((s) => s.pendingApprovals > 0).length;
  const overdue = students.value.filter(
    (s) => s.submissions.progress1 === 'Overdue',
  ).length;
  return { total, pending, overdue };
});

const goToFeedbackGrading = () => {
  router.push('/supervisor/feedback-grading');
};
</script>

<template>
  <div class="min-h-[calc(100vh-3.25rem)] bg-slate-50 text-slate-900 flex">
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-20 bg-black/40 lg:hidden"
      aria-hidden="true"
      @click="sidebarOpen = false"
    />

    <aside
      class="fixed z-30 inset-y-0 left-0 w-64 transform bg-white border-r border-slate-200 transition-transform duration-200 ease-out
             lg:static lg:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
      aria-label="Supervisor navigation"
    >
      <div class="flex h-14 items-center gap-2 px-4 border-b border-slate-200">
        <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 shadow-sm shadow-blue-500/40">
          <AcademicCapIcon
            class="h-5 w-5 text-white"
            aria-hidden="true"
          />
        </div>
        <div class="flex flex-col">
          <span class="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            Supervisor
          </span>
          <span class="text-xs font-semibold text-slate-900">
            FYP Overview
          </span>
        </div>
      </div>

      <nav
        class="mt-3 px-2 space-y-1 text-sm"
        aria-label="Primary"
      >
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-lg px-3 py-2"
          :class="currentPage === 'dashboard'
            ? 'bg-slate-100 text-slate-900'
            : 'text-slate-700 hover:bg-slate-50'"
          @click="currentPage = 'dashboard'"
        >
          <UserGroupIcon class="h-5 w-5 text-slate-400" />
          <span class="flex-1 text-left">My Supervised Students</span>
        </button>
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50"
          @click="goToFeedbackGrading"
        >
          <PencilIcon class="h-5 w-5 text-slate-400" />
          <span class="flex-1 text-left">Feedback & Grading</span>
        </button>
      </nav>
    </aside>

    <div class="flex-1 flex flex-col min-w-0">
      <header
        class="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur"
      >
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            aria-label="Toggle navigation"
            @click="sidebarOpen = !sidebarOpen"
          >
            <Bars3Icon
              class="h-6 w-6"
              aria-hidden="true"
            />
          </button>
          <div>
            <p class="text-[11px] uppercase tracking-[0.2em] text-slate-500">
              Supervisor dashboard
            </p>
            <p class="text-sm font-semibold text-slate-900">
              Overview of your supervisees
            </p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <button
            type="button"
            class="relative inline-flex items-center justify-center rounded-full border border-slate-300 bg-white p-1.5 hover:border-blue-500"
          >
            <BellAlertIcon class="h-5 w-5 text-slate-600" />
            <span
              class="absolute -top-0.5 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-medium text-white"
            >
              {{ stats.pending }}
            </span>
          </button>
          <button
            type="button"
            class="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-2.5 py-1.5 text-xs hover:border-blue-500 hover:bg-blue-50"
          >
            <img
              :src="supervisor.avatar"
              alt="Supervisor avatar"
              class="h-8 w-8 rounded-full object-cover"
            >
            <div class="hidden sm:flex flex-col items-start">
              <span class="font-medium text-slate-900">
                {{ supervisor.name }}
              </span>
              <span class="text-slate-500">
                {{ supervisor.dept }}
              </span>
            </div>
          </button>
        </div>
      </header>

      <main class="flex-1 px-4 sm:px-6 pb-6 pt-4 sm:pt-5">
        <section
          aria-label="Summary statistics"
          class="grid gap-4 sm:grid-cols-3"
        >
          <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70">
            <p class="text-xs text-slate-500">
              Total supervised students
            </p>
            <p class="mt-2 text-2xl font-semibold text-slate-900">
              {{ stats.total }}
            </p>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70">
            <p class="text-xs text-slate-500">
              Pending actions
            </p>
            <p class="mt-2 text-2xl font-semibold text-amber-300">
              {{ stats.pending }}
            </p>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70">
            <p class="text-xs text-slate-500">
              Overdue progress reports
            </p>
            <p class="mt-2 text-2xl font-semibold text-rose-300">
              {{ stats.overdue }}
            </p>
          </div>
        </section>

        <section
          class="mt-5 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70"
          aria-label="Supervised students"
        >
          <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 class="text-sm font-semibold text-slate-900">
                Supervised students
              </h2>
              <p class="mt-1 text-xs text-slate-500">
                Track submissions, approvals, and send reminders from one place.
              </p>
            </div>
            <div class="flex flex-wrap gap-2 text-[11px]">
              <button
                type="button"
                class="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50"
              >
                <ArrowPathIcon class="h-3.5 w-3.5" />
                Refresh list
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-1 rounded-full border border-blue-500/70 bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-500"
              >
                <EnvelopeOpenIcon class="h-3.5 w-3.5" />
                Send bulk reminder (demo)
              </button>
            </div>
          </header>

          <div class="mt-4 overflow-x-auto">
            <table class="min-w-full text-xs">
              <thead class="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
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
                    Topic
                  </th>
                  <th
                    scope="col"
                    class="px-3 py-2 text-left font-medium"
                  >
                    Submissions
                  </th>
                  <th
                    scope="col"
                    class="px-3 py-2 text-center font-medium"
                  >
                    Pending
                  </th>
                  <th
                    scope="col"
                    class="px-3 py-2 text-right font-medium"
                  >
                    Quick actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800">
                <tr
                  v-for="s in students"
                  :key="s.id"
                  class="hover:bg-slate-900/80"
                >
                  <td class="px-3 py-3 align-top">
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
                          {{ s.programme }}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td class="px-3 py-3 align-top max-w-xs">
                    <p class="text-[11px] font-medium text-slate-900 line-clamp-2">
                      {{ s.topic }}
                    </p>
                    <button
                      type="button"
                      class="mt-1 inline-flex items-center gap-1 text-[11px] text-blue-700 hover:text-blue-800"
                    >
                      View topic details
                      <ChevronRightIcon class="h-3.5 w-3.5" />
                    </button>
                  </td>
                  <td class="px-3 py-3 align-top">
                    <div class="flex flex-col gap-1 text-[11px]">
                      <div class="flex items-center gap-1.5">
                        <span class="w-20 text-slate-500">Topic planning</span>
                        <span
                          class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5"
                          :class="s.submissions.topicPlanning === 'Completed'
                            ? 'border-emerald-500/50 bg-emerald-50 text-emerald-700'
                            : 'border-slate-300 bg-slate-50 text-slate-700'"
                        >
                          <CheckCircleIcon class="h-3.5 w-3.5" />
                          {{ s.submissions.topicPlanning }}
                        </span>
                      </div>
                      <div class="flex items-center gap-1.5">
                        <span class="w-20 text-slate-500">Ethics</span>
                        <span
                          class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5"
                          :class="s.submissions.ethics === 'Completed'
                            ? 'border-emerald-500/50 bg-emerald-50 text-emerald-700'
                            : s.submissions.ethics === 'Not Required'
                              ? 'border-slate-300 bg-slate-100 text-slate-600'
                              : 'border-slate-300 bg-slate-50 text-slate-700'"
                        >
                          <CheckCircleIcon class="h-3.5 w-3.5" />
                          {{ s.submissions.ethics }}
                        </span>
                      </div>
                      <div class="flex items-center gap-1.5">
                        <span class="w-20 text-slate-500">Progress 1</span>
                        <span
                          class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5"
                          :class="s.submissions.progress1 === 'Completed'
                            ? 'border-emerald-500/50 bg-emerald-50 text-emerald-700'
                            : s.submissions.progress1 === 'Overdue'
                              ? 'border-rose-500/50 bg-rose-50 text-rose-700'
                              : s.submissions.progress1 === 'In Review'
                                ? 'border-amber-500/50 bg-amber-50 text-amber-700'
                                : 'border-slate-300 bg-slate-50 text-slate-700'"
                        >
                          <CheckCircleIcon
                            v-if="s.submissions.progress1 === 'Completed'"
                            class="h-3.5 w-3.5"
                          />
                          <XCircleIcon
                            v-else-if="s.submissions.progress1 === 'Overdue'"
                            class="h-3.5 w-3.5"
                          />
                          <ClockIcon
                            v-else
                            class="h-3.5 w-3.5"
                          />
                          {{ s.submissions.progress1 }}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td class="px-3 py-3 align-top text-center">
                    <span
                      v-if="s.pendingApprovals > 0"
                      class="inline-flex items-center justify-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 border border-amber-200"
                    >
                      {{ s.pendingApprovals }} pending
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center justify-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200"
                    >
                      Clear
                    </span>
                  </td>
                  <td class="px-3 py-3 align-top text-right">
                    <div class="flex flex-col gap-1 text-[11px] items-end">
                      <button
                        type="button"
                        class="inline-flex items-center gap-1 rounded-full border border-emerald-500/70 bg-emerald-600 px-2.5 py-1 text-white hover:bg-emerald-500"
                      >
                        Approve topic change
                      </button>
                      <button
                        type="button"
                        class="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-slate-700 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50"
                      >
                        View feedback
                      </button>
                      <button
                        type="button"
                        class="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-slate-700 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50"
                      >
                        Send reminder
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

