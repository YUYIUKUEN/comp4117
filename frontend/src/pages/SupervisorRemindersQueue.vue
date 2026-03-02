<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  ArrowLeftIcon,
  BellIcon,
  CheckIcon,
  EnvelopeIcon,
  Cog6ToothIcon,
  BoltIcon,
  EyeIcon,
  ChevronRightIcon,
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

interface StudentReminderGroup {
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentConcentration: string;
  reminders: ReminderItem[];
}

interface EmailTemplate {
  subjectOverdue: string;
  subjectPending: string;
  greeting: string;
  bodyOverdue: string;
  bodyPending: string;
  closingOverdue: string;
  closingPending: string;
  signOff: string;
  teamName: string;
}

interface AutoReminderSettings {
  enabled: boolean;
  frequencyHours: number;
  maxRemindersPerStudent: number;
  targetStatuses: string[];
  customMessage: string;
  emailTemplate: EmailTemplate;
}

const defaultTemplate: EmailTemplate = {
  subjectOverdue: 'Reminder: {{phase}} Submission Overdue',
  subjectPending: 'Reminder: {{phase}} Submission Pending',
  greeting: 'Dear {{studentName}},',
  bodyOverdue: 'This is a reminder that your submission for <strong>{{phase}}</strong> (Topic: <em>{{topicTitle}}</em>) is currently <strong>overdue</strong>.',
  bodyPending: 'This is a reminder that your submission for <strong>{{phase}}</strong> (Topic: <em>{{topicTitle}}</em>) has <strong>not yet been submitted</strong>.',
  closingOverdue: 'Please submit your work as soon as possible through the FYP Management Platform to avoid further penalties.',
  closingPending: 'Please submit your work before the deadline through the FYP Management Platform.',
  signOff: 'Best regards,',
  teamName: 'FYP Management Team',
};

const reminders = ref<ReminderItem[]>([]);
const isLoading = ref(false);
const completedIds = ref<Set<string>>(new Set());
const toast = ref<{ message: string; type: 'success' | 'error' } | null>(null);
const actionLoading = ref<Record<string, boolean>>({});

// Bulk selection state
const selectedReminderIds = ref<Set<string>>(new Set());
const bulkSending = ref(false);

// Modal state for custom message before sending
const showMessageModal = ref(false);
const messageTarget = ref<ReminderItem | null>(null);
const customMessage = ref('');

// Settings panel state
const showSettings = ref(false);
const settingsTab = ref<'general' | 'template'>('general');
const settingsLoading = ref(false);
const settingsSaving = ref(false);
const autoSendRunning = ref(false);
const previewMode = ref<'overdue' | 'pending'>('overdue');
const showPreview = ref(true);
const autoSettings = ref<AutoReminderSettings>({
  enabled: false,
  frequencyHours: 24,
  maxRemindersPerStudent: 3,
  targetStatuses: ['Overdue', 'Not Submitted'],
  customMessage: '',
  emailTemplate: { ...defaultTemplate },
});

/** Fill template variables with sample data for preview */
const fillPreview = (str: string) => {
  const sampleVars: Record<string, string> = {
    studentName: 'John Doe',
    phase: 'Progress Report 1',
    topicTitle: 'AI-Powered Student Dashboard',
    dueDate: 'April 15, 2026',
  };
  return (str || '').replace(/\{\{(\w+)\}\}/g, (_, k: string) => sampleVars[k] || `{{${k}}}`);
};

const templatePreview = computed(() => {
  const t = autoSettings.value.emailTemplate || defaultTemplate;
  const isOverdue = previewMode.value === 'overdue';
  return {
    subject: fillPreview(isOverdue ? t.subjectOverdue : t.subjectPending),
    greeting: fillPreview(t.greeting),
    body: fillPreview(isOverdue ? t.bodyOverdue : t.bodyPending),
    closing: fillPreview(isOverdue ? t.closingOverdue : t.closingPending),
    signOff: fillPreview(t.signOff),
    teamName: fillPreview(t.teamName),
  };
});

const resetTemplate = () => {
  autoSettings.value.emailTemplate = { ...defaultTemplate };
  activePreset.value = null;
  showToast('Template reset to defaults.', 'success');
};

/* ---- Template presets ---- */
const templatePresets: { key: string; label: string; icon: string; desc: string; template: EmailTemplate }[] = [
  {
    key: 'friendly',
    label: 'Friendly Reminder',
    icon: '😊',
    desc: 'Warm, encouraging tone',
    template: {
      subjectOverdue: 'Gentle Reminder: Your {{phase}} Submission',
      subjectPending: 'Quick Reminder: {{phase}} Submission',
      greeting: 'Hi {{studentName}},',
      bodyOverdue: 'Just a friendly reminder that your submission for <strong>{{phase}}</strong> (Topic: <em>{{topicTitle}}</em>) is now past the due date. We understand things can get busy!',
      bodyPending: 'Just a quick heads-up — your submission for <strong>{{phase}}</strong> (Topic: <em>{{topicTitle}}</em>) hasn\'t been submitted yet.',
      closingOverdue: 'Please try to submit as soon as you can. If you\'re having any difficulties, don\'t hesitate to reach out to your supervisor for support.',
      closingPending: 'Please remember to submit before the deadline. If you need any help, feel free to reach out to your supervisor.',
      signOff: 'Best wishes,',
      teamName: 'FYP Management Team',
    },
  },
  {
    key: 'urgent',
    label: 'Urgent Notice',
    icon: '⚠️',
    desc: 'Firm, action-oriented tone',
    template: {
      subjectOverdue: 'URGENT: {{phase}} Submission Overdue – Immediate Action Required',
      subjectPending: 'Action Required: {{phase}} Submission Deadline Approaching',
      greeting: 'Dear {{studentName}},',
      bodyOverdue: 'This is an <strong>urgent notice</strong> that your submission for <strong>{{phase}}</strong> (Topic: <em>{{topicTitle}}</em>) is <strong>overdue</strong>. Failure to submit may result in academic penalties.',
      bodyPending: 'This is an important reminder that your submission for <strong>{{phase}}</strong> (Topic: <em>{{topicTitle}}</em>) has <strong>not yet been received</strong>. Please take immediate action.',
      closingOverdue: 'You must submit your work <strong>immediately</strong> through the FYP Management Platform. Contact your supervisor if you are facing any issues that prevent submission.',
      closingPending: 'Please ensure your work is submitted before the deadline to avoid any penalties. Contact your supervisor immediately if you are unable to submit.',
      signOff: 'Regards,',
      teamName: 'FYP Management Team',
    },
  },
  {
    key: 'formal',
    label: 'Formal Academic',
    icon: '🎓',
    desc: 'Professional, institutional tone',
    template: {
      subjectOverdue: 'Notice: Outstanding {{phase}} Submission',
      subjectPending: 'Reminder: Pending {{phase}} Submission',
      greeting: 'Dear {{studentName}},',
      bodyOverdue: 'We wish to inform you that the submission for <strong>{{phase}}</strong> (Topic: <em>{{topicTitle}}</em>) remains outstanding as of the current date.',
      bodyPending: 'This correspondence serves as a reminder that your submission for <strong>{{phase}}</strong> (Topic: <em>{{topicTitle}}</em>) has not yet been received by the department.',
      closingOverdue: 'You are advised to complete and submit your work through the FYP Management Platform at your earliest convenience. Late submissions may be subject to the penalties outlined in the programme handbook.',
      closingPending: 'Kindly ensure your submission is completed before the stipulated deadline via the FYP Management Platform.',
      signOff: 'Yours sincerely,',
      teamName: 'FYP Management Office',
    },
  },
];

const activePreset = ref<string | null>(null);

const applyPreset = (preset: typeof templatePresets[number]) => {
  autoSettings.value.emailTemplate = { ...preset.template };
  activePreset.value = preset.key;
  showToast(`Applied "${preset.label}" template.`, 'success');
};

/* ---- Template field helpers ---- */
const lastFocusedField = ref<{ el: HTMLInputElement | HTMLTextAreaElement; key: keyof EmailTemplate } | null>(null);

const handleFieldFocus = (event: FocusEvent, key: keyof EmailTemplate) => {
  lastFocusedField.value = { el: event.target as HTMLInputElement | HTMLTextAreaElement, key };
};

/** Insert a variable placeholder at the cursor position in the last-focused field */
const insertVariable = (varName: string) => {
  if (!lastFocusedField.value) {
    showToast('Click on a text field first, then click an Insert button.', 'error');
    return;
  }
  const { el, key } = lastFocusedField.value;
  const placeholder = `{{${varName}}}`;
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? 0;
  const cur = autoSettings.value.emailTemplate[key] || '';
  autoSettings.value.emailTemplate[key] = cur.substring(0, start) + placeholder + cur.substring(end);
  nextTick(() => {
    el.focus();
    const pos = start + placeholder.length;
    el.setSelectionRange(pos, pos);
  });
};

/** Wrap the selected text in the last-focused field with a formatting tag */
const applyFormatting = (tag: 'strong' | 'em') => {
  if (!lastFocusedField.value) {
    showToast('Click on a text field and select some text first.', 'error');
    return;
  }
  const { el, key } = lastFocusedField.value;
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? 0;
  if (start === end) {
    showToast('Highlight some text first, then click Bold or Italic.', 'error');
    return;
  }
  const cur = autoSettings.value.emailTemplate[key] || '';
  const selected = cur.substring(start, end);
  const wrapped = `<${tag}>${selected}</${tag}>`;
  autoSettings.value.emailTemplate[key] = cur.substring(0, start) + wrapped + cur.substring(end);
  nextTick(() => {
    el.focus();
    el.setSelectionRange(start + wrapped.length, start + wrapped.length);
  });
};

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
    const data = res.data.data;
    autoSettings.value = {
      ...autoSettings.value,
      ...data,
      emailTemplate: { ...defaultTemplate, ...(data.emailTemplate || {}) },
    };
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

// Track which student groups are expanded
const expandedReminderStudents = ref<Set<string>>(new Set());

// Group reminders by supervised student
const groupedRemindersByStudent = computed<StudentReminderGroup[]>(() => {
  const map = new Map<string, StudentReminderGroup>();
  for (const reminder of activeReminders.value) {
    const key = reminder.studentEmail || reminder.studentName;
    if (!map.has(key)) {
      map.set(key, {
        studentId: key,
        studentName: reminder.studentName,
        studentEmail: reminder.studentEmail,
        studentConcentration: reminder.studentConcentration,
        reminders: [],
      });
    }
    const group = map.get(key)!;
    group.reminders.push(reminder);
  }
  // Sort groups by student name
  return Array.from(map.values()).sort((a, b) => a.studentName.localeCompare(b.studentName));
});

// Auto-expand all student groups on initial load
watch(groupedRemindersByStudent, (groups) => {
  if (expandedReminderStudents.value.size === 0 && groups.length > 0) {
    groups.forEach(g => expandedReminderStudents.value.add(g.studentId));
  }
}, { immediate: true });

// Group reminders by concentration for admin view
interface ConcentrationGroup {
  concentration: string;
  reminders: ReminderItem[];
}

const groupedRemindersByConcentration = computed<ConcentrationGroup[]>(() => {
  const map = new Map<string, ConcentrationGroup>();
  for (const reminder of activeReminders.value) {
    const conc = reminder.studentConcentration || 'Unassigned';
    if (!map.has(conc)) {
      map.set(conc, {
        concentration: conc,
        reminders: [],
      });
    }
    const group = map.get(conc)!;
    group.reminders.push(reminder);
  }
  // Sort groups by concentration name
  return Array.from(map.values()).sort((a, b) => a.concentration.localeCompare(b.concentration));
});

// Track which concentration groups are expanded
const expandedConcentrations = ref<Set<string>>(new Set());

// Auto-expand all concentration groups on initial load
watch(groupedRemindersByConcentration, (groups) => {
  if (expandedConcentrations.value.size === 0 && groups.length > 0) {
    groups.forEach(g => expandedConcentrations.value.add(g.concentration));
  }
}, { immediate: true });

// Bulk action helpers
const selectAllReminders = () => {
  activeReminders.value.forEach(r => selectedReminderIds.value.add(r.id));
};

const deselectAllReminders = () => {
  selectedReminderIds.value.clear();
};

const toggleReminderSelection = (id: string) => {
  if (selectedReminderIds.value.has(id)) {
    selectedReminderIds.value.delete(id);
  } else {
    selectedReminderIds.value.add(id);
  }
};

/** Send reminders in bulk to all selected reminders */
const sendBulkReminders = async () => {
  if (selectedReminderIds.value.size === 0) {
    showToast('Please select at least one reminder to send.', 'error');
    return;
  }

  const selectedCount = selectedReminderIds.value.size;
  if (!confirm(`Send reminder emails to ${selectedCount} student(s)?`)) {
    return;
  }

  bulkSending.value = true;
  let successCount = 0;
  let failCount = 0;

  try {
    for (const reminderId of selectedReminderIds.value) {
      try {
        const reminder = activeReminders.value.find(r => r.id === reminderId);
        if (!reminder) continue;

        await httpClient.post(`/reminders/${reminderId}/send`, {});
        successCount++;
        completedIds.value.add(reminderId);
      } catch (err) {
        console.error(`Failed to send reminder ${reminderId}:`, err);
        failCount++;
      }
    }

    selectedReminderIds.value.clear();
    let msg = `Sent ${successCount} reminder email(s)`;
    if (failCount > 0) {
      msg += ` (${failCount} failed)`;
    }
    showToast(msg, failCount > 0 ? 'error' : 'success');
  } finally {
    bulkSending.value = false;
  }
};

// Bulk selection computed properties
const selectedCount = computed(() => selectedReminderIds.value.size);
const isAllSelected = computed(() => {
  if (activeReminders.value.length === 0) return false;
  return activeReminders.value.every(r => selectedReminderIds.value.has(r.id));
});

const canSelectAll = computed(() => activeReminders.value.length > 0);

const toggleSelectReminder = (reminderId: string) => {
  if (selectedReminderIds.value.has(reminderId)) {
    selectedReminderIds.value.delete(reminderId);
  } else {
    selectedReminderIds.value.add(reminderId);
  }
};

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedReminderIds.value.clear();
  } else {
    activeReminders.value.forEach(r => selectedReminderIds.value.add(r.id));
  }
};

const bulkSendReminders = async () => {
  if (selectedReminderIds.value.size === 0) {
    showToast('No reminders selected.', 'error');
    return;
  }

  bulkSending.value = true;
  let successCount = 0;
  let failureCount = 0;

  try {
    for (const reminderId of selectedReminderIds.value) {
      const reminder = activeReminders.value.find(r => r.id === reminderId);
      if (!reminder) continue;

      actionLoading.value[reminderId] = true;
      try {
        const body: Record<string, string> = {};
        body[`${reminder.studentEmail.replace('@', '_at_').replace('.', '_dot_')}`] = reminder.studentEmail;
        
        await httpClient.post('/admin/reminders/send', {
          submissionId: reminder.id,
          customMessage: '',
        });
        
        completedIds.value.add(reminderId);
        successCount++;
      } catch (error) {
        console.error(`Failed to send reminder to ${reminder.studentEmail}:`, error);
        failureCount++;
      } finally {
        actionLoading.value[reminderId] = false;
      }
    }

    // Clear selection after sending
    selectedReminderIds.value.clear();
    
    if (successCount > 0) {
      showToast(`Sent reminders to ${successCount} student${successCount !== 1 ? 's' : ''}.`, 'success');
    }
    if (failureCount > 0) {
      showToast(`Failed to send ${failureCount} reminder${failureCount !== 1 ? 's' : ''}.`, 'error');
    }
  } finally {
    bulkSending.value = false;
  }
};

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
        <div v-if="isAdminOrSupervisor && showSettings" class="rounded-xl border border-slate-200 bg-white shadow-sm mb-4">
          <!-- Settings header -->
          <div class="flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
            <div>
              <h2 class="text-sm font-semibold text-slate-900">Reminder Settings</h2>
              <p class="text-xs text-slate-500 mt-0.5">Configure auto-send and customise the email template.</p>
            </div>
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

          <!-- Tab bar -->
          <div class="flex border-b border-slate-200 px-4 sm:px-5 gap-4">
            <button
              @click="settingsTab = 'general'"
              :class="[
                'pb-2 text-xs font-medium border-b-2 transition-colors -mb-px',
                settingsTab === 'general'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700',
              ]"
            >
              General
            </button>
            <button
              @click="settingsTab = 'template'"
              :class="[
                'pb-2 text-xs font-medium border-b-2 transition-colors -mb-px',
                settingsTab === 'template'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700',
              ]"
            >
              Email Template
            </button>
          </div>

          <div v-if="settingsLoading" class="flex items-center gap-2 py-8 justify-center">
            <div class="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"></div>
            <p class="text-xs text-slate-500">Loading settings...</p>
          </div>

          <div v-else class="px-4 sm:px-5 pb-4 sm:pb-5 pt-4">
            <!-- ============ General tab ============ -->
            <div v-if="settingsTab === 'general'" class="space-y-4">
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

              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Default Message (optional)</label>
                <textarea
                  v-model="autoSettings.customMessage"
                  rows="2"
                  placeholder="A default note included in all auto-sent emails…"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none resize-none"
                />
              </div>

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

            <!-- ============ Email Template tab ============ -->
            <div v-if="settingsTab === 'template'" class="space-y-4">
              <!-- Preset picker row -->
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-[11px] font-medium text-slate-500">Use a template:</span>
                <button
                  v-for="preset in templatePresets"
                  :key="preset.key"
                  @click="applyPreset(preset)"
                  :class="[
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                    activePreset === preset.key
                      ? 'border-blue-300 bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                  ]"
                >
                  <span>{{ preset.icon }}</span>
                  {{ preset.label }}
                </button>
              </div>

              <!-- Gmail-like compose card -->
              <div class="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <!-- Overdue / Pending toggle — like switching email variants -->
                <div class="flex items-center border-b border-slate-100 bg-slate-50/50">
                  <button
                    @click="previewMode = 'overdue'"
                    :class="[
                      'flex-1 px-4 py-2.5 text-xs font-medium text-center transition-colors border-b-2',
                      previewMode === 'overdue'
                        ? 'border-red-500 text-red-700 bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-700',
                    ]"
                  >
                    ⚠️ Overdue Email
                  </button>
                  <button
                    @click="previewMode = 'pending'"
                    :class="[
                      'flex-1 px-4 py-2.5 text-xs font-medium text-center transition-colors border-b-2',
                      previewMode === 'pending'
                        ? 'border-amber-500 text-amber-700 bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-700',
                    ]"
                  >
                    📋 Pending Email
                  </button>
                </div>

                <!-- Header rows — like Gmail's From / To / Subject -->
                <div class="divide-y divide-slate-100">
                  <!-- From row -->
                  <div class="flex items-center px-4 py-2 gap-3">
                    <span class="text-xs text-slate-400 w-14 shrink-0">From</span>
                    <div class="flex items-center gap-2 flex-1">
                      <input
                        v-model="autoSettings.emailTemplate.teamName"
                        @focus="handleFieldFocus($event, 'teamName')"
                        placeholder="FYP Management Team"
                        class="flex-1 text-sm text-slate-800 bg-transparent outline-none placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                  <!-- To row -->
                  <div class="flex items-center px-4 py-2 gap-3">
                    <span class="text-xs text-slate-400 w-14 shrink-0">To</span>
                    <span class="text-sm text-slate-400 italic">Students with {{ previewMode === 'overdue' ? 'overdue' : 'pending' }} submissions</span>
                  </div>
                  <!-- Subject row -->
                  <div class="flex items-center px-4 py-2 gap-3">
                    <span class="text-xs text-slate-400 w-14 shrink-0">Subject</span>
                    <input
                      v-model="autoSettings.emailTemplate[previewMode === 'overdue' ? 'subjectOverdue' : 'subjectPending']"
                      @focus="handleFieldFocus($event, previewMode === 'overdue' ? 'subjectOverdue' : 'subjectPending')"
                      placeholder="Enter email subject…"
                      class="flex-1 text-sm text-slate-800 bg-transparent outline-none placeholder:text-slate-300"
                    />
                  </div>
                </div>

                <!-- Email body — the compose area -->
                <div class="border-t border-slate-100 px-4 pt-3 pb-1 space-y-3">
                  <!-- Greeting -->
                  <input
                    v-model="autoSettings.emailTemplate.greeting"
                    @focus="handleFieldFocus($event, 'greeting')"
                    placeholder="Dear Student Name,"
                    class="w-full text-sm text-slate-800 bg-transparent outline-none placeholder:text-slate-300"
                  />

                  <!-- Body -->
                  <textarea
                    v-model="autoSettings.emailTemplate[previewMode === 'overdue' ? 'bodyOverdue' : 'bodyPending']"
                    @focus="handleFieldFocus($event, previewMode === 'overdue' ? 'bodyOverdue' : 'bodyPending')"
                    rows="4"
                    placeholder="Write your message here…"
                    class="w-full text-sm text-slate-700 bg-transparent outline-none placeholder:text-slate-300 resize-none leading-relaxed"
                  />

                  <!-- Closing -->
                  <textarea
                    v-model="autoSettings.emailTemplate[previewMode === 'overdue' ? 'closingOverdue' : 'closingPending']"
                    @focus="handleFieldFocus($event, previewMode === 'overdue' ? 'closingOverdue' : 'closingPending')"
                    rows="2"
                    placeholder="Closing message…"
                    class="w-full text-sm text-slate-700 bg-transparent outline-none placeholder:text-slate-300 resize-none leading-relaxed"
                  />

                  <!-- Signature -->
                  <div class="border-t border-dashed border-slate-200 pt-2 pb-2">
                    <input
                      v-model="autoSettings.emailTemplate.signOff"
                      @focus="handleFieldFocus($event, 'signOff')"
                      placeholder="Best regards,"
                      class="w-full text-sm text-slate-600 bg-transparent outline-none placeholder:text-slate-300"
                    />
                    <input
                      v-model="autoSettings.emailTemplate.teamName"
                      @focus="handleFieldFocus($event, 'teamName')"
                      placeholder="Your Team Name"
                      class="w-full text-sm text-slate-600 bg-transparent outline-none placeholder:text-slate-300 mt-0.5"
                    />
                  </div>
                </div>

                <!-- Bottom toolbar — like Gmail's compose toolbar -->
                <div class="flex items-center gap-1 px-3 py-2.5 bg-slate-50 border-t border-slate-100">
                  <!-- Save button (primary) -->
                  <button
                    @click="saveSettings"
                    :disabled="settingsSaving"
                    class="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                  >
                    {{ settingsSaving ? 'Saving...' : 'Save Template' }}
                  </button>

                  <span class="w-px h-5 bg-slate-200 mx-1"></span>

                  <!-- Formatting buttons -->
                  <button
                    @click="applyFormatting('strong')"
                    class="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                    title="Bold — select text first"
                  >
                    <span class="text-sm font-bold">B</span>
                  </button>
                  <button
                    @click="applyFormatting('em')"
                    class="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                    title="Italic — select text first"
                  >
                    <span class="text-sm italic">I</span>
                  </button>

                  <span class="w-px h-5 bg-slate-200 mx-1"></span>

                  <!-- Insert variable pills -->
                  <button @click="insertVariable('studentName')" class="rounded-full bg-blue-50 text-blue-600 px-2 py-1 text-[11px] font-medium hover:bg-blue-100 transition-colors" title="Insert student's name">+ Name</button>
                  <button @click="insertVariable('phase')" class="rounded-full bg-violet-50 text-violet-600 px-2 py-1 text-[11px] font-medium hover:bg-violet-100 transition-colors" title="Insert assignment phase">+ Phase</button>
                  <button @click="insertVariable('topicTitle')" class="rounded-full bg-emerald-50 text-emerald-600 px-2 py-1 text-[11px] font-medium hover:bg-emerald-100 transition-colors" title="Insert topic title">+ Topic</button>
                  <button @click="insertVariable('dueDate')" class="rounded-full bg-amber-50 text-amber-600 px-2 py-1 text-[11px] font-medium hover:bg-amber-100 transition-colors" title="Insert due date">+ Date</button>

                  <!-- Spacer -->
                  <div class="flex-1"></div>

                  <!-- Reset & Preview toggle -->
                  <button
                    @click="resetTemplate"
                    class="text-xs text-slate-400 hover:text-slate-600 transition-colors px-2 py-1"
                    title="Reset to default template"
                  >
                    Reset
                  </button>
                  <button
                    @click="showPreview = !showPreview"
                    :class="[
                      'inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                      showPreview
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700',
                    ]"
                  >
                    <EyeIcon class="h-3.5 w-3.5" />
                    Preview
                  </button>
                </div>
              </div>

              <!-- Info note about template usage -->
              <p class="text-[11px] text-slate-400 leading-relaxed">
                💡 This template is used for <strong>all</strong> reminder emails — both individually sent and auto-sent.
                Switch between <em>Overdue</em> and <em>Pending</em> tabs above to edit each version.
                Click a field, then use the toolbar buttons to insert dynamic content or format text.
              </p>

              <!-- Collapsible preview panel -->
              <transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="opacity-0 -translate-y-2"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-2"
              >
                <div v-if="showPreview" class="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div class="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
                    <h3 class="text-xs font-semibold text-slate-700">
                      <EyeIcon class="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                      Email Preview — {{ previewMode === 'overdue' ? 'Overdue Version' : 'Pending Version' }}
                    </h3>
                    <button @click="showPreview = false" class="text-slate-400 hover:text-slate-600 text-xs">&times; Close</button>
                  </div>
                  <div class="text-sm">
                    <div class="bg-slate-100 px-4 py-2 text-[11px] text-slate-500 border-b border-slate-200 truncate">
                      <strong>Subject:</strong> {{ templatePreview.subject }}
                    </div>
                    <div style="max-height: 400px; overflow-y: auto;">
                      <div :style="{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }" class="text-white text-center py-5 px-4">
                        <div class="text-3xl mb-1">{{ previewMode === 'overdue' ? '⚠️' : '📋' }}</div>
                        <p class="font-semibold text-sm">{{ previewMode === 'overdue' ? 'Submission Reminder – Overdue' : 'Submission Reminder' }}</p>
                      </div>
                      <div class="px-5 py-4 space-y-2 text-[13px] text-slate-700">
                        <p>{{ templatePreview.greeting }}</p>
                        <p v-html="templatePreview.body"></p>
                        <div class="rounded border-l-4 border-amber-400 bg-amber-50 px-3 py-2 my-2">
                          <strong class="text-amber-800 text-xs">{{ previewMode === 'overdue' ? 'Original Due Date' : 'Due Date' }}:</strong>
                          <span :class="previewMode === 'overdue' ? 'text-red-600 font-semibold text-xs ml-1' : 'text-slate-800 font-semibold text-xs ml-1'">April 15, 2026</span>
                        </div>
                        <p class="text-[13px]">{{ templatePreview.closing }}</p>
                      </div>
                      <div class="bg-slate-50 border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
                        <p class="font-medium">{{ templatePreview.signOff }}</p>
                        <p>{{ templatePreview.teamName }}</p>
                        <p class="mt-2 text-[11px] text-slate-400 italic">This is an automated message. Please do not reply to this email.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </transition>
            </div>
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
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-slate-900">
            {{ activeReminders.length }} Active Reminder{{ activeReminders.length !== 1 ? 's' : '' }}
          </h2>
          <!-- Bulk action toolbar -->
          <transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 -translate-x-2"
            enter-to-class="opacity-100 translate-x-0"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100 translate-x-0"
            leave-to-class="opacity-0 -translate-x-2"
          >
            <div v-if="selectedCount > 0" class="flex items-center gap-2">
              <span class="text-xs font-medium text-slate-600">
                {{ selectedCount }} selected
              </span>
              <button
                @click="toggleSelectAll"
                class="text-xs text-slate-500 hover:text-slate-700 underline"
              >
                {{ isAllSelected ? 'Deselect All' : 'Select All' }}
              </button>
              <button
                @click="selectedReminderIds.clear()"
                class="text-xs text-slate-500 hover:text-slate-700 underline"
              >
                Clear
              </button>
              <div class="w-px h-4 bg-slate-200"></div>
              <button
                @click="bulkSendReminders"
                :disabled="bulkSending || selectedCount === 0"
                class="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <BellIcon class="h-3.5 w-3.5" />
                {{ bulkSending ? 'Sending...' : `Send to ${selectedCount}` }}
              </button>
            </div>
          </transition>
        </div>

        <div class="space-y-3">
          <!-- ADMIN VIEW: Group by Concentration -->
          <div v-if="isAdmin">
            <div
              v-for="group in groupedRemindersByConcentration"
              :key="group.concentration"
              class="border border-slate-200 rounded-lg overflow-hidden"
            >
              <!-- Concentration Group Header -->
              <button
                @click="expandedConcentrations.has(group.concentration) ? expandedConcentrations.delete(group.concentration) : expandedConcentrations.add(group.concentration)"
                class="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div class="flex items-center gap-3 flex-1 text-left">
                  <div :class="['transition-transform', expandedConcentrations.has(group.concentration) ? 'rotate-90' : '']">
                    <ChevronRightIcon class="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <h3 class="text-sm font-semibold text-slate-900">{{ group.concentration }}</h3>
                  </div>
                </div>
                <span class="inline-flex items-center rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                  {{ group.reminders.length }}
                </span>
              </button>

              <!-- Concentration Group Content (Reminders) -->
              <transition
                enter-active-class="transition duration-150 ease-out"
                enter-from-class="opacity-0"
                enter-to-class="opacity-100"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
              >
                <div v-show="expandedConcentrations.has(group.concentration)" class="divide-y divide-slate-100 bg-white">
                  <div
                    v-for="reminder in group.reminders"
                    :key="reminder.id"
                    class="p-4 hover:bg-slate-50 transition-colors flex items-start gap-3"
                  >
                    <!-- Checkbox -->
                    <div class="mt-1">
                      <input
                        type="checkbox"
                        :checked="selectedReminderIds.has(reminder.id)"
                        @change="toggleSelectReminder(reminder.id)"
                        class="h-4 w-4 rounded border-slate-300 text-blue-600 cursor-pointer"
                      />
                    </div>

                    <!-- Content -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-start justify-between gap-4 mb-3">
                        <div class="flex-1">
                          <h4 class="text-sm font-semibold text-slate-900">{{ reminder.studentName }}</h4>
                          <p class="text-xs text-blue-600 mt-0.5">
                            <a :href="'mailto:' + reminder.studentEmail" class="hover:underline">
                              {{ reminder.studentEmail }}
                            </a>
                          </p>
                          <p class="text-xs text-slate-600 mt-1">{{ reminder.topic }}</p>
                          <p class="text-xs font-semibold text-blue-600 uppercase tracking-wide mt-1">
                            {{ reminder.type }}
                          </p>
                          <p class="text-[11px] text-slate-400 mt-0.5">Phase: {{ reminder.phase }}</p>
                        </div>
                        <span
                          :class="['inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap', getPriorityColor(reminder.priority)]"
                        >
                          {{ reminder.priority }} Priority
                        </span>
                      </div>

                      <div class="grid grid-cols-3 gap-4 mb-3 text-xs">
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

                      <div class="flex gap-2 flex-wrap">
                        <!-- For admin, show "Send Selected" via bulk toolbar, but keep individual send option -->
                        <button
                          :disabled="actionLoading[reminder.id]"
                          @click="openSendModal(reminder)"
                          class="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 border border-blue-200 disabled:opacity-50"
                        >
                          <BellIcon class="h-4 w-4" />
                          {{ actionLoading[reminder.id] ? 'Sending...' : 'Send' }}
                        </button>
                        <a
                          v-if="reminder.studentEmail"
                          :href="'mailto:' + reminder.studentEmail"
                          class="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200"
                        >
                          <EnvelopeIcon class="h-4 w-4" />
                          Email
                        </a>
                        <button
                          @click="handleMarkComplete(reminder)"
                          class="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                        >
                          <CheckIcon class="h-4 w-4" />
                          Done
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </transition>
            </div>
          </div>

          <!-- SUPERVISOR VIEW: Group by Student -->
          <div v-else>
            <!-- Student Group Headers -->
            <div
              v-for="group in groupedRemindersByStudent"
              :key="group.studentId"
              class="border border-slate-200 rounded-lg overflow-hidden"
            >
              <!-- Student Group Header -->
              <button
                @click="expandedReminderStudents.has(group.studentId) ? expandedReminderStudents.delete(group.studentId) : expandedReminderStudents.add(group.studentId)"
                class="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div class="flex items-center gap-3 flex-1 text-left">
                  <div :class="['transition-transform', expandedReminderStudents.has(group.studentId) ? 'rotate-90' : '']">
                    <ChevronRightIcon class="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <h3 class="text-sm font-semibold text-slate-900">{{ group.studentName }}</h3>
                    <p class="text-xs text-blue-600">
                      <a :href="'mailto:' + group.studentEmail" class="hover:underline">
                        {{ group.studentEmail }}
                      </a>
                    </p>
                    <p v-if="group.studentConcentration" class="text-[11px] text-slate-400 mt-0.5">
                      {{ group.studentConcentration }}
                    </p>
                  </div>
                </div>
                <span class="inline-flex items-center rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                  {{ group.reminders.length }}
                </span>
              </button>

              <!-- Student Group Content (Reminders) -->
              <transition
                enter-active-class="transition duration-150 ease-out"
                enter-from-class="opacity-0"
                enter-to-class="opacity-100"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
              >
                <div v-show="expandedReminderStudents.has(group.studentId)" class="divide-y divide-slate-100 bg-white">
                  <div
                    v-for="reminder in group.reminders"
                    :key="reminder.id"
                    class="p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div class="flex items-start justify-between gap-4 mb-3">
                      <div class="flex-1">
                        <p class="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                          {{ reminder.type }}
                        </p>
                        <p class="text-xs text-slate-600 mt-1">{{ reminder.topic }}</p>
                        <p class="text-[11px] text-slate-400 mt-0.5">Phase: {{ reminder.phase }}</p>
                      </div>
                      <span
                        :class="['inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap', getPriorityColor(reminder.priority)]"
                      >
                        {{ reminder.priority }} Priority
                      </span>
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
              </transition>
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
              <p class="text-xs mt-1" :class="(messageTarget?.daysOverdue ?? 0) > 0 ? 'text-red-600 font-medium' : 'text-amber-600 font-medium'">
                Status: {{ (messageTarget?.daysOverdue ?? 0) > 0 ? 'Overdue by ' + messageTarget?.daysOverdue + ' day(s)' : 'Not yet submitted' }}
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
