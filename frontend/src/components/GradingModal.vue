<script setup lang="ts">
import { ref, computed } from 'vue'
import type { GradingStandard } from '../composables/useGradingStandards'

interface Props {
  isOpen: boolean
  standard: GradingStandard | undefined
  submissionId: number
  studentName: string
  currentGrade?: string
}

interface Emits {
  (e: 'close'): void
  (e: 'save', grade: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const grade = ref<string>(props.currentGrade || '')

const isValid = computed(() => {
  if (!grade.value) return false

  const pointValue = parseFloat(grade.value)
  const min = props.standard?.pointRange?.min || 0
  const max = props.standard?.pointRange?.max || 20
  return !isNaN(pointValue) && pointValue >= min && pointValue <= max
})

const handleSave = () => {
  if (isValid.value) {
    emit('save', grade.value)
    handleClose()
  }
}

const handleClose = () => {
  grade.value = ''
  emit('close')
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div class="rounded-2xl bg-white p-6 shadow-2xl max-w-sm w-full mx-4">
      <!-- Header -->
      <h2 class="text-lg font-bold text-slate-900 mb-2">
        Add Grade
      </h2>
      <p class="text-sm text-slate-600 mb-6">
        {{ studentName }}
      </p>

      <!-- Grade Input - Point Range -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-slate-700 mb-3">
          Points
        </label>
        <div class="flex gap-2 items-end">
          <input
            v-model="grade"
            type="number"
            :min="standard?.pointRange?.min || 0"
            :max="standard?.pointRange?.max || 20"
            :step="standard?.pointRange?.step || 1"
            :placeholder="`Enter points (${standard?.pointRange?.min || 0} - ${standard?.pointRange?.max || 20})`"
            class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <div class="px-3 py-2 bg-slate-100 rounded-lg border border-slate-300 font-medium text-slate-600 whitespace-nowrap">
            / {{ standard?.pointRange?.max || 20 }}
          </div>
        </div>
        <p v-if="grade && !isValid" class="mt-1 text-xs text-red-600">
          Must be between {{ standard?.pointRange?.min || 0 }} - {{ standard?.pointRange?.max || 20 }}
        </p>
      </div>

      <!-- Actions -->
      <div class="flex gap-2">
        <button
          @click="handleSave"
          :disabled="!isValid"
          type="button"
          class="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          Save Grade
        </button>
        <button
          @click="handleClose"
          type="button"
          class="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>
