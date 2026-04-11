<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import assignmentService from '@/services/assignmentService';
import {
  Bars3Icon,
  AcademicCapIcon,
  UserGroupIcon,
  PencilIcon,
  MagnifyingGlassIcon,
} from '@heroicons/vue/24/outline';

const router = useRouter();
const authStore = useAuthStore();
const sidebarOpen = ref(false);
const currentPage = ref('students');
const searchQuery = ref('');
const isLoading = ref(false);
const errorMessage = ref('');

const supervisor = computed(() => ({
  name: authStore.user?.fullName || 'Supervisor',
  dept: 'Department',
}));

const assignments = ref<any[]>([]);

// Transform assignment data to student format (only matched/assigned students)
const students = computed(() => {
  return assignments.value
    .filter(a => a.student_id && a.topic_id)
    .map(a => ({
      id: a._id,
      name: a.student_id.fullName,
      email: a.student_id.email || '—',
      phone: a.student_id.phone || '—',
      studentId: a.student_id._id.substring(0, 8).toUpperCase(),
      programme: a.student_id.concentration || 'Unknown',
      topic: a.topic_id?.title || 'Topic Deleted',
      topicDescription: a.topic_id?.description || '',
      keywords: a.topic_id?.keywords || [],
      status: a.status,
      assignedAt: a.assigned_at,
      progress1: 'Pending', // Will be fetched from submissions in future
      ethics: 'Not Required', // Will be fetched from submissions in future
    }));
});

const filteredStudents = computed(() => {
  if (!searchQuery.value) {
    return students.value;
  }
  const query = searchQuery.value.toLowerCase();
  return students.value.filter(student =>
    student.name.toLowerCase().includes(query) ||
    student.studentId.toLowerCase().includes(query) ||
    student.topic.toLowerCase().includes(query) ||
    student.email.toLowerCase().includes(query) ||
    student.programme.toLowerCase().includes(query)
  );
});

// Fetch supervised students from database (using assignments, not applications)
const fetchStudents = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';
    const response = await assignmentService.getSupervisorAssignments({
      limit: 100,
      page: 1,
    });
    assignments.value = response.data;
  } catch (error: any) {
    console.error('Failed to fetch students:', error);
    errorMessage.value = error.response?.data?.message || 'Failed to load students. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchStudents();
});

const goToFeedbackGrading = () => {
  router.push('/supervisor/feedback-grading');
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
        <!-- Error Message -->
        <div v-if="errorMessage" class="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p class="text-sm text-red-800">{{ errorMessage }}</p>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70 p-8">
          <div class="flex items-center justify-center gap-3">
            <div class="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"></div>
            <p class="text-sm text-slate-600">Loading students...</p>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="students.length === 0" class="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70 p-8">
          <div class="flex flex-col items-center justify-center gap-2">
            <UserGroupIcon class="h-12 w-12 text-slate-300" />
            <p class="text-sm font-medium text-slate-900">No supervised students yet</p>
            <p class="text-xs text-slate-500">Create topics or wait for students to apply</p>
          </div>
        </div>

        <!-- Students Table -->
        <section
          v-else
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
                    Contact
                  </th>
                  <th class="px-4 py-3 text-left font-semibold text-slate-900">
                    Topic
                  </th>
                  <th class="px-4 py-3 text-left font-semibold text-slate-900">
                    Programme
                  </th>
                  <th class="px-4 py-3 text-left font-semibold text-slate-900">
                    Assigned
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
                    <p class="font-medium text-slate-900">
                      {{ student.name }}
                    </p>
                  </td>
                  <td class="px-4 py-3">
                    <div>
                      <p class="text-xs text-slate-600">
                        {{ student.email }}
                      </p>
                      <p v-if="student.phone !== '—'" class="text-xs text-slate-400 mt-0.5">
                        {{ student.phone }}
                      </p>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <p class="text-xs text-slate-600 line-clamp-2 font-medium">
                      {{ student.topic }}
                    </p>
                    <div v-if="student.keywords.length" class="flex flex-wrap gap-1 mt-1">
                      <span
                        v-for="kw in student.keywords.slice(0, 3)"
                        :key="kw"
                        class="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500"
                      >
                        {{ kw }}
                      </span>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <p class="text-xs text-slate-600">
                      {{ student.programme }}
                    </p>
                  </td>
                  <td class="px-4 py-3">
                    <p class="text-xs text-slate-600">
                      {{ student.assignedAt ? new Date(student.assignedAt).toLocaleDateString() : '—' }}
                    </p>
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
