<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  UserIcon,
  BellIcon,
} from '@heroicons/vue/24/outline';

const router = useRouter();

const activityLogs = ref([
  {
    id: 1,
    time: '2025-02-13 14:30',
    actor: 'Student Chan Hoi Ting',
    action: 'submitted Progress Report 1 for review',
    type: 'submission',
    topic: 'Smart City Walkability in Kowloon East',
  },
  {
    id: 2,
    time: '2025-02-13 10:15',
    actor: 'Admin System',
    action: 'sent automated reminder for pending submission',
    type: 'system',
    topic: 'Digital Platforms and Youth Political Participation',
  },
  {
    id: 3,
    time: '2025-02-12 16:45',
    actor: 'Student Ho Pui Kwan',
    action: 'submitted midterm evaluation form',
    type: 'submission',
    topic: 'Digital Platforms and Youth Political Participation',
  },
  {
    id: 4,
    time: '2025-02-12 09:20',
    actor: 'You (Supervisor)',
    action: 'provided feedback on progress report',
    type: 'feedback',
    topic: 'Literary Analysis and Digital Storytelling',
  },
  {
    id: 5,
    time: '2025-02-11 13:00',
    actor: 'Student Lee Man Kei',
    action: 'requested extension on final submission deadline',
    type: 'request',
    topic: 'Literary Analysis and Digital Storytelling',
  },
  {
    id: 6,
    time: '2025-02-10 15:30',
    actor: 'System',
    action: 'sent weekly summary to all supervisors',
    type: 'system',
    topic: 'All Topics',
  },
]);

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'submission':
      return DocumentTextIcon;
    case 'feedback':
      return CheckCircleIcon;
    case 'request':
      return BellIcon;
    default:
      return UserIcon;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'submission':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'feedback':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'request':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
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
        @click="router.push('/supervisor')"
        class="ml-auto text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-2 rounded hover:bg-blue-50"
      >
        Back to Menu
      </button>
    </header>

    <main class="px-4 sm:px-6 pb-6 pt-4 sm:pt-5">
      <div class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <h2 class="text-sm font-semibold text-slate-900 mb-4">Recent Activity</h2>

        <div class="space-y-3">
          <div
            v-for="log in activityLogs"
            :key="log.id"
            class="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors flex gap-4"
          >
            <div
              :class="['flex-shrink-0 w-10 h-10 rounded-full border flex items-center justify-center', getActivityColor(log.type)]"
            >
              <component :is="getActivityIcon(log.type)" class="h-5 w-5" />
            </div>

            <div class="flex-1 min-w-0">
              <p class="text-xs text-slate-500">{{ log.time }}</p>
              <p class="text-sm font-medium text-slate-900 mt-1">
                <span class="font-semibold">{{ log.actor }}</span>
                <span class="text-slate-600"> {{ log.action }}</span>
              </p>
              <p class="text-xs text-slate-500 mt-1">{{ log.topic }}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
</style>
