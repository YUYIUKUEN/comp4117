<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Bars3Icon,
  HomeIcon,
  ClipboardDocumentListIcon,
  DocumentArrowUpIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  ChevronRightIcon,
  EnvelopeIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/vue/24/outline';
import { AcademicCapIcon } from '@heroicons/vue/24/solid';

const sidebarOpen = ref(false);

const student = {
  name: 'Student Chan Hoi Ting',
  programme: 'BSocSc (Hons) in Geography',
  concentration: 'Urban & Regional Studies',
  avatar:
    'https://ui-avatars.com/api/?name=Student+Chan&background=2563EB&color=fff',
  email: 'student001@life.hkbu.edu.hk',
};

const currentTopic = {
  title:
    'Examining the Impact of Smart City Policies on Walkability in Kowloon East',
  supervisor: {
    name: 'Dr. Emily Lee',
    email: 'emilylee@hkbu.edu.hk',
  },
  concentration: 'Urban Planning & Smart Cities',
  status: 'Approved',
  code: 'FYP-GEOG-2026-018',
};

const submissionSteps = [
  {
    id: 'topic-planning',
    title: 'Topic Planning Form',
    status: 'Completed',
    due: '2025-11-15',
    submittedOn: '2025-11-10',
  },
  {
    id: 'ethics-clearance',
    title: 'Ethics Clearance (if applicable)',
    status: 'Not Required',
    due: '—',
    submittedOn: null,
  },
  {
    id: 'progress-1',
    title: 'Progress Report 1',
    status: 'Overdue',
    due: '2026-02-01',
    submittedOn: null,
  },
  {
    id: 'progress-2',
    title: 'Progress Report 2',
    status: 'Upcoming',
    due: '2026-04-10',
    submittedOn: null,
  },
  {
    id: 'final-report',
    title: 'Final Report & Presentation Materials',
    status: 'Not started',
    due: '2026-05-25',
    submittedOn: null,
  },
];

const upcomingDeadlines = [
  {
    label: 'Progress Report 1',
    date: '12 Feb 2026 (extended)',
    daysLeft: -3,
  },
  {
    label: 'Progress Report 2',
    date: '10 Apr 2026',
    daysLeft: 65,
  },
  {
    label: 'Final Report',
    date: '25 May 2026',
    daysLeft: 110,
  },
];

const recentFeedback = {
  from: 'Dr. Emily Lee',
  role: 'Supervisor',
  date: '29 Jan 2026',
  excerpt:
    'Your literature review is progressing well. Please clarify how you will operationalise “walkability” and consider including at least one qualitative method alongside GIS analysis.',
};

const navItems = [
  { name: 'Home', icon: HomeIcon, active: true },
  { name: 'My Topic', icon: ClipboardDocumentListIcon, active: false },
  { name: 'Submissions', icon: DocumentArrowUpIcon, active: false },
  { name: 'Feedback', icon: ChatBubbleLeftRightIcon, active: false },
  { name: 'History', icon: ClockIcon, active: false },
];

const overallCompletion = computed(() => {
  const completed = submissionSteps.filter((s) =>
    ['Completed', 'Not Required'].includes(s.status)
  ).length;
  return Math.round((completed / submissionSteps.length) * 100);
});
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
      aria-label="Student navigation"
    >
      <div class="flex h-14 items-center gap-2 px-4 border-b border-slate-200">
        <div
          class="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600/90 shadow shadow-blue-500/40"
        >
          <AcademicCapIcon
            class="h-5 w-5 text-white"
            aria-hidden="true"
          />
        </div>
        <div class="flex flex-col">
          <span class="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            Student
          </span>
          <span class="text-xs font-semibold text-slate-900">
            FYP Dashboard
          </span>
        </div>
      </div>

      <nav
        class="mt-3 px-2 space-y-1 text-sm"
        aria-label="Primary"
      >
        <button
          v-for="item in navItems"
          :key="item.name"
          type="button"
          class="flex w-full items-center gap-2 rounded-lg px-3 py-2 transition
                 hover:bg-slate-100 hover:text-slate-900"
          :class="
            item.active
              ? 'bg-slate-100 text-slate-900'
              : 'text-slate-600'
          "
        >
          <component
            :is="item.icon"
            class="h-5 w-5 text-slate-300"
            aria-hidden="true"
          />
          <span class="flex-1 text-left">
            {{ item.name }}
          </span>
          <span
            v-if="item.name === 'Submissions'"
            class="ml-auto inline-flex items-center justify-center rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[11px] font-medium text-blue-200"
          >
            1 overdue
          </span>
        </button>
      </nav>

      <div class="mt-6 border-t border-slate-200 pt-4 px-4 text-xs text-slate-500">
        <p class="font-medium text-slate-800">
          Semester timeline
        </p>
        <p class="mt-1">
          You are currently in the
          <span class="text-blue-300 font-medium">Progress Check</span> phase.
        </p>
        <div class="mt-3 flex items-center gap-2">
          <div class="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
            <div
              class="h-1.5 bg-blue-500 rounded-full"
              :style="{ width: `${overallCompletion}%` }"
            />
          </div>
          <span class="text-[11px] text-slate-600">
            {{ overallCompletion }}%
          </span>
        </div>
      </div>
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
              Dashboard
            </p>
            <p class="text-sm font-semibold text-slate-900">
              Welcome back, {{ student.name.split(' ')[0] }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <div class="hidden sm:flex flex-col items-end text-[11px]">
            <span class="font-medium text-slate-900">
              {{ student.name }}
            </span>
            <span class="text-slate-500">
              {{ student.programme }}
            </span>
          </div>
          <button
            type="button"
            class="relative flex items-center gap-2 rounded-full border border-slate-300 bg-white px-2.5 py-1.5 text-xs hover:border-blue-500/70 hover:bg-blue-50"
          >
            <img
              :src="student.avatar"
              alt="Student avatar"
              class="h-8 w-8 rounded-full object-cover"
            >
            <span class="hidden sm:inline text-slate-700">
              Student
            </span>
            <ArrowRightOnRectangleIcon
              class="h-4 w-4 text-slate-500"
              aria-hidden="true"
            />
          </button>
        </div>
      </header>

      <main class="flex-1 px-4 sm:px-6 pb-6 pt-4 sm:pt-5">
        <div class="grid gap-4 sm:gap-6 lg:grid-cols-3 lg:grid-rows-[auto_auto]">
          <section
            class="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70"
            aria-labelledby="current-topic-heading"
          >
            <header class="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="current-topic-heading"
                  class="text-sm font-semibold text-slate-900"
                >
                  Current Final Year Project Topic
                </h2>
                <p class="mt-1 text-xs text-slate-500">
                  {{ currentTopic.code }} · {{ student.concentration }}
                </p>
              </div>
              <span
                class="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-medium text-emerald-300 border border-emerald-500/30"
              >
                <CheckCircleIcon
                  class="h-3.5 w-3.5"
                  aria-hidden="true"
                />
                {{ currentTopic.status }}
              </span>
            </header>

            <div class="mt-3 space-y-3">
              <p class="text-sm font-medium text-slate-900 leading-snug">
                {{ currentTopic.title }}
              </p>

              <div class="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <div class="flex items-center gap-2">
                  <img
                    src="https://ui-avatars.com/api/?name=Emily+Lee&background=0F172A&color=fff"
                    alt="Supervisor avatar"
                    class="h-7 w-7 rounded-full object-cover ring-2 ring-slate-950"
                  >
                  <div>
                    <p class="font-medium text-slate-900">
                      {{ currentTopic.supervisor.name }}
                    </p>
                    <p class="inline-flex items-center gap-1 text-[11px] text-slate-500">
                      <EnvelopeIcon
                        class="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                      {{ currentTopic.supervisor.email }}
                    </p>
                  </div>
                </div>
                <div class="hidden sm:block h-8 w-px bg-slate-200" />
                <div class="flex flex-col gap-0.5 text-[11px] sm:text-xs">
                  <span class="text-slate-500">
                    Concentration
                  </span>
                  <span class="font-medium text-slate-900">
                    {{ currentTopic.concentration }}
                  </span>
                </div>
              </div>

              <div class="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-600">
                <span
                  class="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-blue-700 border border-blue-200"
                >
                  Smart City · Walkability
                </span>
                <span
                  class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700 border border-slate-200"
                >
                  Individual project
                </span>
                <span
                  class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700 border border-slate-200"
                >
                  2025–26 Cohort
                </span>
              </div>

              <div class="mt-2 flex items-center justify-between gap-4 text-[11px] sm:text-xs text-slate-500">
                <p>
                  To request a topic title adjustment, submit a
                  <span class="text-blue-600 font-medium">Topic Change Request</span>
                  under <span class="font-medium text-slate-800">My Topic</span>.
                </p>
                <button
                  type="button"
                  class="hidden sm:inline-flex items-center gap-1 rounded-full border border-slate-300 px-2.5 py-1 text-[11px] text-slate-700 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50"
                >
                  View topic history
                  <ChevronRightIcon
                    class="h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>
          </section>

          <section
            class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70"
            aria-labelledby="deadlines-heading"
          >
            <header class="flex items-center justify-between gap-2">
              <div>
                <h2
                  id="deadlines-heading"
                  class="text-sm font-semibold text-slate-900"
                >
                  Upcoming deadlines
                </h2>
                <p class="mt-1 text-xs text-slate-500">
                  Based on your programme timeline
                </p>
              </div>
              <ClockIcon
                class="h-5 w-5 text-slate-300"
                aria-hidden="true"
              />
            </header>

            <div class="mt-4 space-y-3">
              <div
                v-for="deadline in upcomingDeadlines"
                :key="deadline.label"
                class="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 border border-slate-200"
              >
                <div class="flex flex-col">
                  <span class="text-xs font-medium text-slate-900">
                    {{ deadline.label }}
                  </span>
                  <span class="text-[11px] text-slate-500">
                    {{ deadline.date }}
                  </span>
                </div>
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border"
                  :class="
                    deadline.daysLeft < 0
                      ? 'bg-rose-500/15 text-rose-200 border-rose-500/40'
                      : deadline.daysLeft <= 7
                        ? 'bg-amber-500/15 text-amber-200 border-amber-500/40'
                        : 'bg-emerald-500/15 text-emerald-200 border-emerald-500/40'
                  "
                >
                  <span v-if="deadline.daysLeft < 0">
                    {{ Math.abs(deadline.daysLeft) }} days overdue
                  </span>
                  <span v-else>
                    {{ deadline.daysLeft }} days left
                  </span>
                </span>
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-200">
              <p class="flex items-center justify-between text-[11px] text-slate-500">
                <span>Overall submission progress</span>
                <span class="font-medium text-slate-800">
                  {{ overallCompletion }}% complete
                </span>
              </p>
              <div class="mt-2 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  class="h-1.5 rounded-full bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-400"
                  :style="{ width: `${overallCompletion}%` }"
                />
              </div>
            </div>
          </section>

          <section
            class="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70 mt-4 lg:mt-5"
            aria-labelledby="submission-status-heading"
          >
            <header class="flex items-center justify-between gap-2">
              <div>
                <h2
                  id="submission-status-heading"
                  class="text-sm font-semibold text-slate-900"
                >
                  Submission checklist
                </h2>
                <p class="mt-1 text-xs text-slate-500">
                  Track required documents across the full FYP lifecycle.
                </p>
              </div>
            </header>

            <div class="mt-3 divide-y divide-slate-200 text-xs">
              <article
                v-for="step in submissionSteps"
                :key="step.id"
                class="flex flex-col sm:flex-row sm:items-center gap-2 py-2.5"
              >
                <div class="flex items-start gap-2 flex-1">
                  <div
                    class="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border"
                    :class="[
                      step.status === 'Completed'
                        ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
                        : step.status === 'Overdue'
                          ? 'border-rose-500/60 bg-rose-500/10 text-rose-300'
                          : step.status === 'Upcoming'
                            ? 'border-amber-500/60 bg-amber-500/10 text-amber-300'
                            : step.status === 'Not Required'
                              ? 'border-slate-300 bg-slate-100 text-slate-500'
                              : 'border-slate-300 bg-slate-50 text-slate-600',
                    ]"
                    aria-hidden="true"
                  >
                    <CheckCircleIcon
                      v-if="step.status === 'Completed' || step.status === 'Not Required'"
                      class="h-4 w-4"
                    />
                    <ExclamationCircleIcon
                      v-else-if="step.status === 'Upcoming'"
                      class="h-4 w-4"
                    />
                    <XCircleIcon
                      v-else-if="step.status === 'Overdue'"
                      class="h-4 w-4"
                    />
                    <ClockIcon
                      v-else
                      class="h-4 w-4"
                    />
                  </div>
                  <div>
                    <h3 class="text-xs font-medium text-slate-900">
                      {{ step.title }}
                    </h3>
                    <p class="mt-0.5 text-[11px] text-slate-500">
                      Due: <span class="font-medium text-slate-800">{{ step.due }}</span>
                      <span
                        v-if="step.submittedOn"
                        class="ml-2 text-slate-400"
                      >
                        · Submitted {{ step.submittedOn }}
                      </span>
                      <span
                        v-else-if="step.status === 'Overdue'"
                        class="ml-2 font-medium text-rose-600"
                      >
                        · Please submit as soon as possible
                      </span>
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-2 sm:justify-end">
                  <span
                    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border"
                    :class="[
                      step.status === 'Completed'
                        ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/40'
                        : step.status === 'Overdue'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : step.status === 'Upcoming'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : step.status === 'Not Required'
                              ? 'bg-slate-100 text-slate-600 border-slate-300'
                              : 'bg-slate-50 text-slate-700 border-slate-300',
                    ]"
                  >
                    {{ step.status }}
                  </span>
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 rounded-full border border-slate-300 px-2.5 py-1 text-[11px] text-slate-700 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50"
                  >
                    {{ step.submittedOn ? 'View' : 'Submit' }}
                  </button>
                </div>
              </article>
            </div>
          </section>

          <section
            class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70 mt-4 lg:mt-5"
            aria-labelledby="feedback-heading"
          >
            <header class="flex items-center justify-between gap-2">
              <div>
                <h2
                  id="feedback-heading"
                  class="text-sm font-semibold text-slate-900"
                >
                  Recent supervisor feedback
                </h2>
                <p class="mt-1 text-xs text-slate-500">
                  Remember to acknowledge feedback in your next meeting.
                </p>
              </div>
              <ChatBubbleLeftRightIcon
                class="h-5 w-5 text-slate-300"
                aria-hidden="true"
              />
            </header>

            <article class="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-xs">
              <header class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <img
                    src="https://ui-avatars.com/api/?name=Emily+Lee&background=1D4ED8&color=fff"
                    alt="Supervisor avatar"
                    class="h-7 w-7 rounded-full object-cover"
                  >
                  <div>
                    <p class="text-slate-900 font-medium">
                      {{ recentFeedback.from }}
                    </p>
                    <p class="text-[11px] text-slate-500">
                      {{ recentFeedback.role }} · {{ recentFeedback.date }}
                    </p>
                  </div>
                </div>
                <span
                  class="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700 border border-blue-200"
                >
                  Progress Report 1
                </span>
              </header>

              <p class="mt-3 text-[11px] leading-relaxed text-slate-700">
                {{ recentFeedback.excerpt }}
              </p>

              <div class="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                <button
                  type="button"
                  class="inline-flex items-center gap-1 text-blue-700 hover:text-blue-800"
                >
                  View full feedback thread
                  <ChevronRightIcon
                    class="h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-full border border-slate-300 px-2 py-0.5 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50"
                >
                  Add reflection note
                </button>
              </div>
            </article>

            <p class="mt-3 text-[11px] text-slate-500">
              Feedback and progress logs are kept even if your topic title changes, so you do not lose previous work.
            </p>
          </section>
        </div>
      </main>
    </div>
  </div>
</template>

