<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSubmissionStore } from '../stores/submissionStore'

const router = useRouter()
const submissionStore = useSubmissionStore()
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    await submissionStore.fetchSubmissionPhases()
  } catch (e: any) {
    error.value = e?.message || 'Failed to load reminders'
  } finally {
    loading.value = false
  }
})

interface Reminder {
  id: string
  title: string
  dueDate: string
  daysLeft: number
  priority: 'urgent' | 'high' | 'medium' | 'low'
  type: 'submission'
  description: string
  status: string
  phase: string
}

const reminders = computed<Reminder[]>(() => {
  if (!submissionStore.phases || submissionStore.phases.length === 0) return []

  const now = new Date()
  return submissionStore.phases
    .filter(p => p.status === 'Not Submitted' || p.status === 'Overdue')
    .map(p => {
      const due = new Date(p.dueDate)
      const diffMs = due.getTime() - now.getTime()
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

      let priority: Reminder['priority'] = 'low'
      if (daysLeft < 0) priority = 'urgent'
      else if (daysLeft <= 7) priority = 'high'
      else if (daysLeft <= 30) priority = 'medium'

      const phaseDescriptions: Record<string, string> = {
        'Initial Statement': 'Submit your initial project statement to your supervisor',
        'Progress Report 1': 'Submit your first progress report with current findings',
        'Progress Report 2': 'Submit your second progress report with updated progress',
        'Final Dissertation': 'Submit your final dissertation and all supporting documents',
      }

      return {
        id: p._id,
        title: daysLeft < 0 ? `${p.phase} - OVERDUE` : p.phase,
        dueDate: due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        daysLeft,
        priority,
        type: 'submission' as const,
        description: phaseDescriptions[p.phase] || `Submit your ${p.phase} document`,
        status: p.status,
        phase: p.phase,
      }
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)
})

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'border-rose-200 bg-rose-50'
    case 'high': return 'border-amber-200 bg-amber-50'
    case 'medium': return 'border-blue-200 bg-blue-50'
    default: return 'border-slate-200 bg-slate-50'
  }
}

const getPriorityBadgeColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'bg-rose-600 text-white'
    case 'high': return 'bg-amber-500 text-white'
    case 'medium': return 'bg-blue-500 text-white'
    default: return 'bg-slate-400 text-white'
  }
}

const getDaysLeftText = (daysLeft: number) => {
  if (daysLeft < 0) return `${Math.abs(daysLeft)} days overdue`
  if (daysLeft === 0) return 'Due today'
  if (daysLeft === 1) return '1 day remaining'
  return `${daysLeft} days remaining`
}

function goToSubmission(_phase: string) {
  router.push({ name: 'Submissions' })
}
</script>

<template>
  <div>
    <main class="px-4 sm:px-6 pb-6 pt-4 sm:pt-5">
      <!-- Header -->
      <section class="mb-6">
        <h1 class="text-2xl font-bold text-slate-900">Reminders</h1>
        <p class="mt-1 text-sm text-slate-600">
          Your upcoming deadlines and important milestones
        </p>
      </section>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-12">
        <span class="loading loading-spinner loading-md text-primary"></span>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p class="text-sm text-rose-700">{{ error }}</p>
      </div>

      <template v-else>
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
                <span class="text-2xl">📤</span>
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
                @click="goToSubmission(reminder.phase)"
              >
                Go to Submission
              </button>
            </div>
          </div>
        </section>

        <!-- Empty State -->
        <div v-if="reminders.length === 0" class="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <p class="text-sm text-slate-600">No upcoming reminders — all submissions are up to date!</p>
        </div>
      </template>
    </main>
  </div>
</template>
