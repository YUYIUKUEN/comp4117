<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  UsersIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  AcademicCapIcon,
  PencilIcon,
} from '@heroicons/vue/24/outline';
import httpClient from '../services/httpClient';

const router = useRouter();

const stats = ref({
  totalStudents: 0,
  topicsProposed: 0,
  submissionsThisMonth: 0,
});

const rows = ref<any[]>([]);
const searchQuery = ref('');

const filteredRows = computed(() => {
  if (!searchQuery.value.trim()) return rows.value;
  const q = searchQuery.value.toLowerCase();
  return rows.value.filter(r =>
    r.student.toLowerCase().includes(q) ||
    r.email.toLowerCase().includes(q) ||
    r.programme.toLowerCase().includes(q) ||
    r.supervisor.toLowerCase().includes(q) ||
    r.topic.toLowerCase().includes(q)
  );
});

// Fetch real data from API
onMounted(async () => {
  try {
    // Fetch students
    const usersRes = await httpClient.get('/admin/users', { params: { role: 'Student', limit: 100 } });
    const students = usersRes.data?.data?.users || [];
    stats.value.totalStudents = usersRes.data?.data?.pagination?.total || students.length;

    // Fetch topics
    const topicsRes = await httpClient.get('/topics');
    const topics = topicsRes.data?.data?.topics || topicsRes.data?.data || [];
    stats.value.topicsProposed = Array.isArray(topics) ? topics.length : 0;

    // Map students to rows
    rows.value = students.map((s: any, i: number) => ({
      id: s._id || i + 1,
      student: s.fullName || 'Unknown',
      email: s.email || '',
      programme: s.concentration || 'N/A',
      supervisor: s.supervisor?.fullName || 'Not assigned',
      supervisorEmail: s.supervisor?.email || '',
      topic: s.topicTitle || 'No topic assigned',
      status: s.deactivatedAt ? 'Inactive' : 'Active',
    }));

    // Fetch activity logs from database
    const logsRes = await httpClient.get('/activity', { params: { limit: 20 } });
    const logs = logsRes.data?.data?.logs || [];
    activityLog.value = logs.map((log: any) => ({
      id: log._id,
      time: new Date(log.timestamp).toLocaleTimeString('en-HK', { hour: '2-digit', minute: '2-digit', hour12: false }),
      actor: log.user_id?.fullName || 'System',
      role: log.user_id?.role || '',
      description: formatAction(log),
      type: getLogType(log.action),
    }));
  } catch (err) {
    console.error('Failed to load admin overview data:', err);
  }
});

// Export to Excel (CSV download)
const handleExportExcel = () => {
  const headers = ['Student', 'Email', 'Programme', 'Supervisor', 'Topic', 'Status'];
  const csvRows = [
    headers.join(','),
    ...rows.value.map(r =>
      [r.student, r.email, r.programme, r.supervisor, r.topic, r.status]
        .map(v => `"${String(v).replace(/"/g, '""')}"`) 
        .join(',')
    ),
  ];
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `fyp-students-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

// Bulk email supervisors
const handleBulkEmail = () => {
  const supervisorEmails = [...new Set(
    rows.value
      .filter(r => r.supervisorEmail)
      .map(r => r.supervisorEmail)
  )];
  if (supervisorEmails.length === 0) {
    alert('No supervisor email addresses available.');
    return;
  }
  const mailto = `mailto:${supervisorEmails.join(',')}`;
  window.open(mailto, '_blank');
};

// Row selection
const selectedIds = ref<Set<string>>(new Set());
const allSelected = computed(() => rows.value.length > 0 && selectedIds.value.size === rows.value.length);

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedIds.value = new Set();
  } else {
    selectedIds.value = new Set(rows.value.map(r => r.id));
  }
};

const toggleSelect = (id: string) => {
  const s = new Set(selectedIds.value);
  if (s.has(id)) s.delete(id); else s.add(id);
  selectedIds.value = s;
};

const selectedRows = computed(() => rows.value.filter(r => selectedIds.value.has(r.id)));

// Bulk actions
const bulkMessage = ref('');

const handleMarkEthicsNotRequired = () => {
  if (selectedRows.value.length === 0) {
    bulkMessage.value = 'Please select at least one student from the table above.';
    return;
  }
  const names = selectedRows.value.map(r => r.student).join(', ');
  bulkMessage.value = `Marked ${selectedRows.value.length} student(s) as "Ethics not required": ${names}`;
  // In production this would call an API endpoint
};

const showAssignModal = ref(false);
const assignSupervisorName = ref('');

const handleAssignSupervisor = () => {
  if (selectedRows.value.length === 0) {
    bulkMessage.value = 'Please select at least one student from the table above.';
    return;
  }
  showAssignModal.value = true;
};

const confirmAssignSupervisor = () => {
  if (!assignSupervisorName.value.trim()) return;
  const names = selectedRows.value.map(r => r.student).join(', ');
  bulkMessage.value = `Assigned ${selectedRows.value.length} student(s) to ${assignSupervisorName.value}: ${names}`;
  showAssignModal.value = false;
  assignSupervisorName.value = '';
  // In production this would call an API endpoint
};

const activityLog = ref<any[]>([]);

// Helper to format action into readable description
const formatAction = (log: any) => {
  const actionMap: Record<string, string> = {
    'login': 'Logged in to the system.',
    'login_failed': 'Failed login attempt.',
    'logout': 'Logged out.',
    'register': 'Registered a new account.',
    'password_reset_request': 'Requested a password reset.',
    'password_reset': 'Reset their password.',
    'topic_created': `Created topic: ${log.details?.title || log.entityId || ''}`,
    'topic_updated': `Updated topic: ${log.details?.title || log.entityId || ''}`,
    'topic_deleted': `Deleted a topic.`,
    'topic_approved': `Approved topic: ${log.details?.title || ''}`,
    'topic_rejected': `Rejected topic: ${log.details?.reason || ''}`,
    'application_submitted': 'Submitted a topic application.',
    'application_approved': 'Approved an application.',
    'application_rejected': 'Rejected an application.',
    'user_created': `Created user: ${log.details?.email || ''}`,
    'user_deactivated': `Deactivated a user.`,
    'user_reactivated': `Reactivated a user.`,
  };
  return actionMap[log.action] || log.action.replace(/_/g, ' ');
};

const getLogType = (action: string) => {
  if (action.includes('submit') || action.includes('creat')) return 'submission';
  if (action.includes('approv')) return 'approval';
  if (action.includes('login') || action.includes('logout')) return 'auth';
  if (action.includes('reject') || action.includes('deactivat')) return 'rejection';
  return 'other';
};
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
                @click="handleExportExcel"
                class="inline-flex items-center rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-slate-200 hover:border-blue-500 hover:text-blue-100"
              >
                Export to Excel
              </button>
              <button
                type="button"
                @click="handleBulkEmail"
                class="inline-flex items-center rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-slate-200 hover:border-blue-500 hover:text-blue-100"
              >
                Bulk email supervisors
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
                v-model="searchQuery"
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
                      :checked="allSelected"
                      @change="toggleSelectAll"
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
                  v-for="row in filteredRows"
                  :key="row.id"
                  class="hover:bg-slate-900/80"
                >
                  <td class="px-3 py-3 align-top">
                    <input
                      type="checkbox"
                      class="h-3.5 w-3.5 rounded border-slate-300 bg-white text-blue-500 focus:ring-blue-500"
                      :aria-label="`Select ${row.student}`"
                      :checked="selectedIds.has(row.id)"
                      @change="toggleSelect(row.id)"
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
              Select students from the table above, then use these actions.
            </p>
            <p v-if="selectedIds.size > 0" class="mt-1 text-xs font-medium text-blue-600">
              {{ selectedIds.size }} student(s) selected
            </p>
            <div v-if="bulkMessage" class="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              {{ bulkMessage }}
            </div>
            <div class="mt-4 flex flex-wrap gap-2 text-[11px]">
              <button
                type="button"
                @click="handleMarkEthicsNotRequired"
                class="inline-flex items-center rounded-full border border-blue-500/70 bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-500"
              >
                Mark selected as "Ethics not required"
              </button>
              <button
                type="button"
                @click="handleAssignSupervisor"
                class="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50"
              >
                Assign selected to supervisor
              </button>
            </div>

            <!-- Assign supervisor modal -->
            <div v-if="showAssignModal" class="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <label class="block text-xs font-medium text-slate-700 mb-1">Supervisor name</label>
              <input
                v-model="assignSupervisorName"
                type="text"
                placeholder="Enter supervisor name"
                class="w-full rounded border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div class="mt-2 flex gap-2">
                <button @click="confirmAssignSupervisor" class="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-500">Confirm</button>
                <button @click="showAssignModal = false" class="rounded border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100">Cancel</button>
              </div>
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

            <ol v-if="activityLog.length > 0" class="mt-3 space-y-2 text-[11px]">
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
                        : item.type === 'rejection'
                          ? 'bg-red-500'
                          : item.type === 'auth'
                            ? 'bg-amber-500'
                            : 'bg-slate-400'"
                  />
                </div>
                <div>
                  <div class="text-slate-800">
                    <p class="font-medium">{{ item.actor }} <span v-if="item.role" class="font-normal text-slate-400">· {{ item.role }}</span></p>
                    <p class="text-slate-600 text-xs mt-1">{{ item.description }}</p>
                  </div>
                </div>
              </li>
            </ol>
            <p v-else class="mt-3 text-xs text-slate-400">No activity logs yet. Actions like login, topic creation, and user management will appear here.</p>
          </aside>
        </section>
      </main>
    </div>
</template>

