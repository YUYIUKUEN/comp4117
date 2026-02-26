<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  ArrowLeftIcon,
  BellIcon,
  CheckIcon,
  EnvelopeIcon,
} from '@heroicons/vue/24/outline';
import httpClient from '@/services/httpClient';
import { useAuthStore } from '@/stores/authStore';

const router = useRouter();
const authStore = useAuthStore();
authStore.loadAuthFromStorage();
const isAdmin = computed(() => authStore.userRole === 'Admin');

interface ReminderItem {
  id: string;
  type: string;
  studentName: string;
  studentEmail: string;
  studentConcentration: string;
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

// Modal state for custom message before sending
const showMessageModal = ref(false);
const messageTarget = ref<ReminderItem | null>(null);
const customMessage = ref('');

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  toast.value = { message, type };
  setTimeout(() => { toast.value = null; }, 4000);
};

/** Fetch reminders using the admin/reminders endpoint (available for Admin & Supervisor) */
const fetchReminders = async () => {
  isLoading.value = true;
  try {
    const res = await httpClient.get('/admin/reminders');
    const data = res.data.data || [];
    reminders.value = data.map((r: any) => ({
      id: r.id,
      type: r.status === 'Overdue' ? 'Overdue Submission' : 'Not Submitted',
      studentName: r.student?.fullName || 'Unknown Student',
      studentEmail: r.student?.email || '',
      studentConcentration: r.student?.concentration || '',
      topic: r.topic?.title || 'Unknown Topic',
      dueDate: r.dueDate ? new Date(r.dueDate).toISOString().split('T')[0] : '—',
      daysOverdue: r.daysOverdue,
      reminderSent: r.reminderCount || 0,
      priority: r.priority,
      phase: r.phase || '',
    }));
  } catch (error) {
    console.error('Failed to load reminders:', error);
    showToast('Failed to load reminders.', 'error');
  } finally {
    isLoading.value = false;
  }
};

const activeReminders = computed(() =>
  reminders.value.filter(r => !completedIds.value.has(r.id))
);

/** Open modal to optionally add a custom message before sending */
const openSendModal = (reminder: ReminderItem) => {
  messageTarget.value = reminder;
  customMessage.value = '';
  showMessageModal.value = true;
};

/** Actually send the reminder email via backend */
const confirmSendReminder = async () => {
  if (!messageTarget.value) return;
  const reminder = messageTarget.value;
  showMessageModal.value = false;
  actionLoading.value[reminder.id] = true;

  try {
    const body: Record<string, string> = {};
    if (customMessage.value.trim()) body.customMessage = customMessage.value.trim();

    await httpClient.post(`/admin/reminders/${reminder.id}/send`, body);
    reminder.reminderSent += 1;
    showToast(`Reminder email sent to ${reminder.studentName} (${reminder.studentEmail}).`, 'success');
  } catch (err: any) {
    const msg = err?.response?.data?.error || 'Failed to send reminder email.';
    showToast(msg, 'error');
  } finally {
    actionLoading.value[reminder.id] = false;
    messageTarget.value = null;
    customMessage.value = '';
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
        <p class="text-[11px] uppercase tracking-[0.2em] text-slate-500">{{ isAdmin ? 'Admin' : 'Supervision' }}</p>
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
                <!-- Student email – clickable mailto link -->
                <p class="text-xs text-blue-600 mt-0.5">
                  <a :href="'mailto:' + reminder.studentEmail" class="hover:underline">
                    {{ reminder.studentEmail || '—' }}
                  </a>
                </p>
                <p v-if="reminder.studentConcentration" class="text-[11px] text-slate-400 mt-0.5">
                  {{ reminder.studentConcentration }}
                </p>
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
                @click="openSendModal(reminder)"
                class="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 border border-blue-200 disabled:opacity-50"
              >
                <BellIcon class="h-4 w-4" />
                {{ actionLoading[reminder.id] ? 'Sending...' : 'Send Reminder' }}
              </button>
              <!-- Direct email link -->
              <a
                v-if="reminder.studentEmail"
                :href="'mailto:' + reminder.studentEmail"
                class="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200"
              >
                <EnvelopeIcon class="h-4 w-4" />
                Direct Email
              </a>
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

    <!-- Send Reminder Modal -->
    <teleport to="body">
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showMessageModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div class="w-full max-w-md mx-4 bg-white rounded-xl shadow-xl overflow-hidden">
            <div class="px-5 pt-5 pb-3">
              <h3 class="text-base font-semibold text-slate-900">Send Reminder Email</h3>
              <p class="text-xs text-slate-500 mt-1">
                To: <strong>{{ messageTarget?.studentName }}</strong>
                ({{ messageTarget?.studentEmail }})
              </p>
              <p class="text-xs text-slate-500">
                Phase: {{ messageTarget?.phase }} · Topic: {{ messageTarget?.topic }}
              </p>
            </div>
            <div class="px-5 pb-3">
              <label class="block text-xs font-medium text-slate-600 mb-1">Custom Message (optional)</label>
              <textarea
                v-model="customMessage"
                rows="3"
                placeholder="Add a personal note to the student…"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none resize-none"
              />
            </div>
            <div class="flex justify-end gap-2 px-5 pb-5">
              <button
                @click="showMessageModal = false; messageTarget = null;"
                class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                @click="confirmSendReminder"
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <BellIcon class="inline h-4 w-4 mr-1 -mt-0.5" />
                Send Reminder
              </button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<style scoped>
</style>
