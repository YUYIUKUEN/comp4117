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

  if (props.standard?.gradingSystem === 'point-range') {
    const pointValue = parseInt(grade.value)
    const min = props.standard.pointRange?.min || 0
    const max = props.standard.pointRange?.max || 100
    return !isNaN(pointValue) && pointValue >= min && pointValue <= max
  }

  if (props.standard?.gradingSystem === 'letter-grade') {
    return props.standard.letterGrades?.includes(grade.value) || false
  }

  if (props.standard?.gradingSystem === 'custom') {
    return props.standard.customOptions?.includes(grade.value) || false
  }

  return false
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
      <div v-if="standard?.gradingSystem === 'point-range'" class="mb-6">
        <label class="block text-sm font-medium text-slate-700 mb-3">
          Points
        </label>
        <input
          v-model.number="grade"
          type="number"
          :min="standard.pointRange?.min"
          :max="standard.pointRange?.max"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <p v-if="grade && !isValid" class="mt-1 text-xs text-red-600">
          Must be between {{ standard.pointRange?.min }} - {{ standard.pointRange?.max }}
        </p>
      </div>

      <!-- Grade Input - Letter Grade -->
      <div v-else-if="standard?.gradingSystem === 'letter-grade'" class="mb-6">
        <label class="block text-sm font-medium text-slate-700 mb-3">
          Grade
        </label>
        <div class="grid grid-cols-5 gap-2">
          <button
            v-for="letterGrade in standard.letterGrades"
            :key="letterGrade"
            @click="grade = letterGrade"
            type="button"
            :class="[
              'py-2 px-1 rounded-lg font-semibold text-sm transition',
              grade === letterGrade
                ? 'bg-blue-600 text-white border border-blue-600'
                : 'border border-slate-300 bg-white text-slate-900 hover:border-blue-500'
            ]"
          >
            {{ letterGrade }}
          </button>
        </div>
      </div>

      <!-- Grade Input - Custom Options -->
      <div v-else-if="standard?.gradingSystem === 'custom'" class="mb-6">
        <label class="block text-sm font-medium text-slate-700 mb-3">
          Select
        </label>
        <select
          v-model="grade"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Choose one</option>
          <option v-for="option in standard.customOptions" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
      </div>

      <!-- No Standard -->
      <div v-else class="mb-6 rounded-lg border border-red-200 bg-red-50 p-3">
        <p class="text-sm text-red-700">
          No grading standard defined for this submission type. Please contact admin.
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
