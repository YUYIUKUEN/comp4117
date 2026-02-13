<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  Bars3Icon,
  AcademicCapIcon,
  UserGroupIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
} from '@heroicons/vue/24/outline';

const router = useRouter();
const sidebarOpen = ref(false);
const currentPage = ref('students');
const searchQuery = ref('');

const supervisor = {
  name: 'Dr. Emily Lee',
  dept: 'Department of Geography',
};

const students = ref([
  {
    id: 1,
    name: 'Student Chan Hoi Ting',
    studentId: 'SID-001',
    programme: 'BSocSc Geography',
    topic: 'Smart City Walkability in Kowloon East',
    status: 'Active',
    progress1: 'Overdue',
    ethics: 'Not Required',
  },
  {
    id: 2,
    name: 'Student Lau Tsz Yan',
    studentId: 'SID-002',
    programme: 'BSocSc Geography',
    topic: 'Urban Farming and Community Resilience in Sham Shui Po',
    status: 'Active',
    progress1: 'In Review',
    ethics: 'Completed',
  },
  {
    id: 3,
    name: 'Student Wong Kai Ming',
    studentId: 'SID-003',
    programme: 'BBA Finance',
    topic: 'Digital Payment Adoption in Hong Kong SMEs',
    status: 'Active',
    progress1: 'Completed',
    ethics: 'Completed',
  },
  {
    id: 4,
    name: 'Student Ng Mei Ching',
    studentId: 'SID-004',
    programme: 'BSc Computer Science',
    topic: 'Blockchain Voting Systems for Democratic Processes',
    status: 'Pending',
    progress1: 'Pending',
    ethics: 'Completed',
  },
]);

const filteredStudents = ref(students.value);

const goToFeedbackGrading = () => {
  router.push('/supervisor/feedback-grading');
};

const goToStudentTopic = (studentId: number) => {
  router.push(`/supervisor/topic/${studentId}`);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Active':
      return 'bg-green-100 text-green-800';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'Completed':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
};

const getSubmissionStatusColor = (status: string) => {
  switch (status) {
    case 'Completed':
    case 'Approved':
      return 'text-green-600';
    case 'In Review':
      return 'text-blue-600';
    case 'Overdue':
      return 'text-red-600';
    case 'Pending':
      return 'text-yellow-600';
    case 'Not Required':
      return 'text-slate-500';
    default:
      return 'text-slate-600';
  }
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
          :class="currentPage === 'students'
            ? 'bg-slate-100 text-slate-900'
            : 'text-slate-700 hover:bg-slate-50'"
          @click="currentPage = 'students'"
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
              Supervisor view
            </p>
            <p class="text-sm font-semibold text-slate-900">
              All supervised students
            </p>
          </div>
        </div>
      </header>

      <main class="flex-1 px-4 sm:px-6 pb-6 pt-4 sm:pt-5 overflow-auto">
        <section
          class="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70"
          aria-label="Supervised students"
        >
          <header class="flex flex-col gap-4 border-b border-slate-200 p-4 sm:p-5">
            <div>
              <h2 class="text-sm font-semibold text-slate-900">
                Supervised Students
              </h2>
              <p class="mt-1 text-xs text-slate-500">
                Overview of all students you are supervising with their topics and submission status.
              </p>
            </div>

            <div class="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3">
              <MagnifyingGlassIcon class="h-4 w-4 text-slate-400" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search by name, ID, or topic..."
                class="w-full bg-slate-50 py-2 text-sm text-slate-900 placeholder-slate-500 outline-none"
              />
            </div>
          </header>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead
                class="border-b border-slate-200 bg-slate-50"
              >
                <tr>
                  <th class="px-4 py-3 text-left font-semibold text-slate-900">
                    Student Details
                  </th>
                  <th class="px-4 py-3 text-left font-semibold text-slate-900">
                    Topic
                  </th>
                  <th class="px-4 py-3 text-left font-semibold text-slate-900">
                    Programme
                  </th>
                  <th class="px-4 py-3 text-left font-semibold text-slate-900">
                    Progress 1
                  </th>
                  <th class="px-4 py-3 text-left font-semibold text-slate-900">
                    Status
                  </th>
                  <th class="px-4 py-3 text-center font-semibold text-slate-900">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                <tr
                  v-for="student in filteredStudents"
                  :key="student.id"
                  class="hover:bg-slate-50 transition-colors"
                >
                  <td class="px-4 py-3">
                    <div>
                      <p class="font-medium text-slate-900">
                        {{ student.name }}
                      </p>
                      <p class="text-xs text-slate-500">
                        {{ student.studentId }}
                      </p>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <p class="text-xs text-slate-600 line-clamp-2">
                      {{ student.topic }}
                    </p>
                  </td>
                  <td class="px-4 py-3">
                    <p class="text-xs text-slate-600">
                      {{ student.programme }}
                    </p>
                  </td>
                  <td class="px-4 py-3">
                    <span :class="['text-xs font-medium', getSubmissionStatusColor(student.progress1)]">
                      {{ student.progress1 }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span
                      :class="['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', getStatusColor(student.status)]"
                    >
                      {{ student.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <button
                      type="button"
                      class="inline-flex items-center justify-center rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      @click="goToStudentTopic(student.id)"
                      :title="`View ${student.name}'s topic details`"
                    >
                      <ChevronRightIcon class="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <footer class="border-t border-slate-200 px-4 py-3 sm:px-5">
            <p class="text-xs text-slate-500">
              Total: {{ filteredStudents.length }} student{{ filteredStudents.length !== 1 ? 's' : '' }}
            </p>
          </footer>
        </section>
      </main>
    </div>
  </div>
</template>
