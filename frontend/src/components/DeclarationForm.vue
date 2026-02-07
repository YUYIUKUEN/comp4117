<script setup lang="ts">
import { ref, computed } from 'vue'
import { InformationCircleIcon, CheckIcon } from '@heroicons/vue/24/outline'

export interface Props {
  phaseId: string
  phaseName: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const emit = defineEmits<{
  submit: [declaration: { phaseId: string; reason: string; justification: string }]
  cancel: []
}>()

const reason = ref('')
const justification = ref('')
const agreedWithSupervisor = ref(false)
const isSubmitting = ref(false)

const MAX_JUSTIFICATION_LENGTH = 1000

const characterCount = computed(() => justification.value.length)

const isValid = computed(() => {
  return (
    reason.value.trim().length > 0 &&
    justification.value.trim().length > 0 &&
    agreedWithSupervisor.value &&
    !isSubmitting.value
  )
})

const reasonOptions = [
  {
    value: 'not-applicable',
    label: 'Not applicable to this project',
  },
  {
    value: 'already-submitted',
    label: 'Already submitted through alternative means',
  },
  {
    value: 'supervisor-approved',
    label: 'Approved exception by supervisor',
  },
  {
    value: 'other',
    label: 'Other (explain in justification)',
  },
]

const handleSubmit = async () => {
  if (!isValid.value) return

  isSubmitting.value = true

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    emit('submit', {
      phaseId: props.phaseId,
      reason: reason.value,
      justification: justification.value.trim(),
    })

    // Reset form
    reason.value = ''
    justification.value = ''
    agreedWithSupervisor.value = false
  } catch (error) {
    console.error('Failed to submit declaration:', error)
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  reason.value = ''
  justification.value = ''
  agreedWithSupervisor.value = false
  emit('cancel')
}
</script>

<template>
  <div class="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
    <div class="flex items-start gap-3 mb-4">
      <InformationCircleIcon class="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
      <div>
        <h3 class="text-sm font-semibold text-slate-900">
          Declare {{ phaseName }} Not Needed
        </h3>
        <p class="mt-1 text-xs text-slate-600">
          If this submission phase is not required for your project, you can declare it as not needed.
          This must be approved by your supervisor.
        </p>
      </div>
    </div>

    <div class="space-y-4">
      <!-- Reason Selection -->
      <div>
        <label class="block text-sm font-medium text-slate-900 mb-2">
          Reason <span class="text-red-500">*</span>
        </label>
        <div class="grid gap-2 sm:grid-cols-2">
          <button
            v-for="option in reasonOptions"
            :key="option.value"
            type="button"
            :disabled="disabled || isSubmitting"
            @click="reason = option.value"
            :class="`relative flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-colors ${
              reason === option.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            } ${disabled || isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`"
          >
            <div
              :class="
                `h-4 w-4 rounded-full border-2 flex-shrink-0 ${
                  reason === option.value
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-slate-300 bg-white'
                }`
              "
            >
              <CheckIcon v-if="reason === option.value" class="h-3 w-3 text-white" />
            </div>
            <span class="text-xs font-medium text-slate-900">{{ option.label }}</span>
          </button>
        </div>
      </div>

      <!-- Justification Text -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="block text-sm font-medium text-slate-900">
            Justification <span class="text-red-500">*</span>
          </label>
          <span :class="`text-xs ${characterCount > MAX_JUSTIFICATION_LENGTH ? 'text-red-600' : 'text-slate-500'}`">
            {{ characterCount }} / {{ MAX_JUSTIFICATION_LENGTH }}
          </span>
        </div>
        <textarea
          v-model="justification"
          :disabled="disabled || isSubmitting"
          :maxlength="MAX_JUSTIFICATION_LENGTH"
          rows="4"
          placeholder="Explain why this submission phase is not needed for your project..."
          :class="`w-full rounded-lg border px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors ${
            characterCount > MAX_JUSTIFICATION_LENGTH * 0.9
              ? 'border-orange-300 focus:border-orange-500 focus:ring-orange-500/60'
              : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/60'
          } ${disabled || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`"
        ></textarea>
        <p class="mt-1 text-[11px] text-slate-500">
          Provide context for your supervisor to review and approve this exception.
        </p>
      </div>

      <!-- Supervisor Agreement -->
      <div class="rounded-lg bg-blue-50 border border-blue-200 p-3">
        <label class="flex items-start gap-3 cursor-pointer">
          <input
            v-model="agreedWithSupervisor"
            type="checkbox"
            :disabled="disabled || isSubmitting"
            class="mt-0.5 h-4 w-4 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <span class="text-xs text-slate-800">
            I confirm I have discussed this with my supervisor and they have approved this exception.
          </span>
        </label>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-4 border-t border-slate-200">
        <button
          type="button"
          :disabled="disabled || isSubmitting"
          @click="handleCancel"
          class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          :disabled="!isValid"
          @click="handleSubmit"
          class="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          :class="[
            isValid
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed',
            isSubmitting ? 'opacity-75' : '',
          ]"
        >
          <span v-if="isSubmitting" class="inline-flex items-center gap-2">
            <span class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            Submitting...
          </span>
          <span v-else> Submit Declaration </span>
        </button>
      </div>
    </div>
  </div>
</template>
