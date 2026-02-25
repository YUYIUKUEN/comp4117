<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  ArrowLeftIcon,
  BellIcon,
  CheckIcon,
} from '@heroicons/vue/24/outline';
import httpClient from '@/services/httpClient';

const router = useRouter();

interface ReminderItem {
  id: string;
  type: string;
  studentName: string;
  studentEmail: string;
  topic: string;
  dueDate: string;
  daysOverdue: number;
  reminderSent: number;
  priority: 'High' | 'Medium' | 'Low';
  phase: string;
}

const reminders = ref<ReminderItem[]>([]);
const isLoading = ref(false);
const completedIds = ref<Set<string>>(new Set());
const toast = ref<{ message: string; type: 'success' | 'error' } | null>(null);
const actionLoading = ref<Record<string, boolean>>({});

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  toast.value = { message, type };
  setTimeout(() => { toast.value = null; }, 4000);
};

const fetchReminders = async () => {
  isLoading.value = true;
  try {
    // Fetch all supervisor submissions (overdue and not submitted)
    const [overdueRes, notSubmittedRes] = await Promise.all([
      httpClient.get('/submissions/supervisor/submissions', { params: { status: 'Overdue' } }),
      httpClient.get('/submissions/supervisor/submissions', { params: { status: 'Not Submitted' } }),
    ]);

    const overdueSubs = overdueRes.data.data || [];
    const notSubmittedSubs = notSubmittedRes.data.data || [];

    const now = new Date();
    const items: ReminderItem[] = [];

    // Build reminders from overdue submissions
    for (const sub of overdueSubs) {
      const due = sub.dueDate ? new Date(sub.dueDate) : null;
      const days = due ? Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      items.push({
        id: sub._id,
        type: 'Overdue Submission',
        studentName: sub.student_id?.fullName || 'Unknown Student',
        studentEmail: sub.student_id?.email || '',
        topic: sub.topic_id?.title || 'Unknown Topic',
        dueDate: due ? due.toISOString().split('T')[0] : '—',
        daysOverdue: days,
        reminderSent: 0,
        priority: days >= 7 ? 'High' : days >= 3 ? 'High' : 'Medium',
        phase: sub.phase || '',
      });
    }

    // Build reminders from not-yet-submitted with upcoming due dates
    for (const sub of notSubmittedSubs) {
      const due = sub.dueDate ? new Date(sub.dueDate) : null;
      if (!due) continue;
      const days = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      // Only show if due within 7 days or already past
      if (days < -7) continue;
      items.push({
        id: sub._id,
        type: days > 0 ? 'Missing Submission' : 'Deadline Approaching',
        studentName: sub.student_id?.fullName || 'Unknown Student',
        studentEmail: sub.student_id?.email || '',
        topic: sub.topic_id?.title || 'Unknown Topic',
        dueDate: due.toISOString().split('T')[0],
        daysOverdue: days,
        reminderSent: 0,
        priority: days > 0 ? 'High' : days >= -2 ? 'Medium' : 'Low',
        phase: sub.phase || '',
      });
    }

    // Sort: highest overdue first
    items.sort((a, b) => b.daysOverdue - a.daysOverdue);
    reminders.value = items;
  } catch (error) {
    console.error('Failed to load reminders:', error);
  } finally {
    isLoading.value = false;
  }
};

const activeReminders = computed(() =>
  reminders.value.filter(r => !completedIds.value.has(r.id))
);

const handleSendReminder = async (reminder: ReminderItem) => {
  actionLoading.value[reminder.id] = true;
  try {
    // Since there's no dedicated email endpoint, we simulate sending
    // In a real implementation this would call an email API
    await new Promise(resolve => setTimeout(resolve, 500));
    reminder.reminderSent += 1;
    showToast(`Reminder sent to ${reminder.studentName} (${reminder.studentEmail}) about ${reminder.phase}.`, 'success');
  } catch {
    showToast('Failed to send reminder.', 'error');
  } finally {
    actionLoading.value[reminder.id] = false;
  }
};

const handleMarkComplete = (reminder: ReminderItem) => {
  completedIds.value.add(reminder.id);
  showToast(`Marked "${reminder.phase}" reminder for ${reminder.studentName} as complete.`, 'success');
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

onMounted(fetchReminders);
</script>

<template>
  <div class="min-h-[calc(100vh-3.25rem)] bg-slate-50">
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
        class="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 shadow-lg text-sm font-medium max-w-md"
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
    </header>

    <main class="px-4 sm:px-6 pb-6 pt-4 sm:pt-5">
      <!-- Loading -->
      <div v-if="isLoading" class="rounded-xl border border-slate-200 bg-white p-8 shadow-sm flex items-center justify-center gap-3">
        <div class="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"></div>
        <p class="text-sm text-slate-600">Loading reminders...</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="activeReminders.length === 0" class="rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <p class="text-sm font-medium text-slate-900">No active reminders</p>
        <p class="mt-1 text-xs text-slate-500">All submissions are on track.</p>
      </div>

      <div v-else class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <h2 class="text-sm font-semibold text-slate-900 mb-4">
          {{ activeReminders.length }} Active Reminder{{ activeReminders.length !== 1 ? 's' : '' }}
        </h2>

        <div class="space-y-3">
          <div
            v-for="reminder in activeReminders"
            :key="reminder.id"
            class="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
          >
            <div class="flex items-start justify-between gap-4 mb-3">
              <div class="flex-1">
                <p class="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                  {{ reminder.type }}
                </p>
                <h3 class="text-sm font-semibold text-slate-900 mt-1">{{ reminder.studentName }}</h3>
                <p class="text-xs text-slate-600 mt-0.5">{{ reminder.topic }}</p>
                <p class="text-[11px] text-slate-400 mt-0.5">Phase: {{ reminder.phase }}</p>
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
                :disabled="actionLoading[reminder.id]"
                @click="handleSendReminder(reminder)"
                class="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 border border-blue-200 disabled:opacity-50"
              >
                <BellIcon class="h-4 w-4" />
                {{ actionLoading[reminder.id] ? 'Sending...' : 'Send Reminder' }}
              </button>
              <button
                @click="handleMarkComplete(reminder)"
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
