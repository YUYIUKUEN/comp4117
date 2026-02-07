<script setup lang="ts">
import { computed } from 'vue'
import StatusBadge from './StatusBadge.vue'
import { CheckCircleIcon, ExclamationCircleIcon, ClockIcon, DocumentCheckIcon } from '@heroicons/vue/24/outline'

export interface SubmissionPhase {
  id: string
  name: string
  description: string
  dueDate: string
  status: 'not-submitted' | 'submitted' | 'overdue' | 'declared'
  submittedAt?: string
  feedback?: string
}

export interface Props {
  phases: SubmissionPhase[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  upload: [phaseId: string]
  declare: [phaseId: string]
  viewDetails: [phaseId: string]
}>()

const statusIcon = computed(() => {
  return {
    'not-submitted': ExclamationCircleIcon,
    submitted: CheckCircleIcon,
    overdue: ExclamationCircleIcon,
    declared: DocumentCheckIcon,
  }
})

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const isOverdue = (dueDate: string): boolean => {
  return new Date(dueDate) < new Date()
}
</script>

<template>
  <section
    aria-labelledby="phases-heading"
    class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70"
  >
    <h2 id="phases-heading" class="text-sm font-semibold text-slate-900">
      Submission Phases
    </h2>
    <p class="mt-1 text-xs text-slate-500">
      Track the status of each required submission phase throughout your FYP.
    </p>

    <div v-if="loading" class="mt-4 space-y-3">
      <div v-for="i in 4" :key="i" class="h-24 animate-pulse rounded-lg bg-slate-100"></div>
    </div>

    <div v-else class="mt-4 space-y-3">
      <div
        v-for="phase in phases"
        :key="phase.id"
        :class="`rounded-lg border p-4 transition-colors ${
          phase.status === 'overdue'
            ? 'border-orange-200 bg-orange-50'
            : phase.status === 'declared'
              ? 'border-yellow-200 bg-yellow-50'
              : phase.status === 'submitted'
                ? 'border-green-200 bg-green-50'
                : 'border-slate-200 bg-white'
        }`"
      >
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div class="flex-1">
            <div class="flex items-start gap-3">
              <component
                :is="statusIcon[phase.status]"
                :class="`h-5 w-5 flex-shrink-0 mt-0.5 ${
                  phase.status === 'overdue'
                    ? 'text-orange-600'
                    : phase.status === 'declared'
                      ? 'text-yellow-600'
                      : phase.status === 'submitted'
                        ? 'text-green-600'
                        : 'text-red-600'
                }`"
              />
              <div class="flex-1">
                <h3 class="text-sm font-semibold text-slate-900">{{ phase.name }}</h3>
                <p class="mt-1 text-xs text-slate-600">{{ phase.description }}</p>
                <div class="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-600">
                  <span class="flex items-center gap-1">
                    <ClockIcon class="h-3.5 w-3.5" />
                    Due: {{ formatDate(phase.dueDate) }}
                  </span>
                  <span v-if="phase.submittedAt" class="flex items-center gap-1 text-green-700">
                    Submitted: {{ formatDate(phase.submittedAt) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <StatusBadge :status="phase.status" size="sm" />
          </div>
        </div>

        <div v-if="phase.feedback" class="mt-3 border-t border-slate-200 pt-3">
          <p class="text-[11px] font-medium text-slate-700">Supervisor Feedback:</p>
          <p class="mt-1 text-[11px] text-slate-600">{{ phase.feedback }}</p>
        </div>

        <div class="mt-3 flex flex-wrap gap-2">
          <button
            v-if="phase.status === 'not-submitted' || phase.status === 'overdue'"
            type="button"
            :disabled="loading"
            @click="emit('upload', phase.id)"
            class="inline-flex items-center gap-1 rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:border-blue-400 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            📤 Upload Document
          </button>

          <button
            v-if="phase.status === 'not-submitted' || phase.status === 'overdue'"
            type="button"
            :disabled="loading"
            @click="emit('declare', phase.id)"
            class="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            📋 Declare Not Needed
          </button>

          <button
            v-if="phase.status === 'submitted'"
            type="button"
            :disabled="loading"
            @click="emit('viewDetails', phase.id)"
            class="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            👁️ View Details
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
