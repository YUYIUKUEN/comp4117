<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  UsersIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  AcademicCapIcon,
  PencilIcon,
  ArrowUpTrayIcon,
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
const isLoading = ref(false);

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
const fetchStudentData = async () => {
  isLoading.value = true;
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
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchStudentData();
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

const handleMarkEthicsNotRequired = async () => {
  if (selectedRows.value.length === 0) {
    bulkMessage.value = 'Please select at least one student from the table above.';
    return;
  }
  
  try {
    const studentIds = selectedRows.value.map(r => r.id);
    await httpClient.post('/admin/users/bulk-mark-ethics-not-required', { studentIds });
    const names = selectedRows.value.map(r => r.student).join(', ');
    bulkMessage.value = `✓ Marked ${selectedRows.value.length} student(s) as "Ethics not required": ${names}`;
    selectedIds.value = new Set();
  } catch (err) {
    console.error('Failed to mark ethics not required:', err);
    const errorMsg = (err as any).response?.data?.error || 'Failed to mark ethics not required';
    bulkMessage.value = `Error: ${errorMsg}`;
  }
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

const confirmAssignSupervisor = async () => {
  if (!assignSupervisorName.value.trim()) return;
  
  try {
    const studentIds = selectedRows.value.map(r => r.id);
    await httpClient.post('/admin/users/bulk-assign-supervisor', {
      studentIds,
      supervisorName: assignSupervisorName.value.trim(),
    });
    const names = selectedRows.value.map(r => r.student).join(', ');
    bulkMessage.value = `✓ Assigned ${selectedRows.value.length} student(s) to ${assignSupervisorName.value}: ${names}`;
    showAssignModal.value = false;
    assignSupervisorName.value = '';
    selectedIds.value = new Set();
    // Refresh data
    await fetchStudentData();
  } catch (err) {
    console.error('Failed to assign supervisor:', err);
    const errorMsg = (err as any).response?.data?.error || 'Failed to assign supervisor';
    bulkMessage.value = `Error: ${errorMsg}`;
  }
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

// ── Import from Excel ──────────────────────────────────────────────
const showImportModal = ref(false);
const importFile = ref<File | null>(null);
const importing = ref(false);
const importResult = ref<{ created: number; skipped: number; errors: { row: number; reason: string }[] } | null>(null);

const onImportFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  importFile.value = target.files?.[0] || null;
  importResult.value = null;
};

const handleImportExcel = async () => {
  if (!importFile.value) return;
  importing.value = true;
  importResult.value = null;
  try {
    const formData = new FormData();
    formData.append('file', importFile.value);
    const res = await httpClient.post('/admin/users/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    importResult.value = res.data.data;
    // Refresh the students table
    await fetchStudentData();
  } catch (err: any) {
    importResult.value = { created: 0, skipped: 0, errors: [{ row: 0, reason: err?.response?.data?.error || 'Upload failed' }] };
  } finally {
    importing.value = false;
  }
};

const closeImportModal = () => {
  showImportModal.value = false;
  importFile.value = null;
  importResult.value = null;
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
                @click="showImportModal = true"
                class="inline-flex items-center gap-1.5 rounded-full border border-blue-600 bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
              >
                <ArrowUpTrayIcon class="h-3.5 w-3.5" />
                Import from Excel
              </button>
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
            <button
              type="button"
              @click="fetchStudentData"
              :disabled="isLoading"
              class="inline-flex items-center gap-1.5 rounded-lg border border-slate-400 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg v-if="!isLoading" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              <svg v-else class="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              {{ isLoading ? 'Refreshing...' : 'Refresh' }}
            </button>
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

            <ol v-if="activityLog.length > 0" class="mt-3 space-y-2 text-[11px] max-h-64 overflow-y-auto">
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

    <!-- Import from Excel Modal -->
    <Teleport to="body">
      <div v-if="showImportModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="closeImportModal">
        <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
          <h2 class="text-lg font-semibold text-slate-900">Import Users from Excel</h2>
          <p class="mt-1 text-xs text-slate-500">
            Upload an <strong>.xlsx</strong> or <strong>.csv</strong> file with columns:
            <span class="font-medium">email</span>,
            <span class="font-medium">fullName</span>,
            <span class="font-medium">role</span> (default: Student),
            <span class="font-medium">concentration</span> (optional),
            <span class="font-medium">phone</span> (optional).
          </p>

          <div class="mt-4">
            <label class="block">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                class="block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                @change="onImportFileChange"
              >
            </label>
            <p v-if="importFile" class="mt-2 text-xs text-slate-500">
              Selected: <strong>{{ importFile.name }}</strong> ({{ (importFile.size / 1024).toFixed(1) }} KB)
            </p>
          </div>

          <!-- Result -->
          <div v-if="importResult" class="mt-4 rounded-lg border p-3 text-xs" :class="importResult.created > 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'">
            <p class="font-medium" :class="importResult.created > 0 ? 'text-green-800' : 'text-red-800'">
              {{ importResult.created }} user(s) imported, {{ importResult.skipped }} skipped.
            </p>
            <ul v-if="importResult.errors.length" class="mt-1 space-y-0.5 text-red-700">
              <li v-for="(err, i) in importResult.errors.slice(0, 10)" :key="i">
                Row {{ err.row }}: {{ err.reason }}
              </li>
              <li v-if="importResult.errors.length > 10" class="italic">
                ...and {{ importResult.errors.length - 10 }} more error(s).
              </li>
            </ul>
          </div>

          <div class="mt-5 flex justify-end gap-2">
            <button type="button" @click="closeImportModal" class="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
              {{ importResult ? 'Close' : 'Cancel' }}
            </button>
            <button
              v-if="!importResult"
              type="button"
              :disabled="!importFile || importing"
              @click="handleImportExcel"
              class="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowUpTrayIcon class="h-3.5 w-3.5" />
              {{ importing ? 'Importing…' : 'Upload & Import' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
</template>

