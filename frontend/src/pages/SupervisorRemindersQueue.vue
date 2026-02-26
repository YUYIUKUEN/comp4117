<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  ArrowLeftIcon,
  BellIcon,
  CheckIcon,
  EnvelopeIcon,
  Cog6ToothIcon,
  BoltIcon,
} from '@heroicons/vue/24/outline';
import httpClient from '@/services/httpClient';
import { useAuthStore } from '@/stores/authStore';

const router = useRouter();
const authStore = useAuthStore();
authStore.loadAuthFromStorage();
const isAdmin = computed(() => authStore.userRole?.toLowerCase() === 'admin');
const isAdminOrSupervisor = computed(() => ['admin', 'supervisor'].includes(authStore.userRole?.toLowerCase() ?? ''));

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

interface AutoReminderSettings {
  enabled: boolean;
  frequencyHours: number;
  maxRemindersPerStudent: number;
  targetStatuses: string[];
  customMessage: string;
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

// Settings panel state
const showSettings = ref(false);
const settingsLoading = ref(false);
const settingsSaving = ref(false);
const autoSendRunning = ref(false);
const autoSettings = ref<AutoReminderSettings>({
  enabled: false,
  frequencyHours: 24,
  maxRemindersPerStudent: 3,
  targetStatuses: ['Overdue', 'Not Submitted'],
  customMessage: '',
});

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

/** Fetch auto-reminder settings */
const fetchSettings = async () => {
  settingsLoading.value = true;
  try {
    const res = await httpClient.get('/admin/reminders/settings');
    autoSettings.value = { ...autoSettings.value, ...res.data.data };
  } catch (error) {
    console.error('Failed to load settings:', error);
  } finally {
    settingsLoading.value = false;
  }
};

/** Save auto-reminder settings */
const saveSettings = async () => {
  settingsSaving.value = true;
  try {
    await httpClient.put('/admin/reminders/settings', autoSettings.value);
    showToast('Auto-reminder settings saved.', 'success');
  } catch (error) {
    console.error('Failed to save settings:', error);
    showToast('Failed to save settings.', 'error');
  } finally {
    settingsSaving.value = false;
  }
};

/** Trigger auto-send now */
const triggerAutoSendNow = async () => {
  autoSendRunning.value = true;
  try {
    const res = await httpClient.post('/admin/reminders/auto-send');
    const data = res.data.data;
    showToast(`Auto-send complete: ${data.sent} sent, ${data.failed || 0} failed.`, 'success');
    await fetchReminders();
  } catch (error: any) {
    const msg = error?.response?.data?.error || 'Auto-send failed.';
    showToast(msg, 'error');
  } finally {
    autoSendRunning.value = false;
  }
};

const toggleStatus = (status: string) => {
  const idx = autoSettings.value.targetStatuses.indexOf(status);
  if (idx > -1) {
    // Don't allow removing the last status
    if (autoSettings.value.targetStatuses.length > 1) {
      autoSettings.value.targetStatuses.splice(idx, 1);
    }
  } else {
    autoSettings.value.targetStatuses.push(status);
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

onMounted(() => {
  fetchReminders();
  if (isAdminOrSupervisor.value) fetchSettings();
});
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
      <div class="flex-1">
        <p class="text-[11px] uppercase tracking-[0.2em] text-slate-500">{{ isAdmin ? 'Admin' : 'Supervision' }}</p>
        <p class="text-sm font-semibold text-slate-900">Reminders Queue</p>
      </div>
      <!-- Auto-send indicator + settings button (Admin & Supervisor) -->
      <template v-if="isAdminOrSupervisor">
        <span
          v-if="autoSettings.enabled"
          class="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Auto-Send On
        </span>
        <span
          v-else
          class="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500"
        >
          Auto-Send Off
        </span>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          @click="showSettings = !showSettings"
          title="Auto-Send Settings"
        >
          <Cog6ToothIcon class="h-5 w-5" />
        </button>
      </template>
    </header>

    <main class="px-4 sm:px-6 pb-6 pt-4 sm:pt-5">
      <!-- Auto-Send Settings Panel (Admin only) -->
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div v-if="isAdminOrSupervisor && showSettings" class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm mb-4">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-sm font-semibold text-slate-900">Auto-Send Settings</h2>
              <p class="text-xs text-slate-500 mt-0.5">Configure automatic reminder emails or send them manually one by one.</p>
            </div>
            <!-- Toggle switch -->
            <button
              @click="autoSettings.enabled = !autoSettings.enabled"
              :class="[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                autoSettings.enabled ? 'bg-emerald-500' : 'bg-slate-300',
              ]"
            >
              <span
                :class="[
                  'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                  autoSettings.enabled ? 'translate-x-6' : 'translate-x-1',
                ]"
              />
            </button>
          </div>

          <div v-if="settingsLoading" class="flex items-center gap-2 py-4">
            <div class="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"></div>
            <p class="text-xs text-slate-500">Loading settings...</p>
          </div>

          <div v-else class="space-y-4">
            <!-- Frequency -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Send Frequency</label>
                <select
                  v-model.number="autoSettings.frequencyHours"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
                >
                  <option :value="6">Every 6 hours</option>
                  <option :value="12">Every 12 hours</option>
                  <option :value="24">Every 24 hours (daily)</option>
                  <option :value="48">Every 48 hours</option>
                  <option :value="72">Every 72 hours</option>
                  <option :value="168">Every 7 days (weekly)</option>
                </select>
              </div>

              <!-- Max reminders per student -->
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Max Reminders per Student</label>
                <select
                  v-model.number="autoSettings.maxRemindersPerStudent"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
                >
                  <option :value="1">1 reminder</option>
                  <option :value="2">2 reminders</option>
                  <option :value="3">3 reminders</option>
                  <option :value="5">5 reminders</option>
                  <option :value="10">10 reminders</option>
                </select>
              </div>
            </div>

            <!-- Target statuses -->
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">Send To</label>
              <div class="flex gap-2">
                <button
                  @click="toggleStatus('Overdue')"
                  :class="[
                    'rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors',
                    autoSettings.targetStatuses.includes('Overdue')
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300',
                  ]"
                >
                  ✓ Overdue Submissions
                </button>
                <button
                  @click="toggleStatus('Not Submitted')"
                  :class="[
                    'rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors',
                    autoSettings.targetStatuses.includes('Not Submitted')
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300',
                  ]"
                >
                  ✓ Not Submitted
                </button>
              </div>
            </div>

            <!-- Default custom message -->
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Default Message (optional)</label>
              <textarea
                v-model="autoSettings.customMessage"
                rows="2"
                placeholder="A default note included in all auto-sent emails…"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none resize-none"
              />
            </div>

            <!-- Action buttons -->
            <div class="flex items-center gap-2 pt-1">
              <button
                @click="saveSettings"
                :disabled="settingsSaving"
                class="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {{ settingsSaving ? 'Saving...' : 'Save Settings' }}
              </button>
              <button
                @click="triggerAutoSendNow"
                :disabled="autoSendRunning || !autoSettings.enabled"
                class="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                :title="!autoSettings.enabled ? 'Enable auto-send first' : 'Send reminders to all qualifying students now'"
              >
                <BoltIcon class="h-4 w-4" />
                {{ autoSendRunning ? 'Sending...' : 'Run Auto-Send Now' }}
              </button>
            </div>

            <p v-if="autoSettings.enabled" class="text-[11px] text-emerald-600">
              ✓ Auto-send is <strong>enabled</strong>. The system will automatically send reminders every
              {{ autoSettings.frequencyHours }} hour{{ autoSettings.frequencyHours !== 1 ? 's' : '' }},
              up to {{ autoSettings.maxRemindersPerStudent }} per student.
            </p>
            <p v-else class="text-[11px] text-slate-400">
              Auto-send is <strong>disabled</strong>. You can send reminders manually using the buttons on each card below.
            </p>
          </div>
        </div>
      </transition>

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
              <p class="text-xs mt-1" :class="messageTarget?.daysOverdue > 0 ? 'text-red-600 font-medium' : 'text-amber-600 font-medium'">
                Status: {{ messageTarget?.daysOverdue > 0 ? 'Overdue by ' + messageTarget?.daysOverdue + ' day(s)' : 'Not yet submitted' }}
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
