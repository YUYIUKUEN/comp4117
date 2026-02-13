<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  ArrowLeftIcon,
  BellIcon,
  CheckIcon,
} from '@heroicons/vue/24/outline';

const router = useRouter();

const reminders = ref([
  {
    id: 1,
    type: 'Overdue Submission',
    studentName: 'Student Chan Hoi Ting',
    topic: 'Smart City Walkability in Kowloon East',
    dueDate: '2025-02-10',
    daysOverdue: 3,
    reminderSent: 0,
    priority: 'High',
  },
  {
    id: 2,
    type: 'Pending Review',
    studentName: 'Student Ho Pui Kwan',
    topic: 'Digital Platforms and Youth Political Participation',
    dueDate: '2025-02-12',
    daysOverdue: 1,
    reminderSent: 1,
    priority: 'Medium',
  },
  {
    id: 3,
    type: 'Milestone Approaching',
    studentName: 'Student Lee Man Kei',
    topic: 'Literary Analysis and Digital Storytelling',
    dueDate: '2025-02-20',
    daysOverdue: 0,
    reminderSent: 0,
    priority: 'Low',
  },
  {
    id: 4,
    type: 'Missing Documentation',
    studentName: 'Student Chen Wei',
    topic: 'AI Applications in Healthcare',
    dueDate: '2025-02-08',
    daysOverdue: 5,
    reminderSent: 2,
    priority: 'High',
  },
  {
    id: 5,
    type: 'Feedback Due',
    studentName: 'Student Wong Man Ho',
    topic: 'Climate Change Resilience',
    dueDate: '2025-02-15',
    daysOverdue: -1,
    reminderSent: 0,
    priority: 'Medium',
  },
]);

const handleSendReminder = (id: number) => {
  console.log('Send reminder', id);
};

const handleMarkComplete = (id: number) => {
  console.log('Mark complete', id);
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'High':
      return 'border-red-500/50 bg-red-50 text-red-700';
    case 'Medium':
      return 'border-amber-500/50 bg-amber-50 text-amber-700';
    default:
      return 'border-slate-500/50 bg-slate-50 text-slate-700';
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
        <p class="text-sm font-semibold text-slate-900">Reminders Queue</p>
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
        <h2 class="text-sm font-semibold text-slate-900 mb-4">
          {{ reminders.length }} Active Reminders
        </h2>

        <div class="space-y-3">
          <div
            v-for="reminder in reminders"
            :key="reminder.id"
            class="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
          >
            <div class="flex items-start justify-between gap-4 mb-3">
              <div class="flex-1">
                <p class="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                  {{ reminder.type }}
                </p>
                <h3 class="text-sm font-semibold text-slate-900 mt-1">{{ reminder.studentName }}</h3>
                <p class="text-xs text-slate-600 mt-1">{{ reminder.topic }}</p>
              </div>
              <div class="flex flex-col gap-2 items-end">
                <span
                  :class="['inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium', getPriorityColor(reminder.priority)]"
                >
                  {{ reminder.priority }} Priority
                </span>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-4 mb-4 text-xs">
              <div>
                <p class="text-slate-500">Due Date</p>
                <p class="font-medium text-slate-900">{{ reminder.dueDate }}</p>
              </div>
              <div>
                <p class="text-slate-500">Days Overdue</p>
                <p :class="['font-medium', reminder.daysOverdue > 0 ? 'text-red-600' : 'text-slate-900']">
                  {{ reminder.daysOverdue > 0 ? '+' + reminder.daysOverdue : 'On Track' }}
                </p>
              </div>
              <div>
                <p class="text-slate-500">Reminders Sent</p>
                <p class="font-medium text-slate-900">{{ reminder.reminderSent }}</p>
              </div>
            </div>

            <div class="flex gap-2">
              <button
                @click="handleSendReminder(reminder.id)"
                class="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 border border-blue-200"
              >
                <BellIcon class="h-4 w-4" />
                Send Reminder
              </button>
              <button
                @click="handleMarkComplete(reminder.id)"
                class="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
              >
                <CheckIcon class="h-4 w-4" />
                Mark Complete
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
</style>
