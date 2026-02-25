<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import httpClient from '@/services/httpClient';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  UserIcon,
  BellIcon,
  ArrowPathIcon,
} from '@heroicons/vue/24/outline';

const router = useRouter();
const authStore = useAuthStore();

interface ActivityLog {
  _id: string;
  user_id: { fullName: string; email: string; role: string } | null;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown>;
  timestamp: string;
}

const activityLogs = ref<ActivityLog[]>([]);
const loading = ref(false);
const error = ref('');
const totalLogs = ref(0);
const currentPage = ref(1);
const pageSize = 20;

const fetchActivityLogs = async () => {
  loading.value = true;
  error.value = '';
  try {
    const userId = authStore.user?.id;
    if (!userId) {
      error.value = 'Not authenticated';
      return;
    }
    const res = await httpClient.get(`/activity/user/${userId}`, {
      params: { limit: pageSize, page: currentPage.value },
    });
    activityLogs.value = res.data?.data?.logs || [];
    totalLogs.value = res.data?.data?.pagination?.total || 0;
  } catch (e: any) {
    console.error('Failed to fetch activity logs', e);
    error.value = e.response?.data?.error || 'Failed to load activity logs';
  } finally {
    loading.value = false;
  }
};

onMounted(fetchActivityLogs);

const totalPages = () => Math.max(1, Math.ceil(totalLogs.value / pageSize));

const goPage = (page: number) => {
  if (page < 1 || page > totalPages()) return;
  currentPage.value = page;
  fetchActivityLogs();
};

/** Map entityType / action to a visual category */
const getCategory = (log: ActivityLog): string => {
  const action = log.action?.toUpperCase() || '';
  if (action.includes('SUBMIT') || log.entityType === 'Submission') return 'submission';
  if (action.includes('FEEDBACK') || action.includes('GRADE') || action.includes('COMPLETE')) return 'feedback';
  if (action.includes('APPLY') || action.includes('APPROVE') || action.includes('REJECT') || action.includes('WITHDRAW') || log.entityType === 'Application') return 'request';
  return 'system';
};

const getActivityIcon = (cat: string) => {
  switch (cat) {
    case 'submission': return DocumentTextIcon;
    case 'feedback': return CheckCircleIcon;
    case 'request': return BellIcon;
    default: return UserIcon;
  }
};

const getActivityColor = (cat: string) => {
  switch (cat) {
    case 'submission': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'feedback': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'request': return 'bg-amber-50 text-amber-700 border-amber-200';
    default: return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

const formatTime = (ts: string) => {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleString('en-HK', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const formatAction = (log: ActivityLog) => {
  const action = (log.action || '').replace(/_/g, ' ').toLowerCase();
  const parts = [action];
  if (log.entityType) parts.push(`on ${log.entityType}`);
  return parts.join(' ');
};
</script>

<template>
  <div class="min-h-[calc(100vh-3.25rem)] bg-slate-50">
    <header class="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur">
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        @click="router.back()"
      >
        <ArrowLeftIcon class="h-6 w-6" />
      </button>
      <div>
        <p class="text-[11px] uppercase tracking-[0.2em] text-slate-500">Supervision</p>
        <p class="text-sm font-semibold text-slate-900">Activity Logs</p>
      </div>
      <button
        @click="fetchActivityLogs"
        class="ml-auto inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 px-3 py-2 rounded hover:bg-slate-100"
        :disabled="loading"
      >
        <ArrowPathIcon class="h-4 w-4" :class="{'animate-spin': loading}" />
        Refresh
      </button>
    </header>

    <main class="px-4 sm:px-6 pb-6 pt-4 sm:pt-5">
      <!-- Loading state -->
      <div v-if="loading && activityLogs.length === 0" class="flex items-center justify-center py-16">
        <ArrowPathIcon class="h-6 w-6 animate-spin text-slate-400" />
        <span class="ml-2 text-sm text-slate-500">Loading activity logs…</span>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p class="text-sm text-red-700">{{ error }}</p>
        <button @click="fetchActivityLogs" class="mt-3 text-xs font-medium text-red-600 hover:underline">Retry</button>
      </div>

      <!-- Empty state -->
      <div v-else-if="activityLogs.length === 0 && !loading" class="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <DocumentTextIcon class="mx-auto h-10 w-10 text-slate-300" />
        <p class="mt-3 text-sm text-slate-500">No activity logs found.</p>
      </div>

      <!-- Logs list -->
      <div v-else class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <h2 class="text-sm font-semibold text-slate-900 mb-1">Recent Activity</h2>
        <p class="text-xs text-slate-500 mb-4">{{ totalLogs }} total log{{ totalLogs === 1 ? '' : 's' }}</p>

        <div class="space-y-3">
          <div
            v-for="log in activityLogs"
            :key="log._id"
            class="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors flex gap-4"
          >
            <div
              :class="['flex-shrink-0 w-10 h-10 rounded-full border flex items-center justify-center', getActivityColor(getCategory(log))]"
            >
              <component :is="getActivityIcon(getCategory(log))" class="h-5 w-5" />
            </div>

            <div class="flex-1 min-w-0">
              <p class="text-xs text-slate-500">{{ formatTime(log.timestamp) }}</p>
              <p class="text-sm font-medium text-slate-900 mt-1">
                <span class="font-semibold">{{ log.user_id?.fullName || 'Unknown User' }}</span>
                <span class="text-slate-600 ml-1">{{ formatAction(log) }}</span>
              </p>
              <p v-if="log.details && Object.keys(log.details).length" class="text-xs text-slate-500 mt-1">
                {{ JSON.stringify(log.details) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages() > 1" class="mt-4 flex items-center justify-center gap-2">
          <button
            @click="goPage(currentPage - 1)"
            :disabled="currentPage <= 1"
            class="rounded px-3 py-1.5 text-xs font-medium border"
            :class="currentPage <= 1 ? 'text-slate-300 border-slate-200 cursor-not-allowed' : 'text-slate-600 border-slate-300 hover:bg-slate-100'"
          >Prev</button>
          <span class="text-xs text-slate-500">Page {{ currentPage }} / {{ totalPages() }}</span>
          <button
            @click="goPage(currentPage + 1)"
            :disabled="currentPage >= totalPages()"
            class="rounded px-3 py-1.5 text-xs font-medium border"
            :class="currentPage >= totalPages() ? 'text-slate-300 border-slate-200 cursor-not-allowed' : 'text-slate-600 border-slate-300 hover:bg-slate-100'"
          >Next</button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
</style>
