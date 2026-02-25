<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import assignmentService from '../services/assignmentService';
import applicationService from '../services/applicationService';
import httpClient from '../services/httpClient';

const router = useRouter();

const isLoading = ref(true);
const assignments = ref<any[]>([]);
const pendingApplications = ref<any[]>([]);
const submissions = ref<any[]>([]);
const actionLoading = ref<Record<string, boolean>>({});
const toast = ref<{ message: string; type: 'success' | 'error' } | null>(null);

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  toast.value = { message, type };
  setTimeout(() => { toast.value = null; }, 4000);
};

// ── Fetch data ──────────────────────────────────────────────
const fetchData = async () => {
  isLoading.value = true;
  try {
    const [assignRes, appRes] = await Promise.all([
      assignmentService.getSupervisorAssignments({ limit: 100 }),
      applicationService.getSupervisorApplications({ limit: 100, status: 'Pending' }),
    ]);
    assignments.value = assignRes.data;
    pendingApplications.value = appRes.data;

    // Fetch submissions for the supervised students
    try {
      const subRes = await httpClient.get('/submissions/supervisor/submissions');
      submissions.value = subRes.data.data || [];
    } catch {
      submissions.value = [];
    }
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
  } finally {
    isLoading.value = false;
  }
};

// ── Computed: students from assignments ─────────────────────
const students = computed(() =>
  assignments.value
    .filter(a => a.student_id && a.topic_id)
    .map(a => {
      const studentId = a.student_id._id;
      // Find latest submission for this student
      const studentSubs = submissions.value
        .filter((s: any) => s.student_id?._id === studentId || s.student_id === studentId);
      const latestSub = studentSubs.length > 0 ? studentSubs[0] : null;
      const status = latestSub
        ? latestSub.status === 'Overdue'
          ? 'Overdue'
          : latestSub.status === 'Submitted'
            ? 'On Track'
            : 'Pending'
        : 'No Submission';

      return {
        id: a._id,
        studentId,
        name: a.student_id.fullName,
        email: a.student_id.email,
        programme: a.student_id.concentration || 'Unknown',
        topic: a.topic_id.title || 'Topic Deleted',
        lastSubmission: latestSub?.phase || '—',
        lastSubmissionDate: latestSub?.submittedAt
          ? new Date(latestSub.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : '—',
        status,
        fileCount: latestSub?.files?.length || 0,
      };
    })
);

// ── Computed: stats ─────────────────────────────────────────
const stats = computed(() => ({
  total: students.value.length,
  pending: pendingApplications.value.length,
  overdue: students.value.filter(s => s.status === 'Overdue').length,
}));

// ── Actions ─────────────────────────────────────────────────
const approveApplication = async (appId: string) => {
  actionLoading.value[appId] = true;
  try {
    await applicationService.approveApplication(appId);
    showToast('Application approved successfully! Student has been assigned to the topic.', 'success');
    await fetchData();
  } catch (error: any) {
    showToast(error?.response?.data?.message || 'Failed to approve application', 'error');
  } finally {
    actionLoading.value[appId] = false;
  }
};

const rejectApplication = async (appId: string) => {
  const reason = prompt('Reason for rejection (optional):');
  if (reason === null) return; // cancelled
  actionLoading.value[appId] = true;
  try {
    await applicationService.rejectApplication(appId, reason || undefined);
    showToast('Application rejected.', 'success');
    await fetchData();
  } catch (error: any) {
    showToast(error?.response?.data?.message || 'Failed to reject application', 'error');
  } finally {
    actionLoading.value[appId] = false;
  }
};

const viewSubmissions = (studentId: string) => {
  router.push({ path: '/supervisor/feedback-grading', query: { student: studentId } });
};

const sendReminder = (studentName: string) => {
  router.push('/supervisor/reminders');
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getInitials = (name: string) =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);

onMounted(fetchData);
</script>

<template>
  <div>
    <!-- Toast notification -->
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-1 opacity-0"
    >
      <div
        v-if="toast"
        class="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 shadow-lg text-sm font-medium"
        :class="toast.type === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-rose-200 bg-rose-50 text-rose-800'"
      >
        <span v-if="toast.type === 'success'">&#10003;</span>
        <span v-else>&#10007;</span>
        {{ toast.message }}
        <button @click="toast = null" class="ml-2 opacity-60 hover:opacity-100">&times;</button>
      </div>
    </transition>

    <main class="px-4 sm:px-6 pb-6 pt-4 sm:pt-5">
      <!-- Loading -->
      <div v-if="isLoading" class="flex items-center justify-center gap-3 py-16">
        <div class="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"></div>
        <p class="text-sm text-slate-600">Loading dashboard...</p>
      </div>

      <template v-else>
        <!-- Stats row -->
        <section class="grid gap-4 sm:grid-cols-3">
          <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 text-xs">
            <p class="text-slate-600">Supervising students</p>
            <p class="mt-1 text-2xl font-semibold text-slate-900">{{ stats.total }}</p>
            <p class="mt-1 text-[11px] text-slate-500">Currently assigned students.</p>
          </article>
          <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 text-xs">
            <p class="text-slate-600">Pending applications</p>
            <p class="mt-1 text-2xl font-semibold text-amber-600">{{ stats.pending }}</p>
            <p class="mt-1 text-[11px] text-slate-500">Students waiting for your approval.</p>
          </article>
          <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 text-xs">
            <p class="text-slate-600">Overdue submissions</p>
            <p class="mt-1 text-2xl font-semibold text-rose-600">{{ stats.overdue }}</p>
            <p class="mt-1 text-[11px] text-slate-500">Students with overdue work.</p>
          </article>
        </section>

        <!-- Supervised students + pending applications -->
        <section class="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1.1fr)]">
          <!-- Students table -->
          <article class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70 text-xs">
            <header class="flex items-center justify-between gap-2">
              <div>
                <h2 class="text-sm font-semibold text-slate-900">My supervised students</h2>
                <p class="mt-1 text-[11px] text-slate-600">
                  Assigned students with their latest submission status.
                </p>
              </div>
              <button
                type="button"
                @click="fetchData"
                class="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] text-slate-700 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50"
              >
                Refresh
              </button>
            </header>

            <!-- Empty state -->
            <div v-if="students.length === 0" class="mt-4 flex flex-col items-center gap-2 py-8">
              <p class="text-sm font-medium text-slate-900">No supervised students yet</p>
              <p class="text-[11px] text-slate-500">Approve pending applications below to add students.</p>
            </div>

            <div v-else class="mt-3 overflow-x-auto">
              <table class="min-w-full text-[11px]">
                <thead class="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th class="px-3 py-2 text-left font-medium">Student</th>
                    <th class="px-3 py-2 text-left font-medium">Topic</th>
                    <th class="px-3 py-2 text-left font-medium">Last submission</th>
                    <th class="px-3 py-2 text-left font-medium">Status</th>
                    <th class="px-3 py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="s in students" :key="s.id" class="hover:bg-slate-50">
                    <td class="px-3 py-2 align-top">
                      <div class="flex items-center gap-2">
                        <div class="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-medium">
                          {{ getInitials(s.name) }}
                        </div>
                        <div>
                          <p class="font-medium text-slate-900">{{ s.name }}</p>
                          <p class="text-[11px] text-slate-500">{{ s.email }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-3 py-2 align-top max-w-xs">
                      <p class="font-medium text-slate-900 line-clamp-2">{{ s.topic }}</p>
                    </td>
                    <td class="px-3 py-2 align-top">
                      <p class="text-slate-700">{{ s.lastSubmission }}</p>
                      <p class="text-[11px] text-slate-500">{{ s.lastSubmissionDate }}</p>
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
                          @click="viewSubmissions(s.studentId)"
                          class="inline-flex items-center rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] text-slate-700 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        >
                          View submissions
                        </button>
                        <button
                          type="button"
                          @click="sendReminder(s.name)"
                          class="inline-flex items-center rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] text-slate-700 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50"
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
                  Total: {{ students.length }} student{{ students.length !== 1 ? 's' : '' }}
                </p>
              </div>
            </div>
          </article>

          <!-- Pending applications -->
          <div class="space-y-4">
            <article class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70 text-xs">
              <header class="flex items-center justify-between gap-2">
                <h2 class="text-sm font-semibold text-slate-900">Pending applications</h2>
                <span class="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] text-amber-700 border border-amber-200">
                  {{ pendingApplications.length }} pending
                </span>
              </header>

              <!-- Empty -->
              <div v-if="pendingApplications.length === 0" class="mt-3 text-center py-6">
                <p class="text-[11px] text-slate-500">No pending applications.</p>
              </div>

              <ul v-else class="mt-3 space-y-2">
                <li
                  v-for="app in pendingApplications"
                  :key="app._id"
                  class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <p class="text-[11px] font-medium text-slate-900">
                    {{ app.student_id?.fullName || 'Unknown Student' }}
                  </p>
                  <p class="mt-0.5 text-[11px] text-slate-600">
                    <span class="font-semibold">Topic:</span> {{ app.topic_id?.title || 'Unknown Topic' }}
                  </p>
                  <p class="mt-0.5 text-[11px] text-slate-500">
                    Applied {{ formatDate(app.appliedAt || app.createdAt) }}
                  </p>
                  <div class="mt-2 flex gap-2">
                    <button
                      type="button"
                      :disabled="actionLoading[app._id]"
                      @click="approveApplication(app._id)"
                      class="inline-flex items-center rounded-full border border-emerald-500 bg-emerald-600 px-2.5 py-1 text-[11px] text-white hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {{ actionLoading[app._id] ? 'Processing...' : 'Approve' }}
                    </button>
                    <button
                      type="button"
                      :disabled="actionLoading[app._id]"
                      @click="rejectApplication(app._id)"
                      class="inline-flex items-center rounded-full border border-rose-500 bg-rose-50 px-2.5 py-1 text-[11px] text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </li>
              </ul>
            </article>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>

