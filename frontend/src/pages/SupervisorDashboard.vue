<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import assignmentService from '@/services/assignmentService';
import applicationService from '@/services/applicationService';
import {
  Bars3Icon,
  AcademicCapIcon,
  UserGroupIcon,
  EnvelopeOpenIcon,
  BellAlertIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  PencilIcon,
} from '@heroicons/vue/24/outline';

const sidebarOpen = ref(false);
const isLoading = ref(false);

const router = useRouter();
const authStore = useAuthStore();
const currentPage = ref('dashboard');

const supervisor = computed(() => ({
  name: authStore.user?.fullName || 'Supervisor',
  dept: 'Department',
  avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(authStore.user?.fullName || 'Supervisor')}&background=0F172A&color=fff`,
}));

const assignments = ref<any[]>([]);
const pendingApplications = ref<any[]>([]);

// Transform assignment data to student format (only matched/assigned students)
const students = computed(() => {
  return assignments.value
    .filter(a => a.student_id && a.topic_id)
    .map(a => ({
      id: a._id,
      studentId: a.student_id._id,
      name: a.student_id.fullName,
      initials: getInitials(a.student_id.fullName),
      programme: a.student_id.concentration || 'Unknown',
      topic: a.topic_id.title || 'Topic Deleted',
      status: a.status,
      assignedAt: a.assigned_at,
    }));
});

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

const stats = computed(() => {
  const total = students.value.length;
  const pending = pendingApplications.value.length;
  const overdue = students.value.filter(
    (s) => s.submissions.progress1 === 'Overdue',
  ).length;
  return { total, pending, overdue };
});

// Fetch supervised students from database (using assignments, not applications)
const fetchStudents = async () => {
  try {
    isLoading.value = true;
    // Fetch actual assigned students
    const assignmentResponse = await assignmentService.getSupervisorAssignments({
      limit: 100,
      page: 1,
    });
    assignments.value = assignmentResponse.data;

    // Also fetch pending applications for the notification count
    try {
      const appResponse = await applicationService.getSupervisorApplications({
        limit: 100,
        page: 1,
        status: 'Pending',
      });
      pendingApplications.value = appResponse.data;
    } catch {
      // Non-critical — don't block dashboard
    }
  } catch (error: any) {
    console.error('Failed to fetch students:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchStudents();
})

const goToFeedbackGrading = () => {
  router.push('/supervisor/feedback-grading');
};

const goToPendingApprovals = () => {
  router.push('/supervisor/pending-approvals');
};

const goToReminders = () => {
  router.push('/supervisor/reminders');
};

const goToActivityLogs = () => {
  router.push('/supervisor/activity-logs');
};

const goToTopicDetails = (studentId: number) => {
  router.push(`/supervisor/topic/${studentId}`);
};

const goToAllStudents = () => {
  router.push('/supervisor/students');
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
          @click="goToAllStudents"
        >
          <UserGroupIcon class="h-5 w-5 text-slate-400" />
          <span class="flex-1 text-left">View All Students</span>
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
            @click="goToPendingApprovals"
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
                @click="fetchStudents"
                class="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50"
              >
                <ArrowPathIcon class="h-3.5 w-3.5" :class="{ 'animate-spin': isLoading }" />
                Refresh list
              </button>
              <button
                type="button"
                @click="goToReminders"
                class="inline-flex items-center gap-1 rounded-full border border-blue-500/70 bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-500"
              >
                <EnvelopeOpenIcon class="h-3.5 w-3.5" />
                Send bulk reminder (demo)
              </button>
            </div>
          </header>

          <!-- Loading State -->
          <div v-if="isLoading" class="mt-4 flex items-center justify-center gap-3 py-8">
            <div class="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"></div>
            <p class="text-sm text-slate-600">Loading students...</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="students.length === 0" class="mt-4 flex flex-col items-center justify-center gap-2 py-8">
            <UserGroupIcon class="h-12 w-12 text-slate-300" />
            <p class="text-sm font-medium text-slate-900">No supervised students yet</p>
            <p class="text-xs text-slate-500">Create topics or wait for students to apply</p>
          </div>

          <!-- Students Table -->
          <div v-else class="mt-4 overflow-x-auto">
            <table class="min-w-full text-xs">
              <thead class="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th scope="col" class="px-3 py-2 text-left font-medium">Student</th>
                  <th scope="col" class="px-3 py-2 text-left font-medium">Topic</th>
                  <th scope="col" class="px-3 py-2 text-left font-medium">Programme</th>
                  <th scope="col" class="px-3 py-2 text-left font-medium">Status</th>
                  <th scope="col" class="px-3 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                <tr
                  v-for="s in students"
                  :key="s.id"
                  class="hover:bg-slate-50"
                >
                  <td class="px-3 py-3 align-top">
                    <div class="flex items-center gap-2">
                      <div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-medium">
                        {{ s.initials }}
                      </div>
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
                  </td>
                  <td class="px-3 py-3 align-top">
                    <p class="text-[11px] text-slate-600">
                      {{ s.programme }}
                    </p>
                  </td>
                  <td class="px-3 py-3 align-top">
                    <span
                      :class="[
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                        s.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : s.status === 'Completed'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200',
                      ]"
                    >
                      {{ s.status }}
                    </span>
                  </td>
                  <td class="px-3 py-3 align-top text-right">
                    <div class="flex flex-col gap-1 text-[11px] items-end">
                      <button
                        type="button"
                        @click="goToTopicDetails(s.id)"
                        class="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-slate-700 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50"
                      >
                        View details
                        <ChevronRightIcon class="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        @click="goToFeedbackGrading"
                        class="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-slate-700 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50"
                      >
                        View feedback
                      </button>
                      <button
                        type="button"
                        @click="goToReminders"
                        class="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-slate-700 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50"
                      >
                        Send reminder
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div class="border-t border-slate-200 px-3 py-2">
              <p class="text-[11px] text-slate-500">
                Total: {{ students.length }} assigned student{{ students.length !== 1 ? 's' : '' }}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

