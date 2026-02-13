<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  Bars3Icon,
  ChevronRightIcon,
  PaperClipIcon,
  CloudArrowUpIcon,
  LockClosedIcon,
  EyeSlashIcon,
  DocumentArrowUpIcon,
  ClipboardDocumentListIcon,
  HomeIcon,
} from '@heroicons/vue/24/outline';
import { AcademicCapIcon } from '@heroicons/vue/24/outline';

const router = useRouter();
const sidebarOpen = ref(false);
const declarationChecked = ref(true);
const activeView = ref<'submissions' | 'checklist'>('submissions');

const goToDashboard = () => {
  router.push('/dashboard');
};

const submissionPhases = [
  {
    id: 1,
    name: 'Initial Statement',
    dueDate: '2025-11-15',
    status: 'Completed',
    submittedAt: '2025-11-10',
  },
  {
    id: 2,
    name: 'Progress Report 1',
    dueDate: '2026-02-01',
    status: 'Overdue',
    submittedAt: null,
  },
  {
    id: 3,
    name: 'Progress Report 2',
    dueDate: '2026-04-10',
    status: 'Pending',
    submittedAt: null,
  },
  {
    id: 4,
    name: 'Final Dissertation',
    dueDate: '2026-05-25',
    status: 'Not Started',
    submittedAt: null,
  },
];

const files = [
  {
    id: 1,
    name: 'Progress_Report_1_ChanHoiTing.pdf',
    uploadedAt: '29 Jan 2026 • 21:14',
    size: '1.2 MB',
  },
  {
    id: 2,
    name: 'GIS_Maps_Appendix.zip',
    uploadedAt: '29 Jan 2026 • 21:09',
    size: '24.7 MB',
  },
];
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
        <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 shadow-sm shadow-blue-500/40">
          <AcademicCapIcon
            class="h-5 w-5 text-white"
            aria-hidden="true"
          />
        </div>
        <div class="flex flex-col">
          <span class="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            Submissions
          </span>
          <span class="text-xs font-semibold text-slate-900">
            Progress Report
          </span>
        </div>
      </div>

      <nav
        class="mt-3 px-2 space-y-1 text-sm"
        aria-label="Primary"
      >
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-800 hover:text-slate-50"
          :class="activeView === 'submissions' ? 'bg-slate-800 text-slate-50' : 'text-slate-300'"
          @click="activeView = 'submissions'"
        >
          <DocumentArrowUpIcon class="h-5 w-5 text-slate-200" />
          <span class="flex-1 text-left">My Submissions</span>
        </button>
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-800 hover:text-slate-50"
          :class="activeView === 'checklist' ? 'bg-slate-800 text-slate-50' : 'text-slate-300'"
          @click="activeView = 'checklist'"
        >
          <ClipboardDocumentListIcon class="h-5 w-5" />
          <span class="flex-1 text-left">Submission checklist</span>
        </button>
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-slate-50"
          @click="goToDashboard"
        >
          <HomeIcon class="h-5 w-5 text-slate-300" />
          <span class="flex-1 text-left">Back to Dashboard</span>
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
          <nav
            class="flex items-center gap-1 text-[11px] text-slate-500"
            aria-label="Breadcrumb"
          >
            <button
              type="button"
              class="hover:text-slate-900"
              @click="goToDashboard"
            >
              My Submissions
            </button>
            <ChevronRightIcon class="h-3.5 w-3.5" />
            <button
              type="button"
              class="hover:text-slate-900"
            >
              Progress Report 1
            </button>
          </nav>
        </div>
        <div class="hidden sm:flex items-center gap-3 text-xs text-slate-500">
          <span class="rounded-full border border-slate-200 px-3 py-1 bg-slate-50">
            Draft saved locally
          </span>
        </div>
      </header>

      <main class="flex-1 px-4 sm:px-6 pb-6 pt-4 sm:pt-5">
        <!-- Submissions View -->
        <div v-if="activeView === 'submissions'">
        <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p class="text-xs uppercase tracking-[0.2em] text-slate-500">
              Progress report
            </p>
            <h1 class="mt-1 text-sm sm:text-base font-semibold text-slate-900">
              Progress Report 1 · Smart City Walkability in Kowloon East
            </h1>
            <p class="mt-1 text-xs text-slate-500">
              This view illustrates how a single submission keeps files, declarations, feedback, and grading together.
            </p>
          </div>
          <div class="flex flex-wrap gap-2 text-[11px] items-center">
            <span
              class="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 font-medium text-amber-700"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-amber-400" />
              In review by supervisor
            </span>
            <button
              type="button"
              class="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50"
            >
              Download all as ZIP
            </button>
          </div>
        </header>

        <div class="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1.1fr)]">
          <section class="space-y-4">
            <section
              aria-labelledby="files-heading"
              class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70"
            >
              <header class="flex items-center justify-between gap-2">
                <div>
                  <h2
                    id="files-heading"
                    class="text-sm font-semibold text-slate-900"
                  >
                    Uploaded files
                  </h2>
                  <p class="mt-1 text-xs text-slate-500">
                    Files shown here are static examples representing what a real submission would include.
                  </p>
                </div>
                <CloudArrowUpIcon class="h-5 w-5 text-slate-500" />
              </header>

              <div
                class="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500"
              >
                <PaperClipIcon class="h-6 w-6 text-slate-500" />
                <p class="mt-2">
                  Drag and drop files here, or
                  <span class="text-blue-300 font-medium">browse</span>
                  from your device.
                </p>
                <p class="mt-1 text-[11px]">
                  PDF, DOCX, ZIP up to 50MB.
                </p>
              </div>

              <ul class="mt-4 space-y-2 text-xs">
                <li
                  v-for="file in files"
                  :key="file.id"
                  class="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  <div class="flex items-center gap-2">
                    <div
                      class="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-700"
                    >
                      <PaperClipIcon class="h-4 w-4" />
                    </div>
                    <div>
                      <p class="text-slate-900">
                        {{ file.name }}
                      </p>
                      <p class="text-[11px] text-slate-500">
                        {{ file.uploadedAt }} · {{ file.size }}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="inline-flex items-center rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] text-slate-700 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50"
                  >
                    Preview
                  </button>
                </li>
              </ul>
            </section>

            <section
              aria-labelledby="feedback-heading"
              class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70"
            >
              <h2
                id="feedback-heading"
                class="text-sm font-semibold text-slate-900"
              >
                Declarations & feedback
              </h2>

              <div class="mt-3 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <input
                  id="declaration"
                  v-model="declarationChecked"
                  type="checkbox"
                  class="mt-1 h-3.5 w-3.5 rounded border-slate-300 bg-white text-blue-500 focus:ring-blue-500"
                >
                <label
                  for="declaration"
                  class="text-[11px] text-slate-800"
                >
                  This report replaces the need for a separate written document
                  for this checkpoint, or is not required for my project as
                  agreed with my supervisor.
                </label>
              </div>

              <div class="mt-4 grid gap-4 md:grid-cols-2">
                <div class="space-y-1 text-xs">
                  <label class="font-medium text-slate-800">
                    Visible feedback to student
                  </label>
                  <textarea
                    rows="6"
                    class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                  >You are broadly on track with your data collection, but please prioritise completing at least two weekday and two weekend field observations before the next meeting. Clarify in your report how you will deal with potential weather disruptions.</textarea>
                  <p class="text-[11px] text-slate-500">
                    This text box represents supervisor comments visible to the student.
                  </p>
                </div>

                <div class="space-y-1 text-xs">
                  <div class="flex items-center justify-between">
                    <label class="font-medium text-slate-800">
                      Confidential supervisor notes
                    </label>
                    <span class="inline-flex items-center gap-1 text-[11px] text-slate-500">
                      <LockClosedIcon class="h-3.5 w-3.5" />
                      Internal only
                    </span>
                  </div>
                  <div
                    class="relative rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700"
                  >
                    <EyeSlashIcon class="h-5 w-5 absolute right-2 top-2 text-slate-500" />
                    <p class="text-[11px]">
                      Student is engaged and attends meetings consistently. Encourage further
                      independence in planning fieldwork schedule. No major risk concerns at
                      this stage. Consider recommending ethics application if intercept surveys
                      are extended.
                    </p>
                    <p class="mt-2 text-[10px] text-slate-500">
                      In a real system this section would be visible only to supervisors and programme staff.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </section>
        </div>
        </div>

        <!-- Checklist View -->
        <div v-else-if="activeView === 'checklist'">
          <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <p class="text-xs uppercase tracking-[0.2em] text-slate-500">
                Submission Tracking
              </p>
              <h1 class="mt-1 text-sm sm:text-base font-semibold text-slate-900">
                All Submission Phases
              </h1>
              <p class="mt-1 text-xs text-slate-500">
                Track the status and deadlines of all your dissertation submission phases.
              </p>
            </div>
          </header>

          <section class="space-y-3">
            <div
              v-for="phase in submissionPhases"
              :key="phase.id"
              class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70 hover:border-blue-300 hover:shadow-md hover:shadow-blue-100 cursor-pointer transition-all"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <h3 class="font-semibold text-slate-900">{{ phase.name }}</h3>
                  <div class="mt-2 grid grid-cols-2 gap-3 text-xs text-slate-600">
                    <div>
                      <p class="text-slate-500">Due Date</p>
                      <p class="font-medium text-slate-900">{{ phase.dueDate }}</p>
                    </div>
                    <div>
                      <p class="text-slate-500">Submitted</p>
                      <p class="font-medium text-slate-900">{{ phase.submittedAt || 'Not submitted' }}</p>
                    </div>
                  </div>
                </div>
                <div class="flex flex-col items-end gap-2">
                  <span
                    class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                    :class="{
                      'bg-emerald-50 text-emerald-700 border border-emerald-200': phase.status === 'Completed',
                      'bg-amber-50 text-amber-700 border border-amber-200': phase.status === 'Overdue',
                      'bg-blue-50 text-blue-700 border border-blue-200': phase.status === 'Pending',
                      'bg-slate-100 text-slate-600 border border-slate-200': phase.status === 'Not Started',
                    }"
                  >
                    <span
                      class="h-2 w-2 rounded-full"
                      :class="{
                        'bg-emerald-500': phase.status === 'Completed',
                        'bg-amber-500': phase.status === 'Overdue',
                        'bg-blue-500': phase.status === 'Pending',
                        'bg-slate-400': phase.status === 'Not Started',
                      }"
                    />
                    {{ phase.status }}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  </div>
</template>

