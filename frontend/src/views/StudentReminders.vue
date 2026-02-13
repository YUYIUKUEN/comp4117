<script setup lang="ts">
const reminders = [
  {
    id: 1,
    title: 'Progress Report 1 - OVERDUE',
    dueDate: '1 Feb 2026',
    daysLeft: -12,
    priority: 'urgent',
    type: 'submission',
    description: 'Submit your first progress report to your supervisor',
  },
  {
    id: 2,
    title: 'Meeting with Supervisor',
    dueDate: '18 Feb 2026',
    daysLeft: 5,
    priority: 'high',
    type: 'meeting',
    description: 'Regular check-in meeting to discuss progress and next steps',
  },
  {
    id: 3,
    title: 'Progress Report 2',
    dueDate: '10 Apr 2026',
    daysLeft: 56,
    priority: 'medium',
    type: 'submission',
    description: 'Submit your second progress report',
  },
  {
    id: 4,
    title: 'Complete Research Phase',
    dueDate: '30 Apr 2026',
    daysLeft: 76,
    priority: 'medium',
    type: 'milestone',
    description: 'Ensure all primary research is completed',
  },
  {
    id: 5,
    title: 'Final Report & Presentation',
    dueDate: '25 May 2026',
    daysLeft: 101,
    priority: 'low',
    type: 'submission',
    description: 'Submit final dissertation and prepare presentation materials',
  },
];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'border-rose-200 bg-rose-50';
    case 'high':
      return 'border-amber-200 bg-amber-50';
    case 'medium':
      return 'border-blue-200 bg-blue-50';
    default:
      return 'border-slate-200 bg-slate-50';
  }
};

const getPriorityBadgeColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'bg-rose-600 text-white';
    case 'high':
      return 'bg-amber-500 text-white';
    case 'medium':
      return 'bg-blue-500 text-white';
    default:
      return 'bg-slate-400 text-white';
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'submission':
      return '📤';
    case 'meeting':
      return '📅';
    case 'milestone':
      return '🎯';
    default:
      return '📌';
  }
};

const getDaysLeftText = (daysLeft: number) => {
  if (daysLeft < 0) {
    return `${Math.abs(daysLeft)} days overdue`;
  } else if (daysLeft === 0) {
    return 'Due today';
  } else if (daysLeft === 1) {
    return '1 day remaining';
  } else {
    return `${daysLeft} days remaining`;
  }
};
</script>

<template>
  <div class="w-full">
    <main class="px-4 sm:px-6 pb-6 pt-4 sm:pt-5">
      <!-- Header -->
      <section class="mb-6">
        <h1 class="text-2xl font-bold text-slate-900">Reminders</h1>
        <p class="mt-1 text-sm text-slate-600">
          Your upcoming deadlines and important milestones
        </p>
      </section>

      <!-- Reminders List -->
      <section class="space-y-4">
        <div
          v-for="reminder in reminders"
          :key="reminder.id"
          class="rounded-2xl border p-4 sm:p-5 shadow-sm shadow-slate-200/70"
          :class="getPriorityColor(reminder.priority)"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex flex-1 items-start gap-3">
              <span class="text-2xl">{{ getTypeIcon(reminder.type) }}</span>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-semibold text-slate-900">
                    {{ reminder.title }}
                  </h3>
                  <span :class="getPriorityBadgeColor(reminder.priority)" class="rounded px-2 py-0.5 text-[11px] font-medium uppercase">
                    {{ reminder.priority }}
                  </span>
                </div>

                <p class="mt-1 text-xs text-slate-600">
                  {{ reminder.description }}
                </p>

                <div class="mt-2 flex flex-wrap items-center gap-3 text-xs">
                  <span class="text-slate-600">
                    <span class="font-medium">Due:</span> {{ reminder.dueDate }}
                  </span>
                  <span
                    class="font-medium"
                    :class="reminder.daysLeft < 0 ? 'text-rose-700' : 'text-slate-600'"
                  >
                    {{ getDaysLeftText(reminder.daysLeft) }}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Mark Done
            </button>
          </div>
        </div>
      </section>

      <!-- Empty State -->
      <div v-if="reminders.length === 0" class="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <p class="text-sm text-slate-600">No upcoming reminders</p>
      </div>
    </main>
  </div>
</template>
