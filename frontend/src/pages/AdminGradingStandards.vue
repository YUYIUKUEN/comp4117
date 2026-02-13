<script setup lang="ts">
import { ref } from 'vue'
import { useGradingStandards } from '../composables/useGradingStandards'
import type { GradingStandard } from '../composables/useGradingStandards'

const { gradingStandards, addGradingStandard, updateGradingStandard, deleteGradingStandard, toggleGradingStandard } = useGradingStandards()

const showAddForm = ref(false)
const editingId = ref<string | null>(null)

const formData = ref<Omit<GradingStandard, 'id'>>({
  submissionType: '',
  gradingSystem: 'point-range',
  pointRange: { min: 0, max: 100 },
  letterGrades: ['A', 'B', 'C', 'D', 'F'],
  customOptions: [],
  description: '',
  enabled: true,
})

const submissionTypes = [
  'Progress Report',
  'Final Report',
  'Final Presentation',
  'Proposal Review',
  'Ethics Clearance',
  'Topic Planning',
  'Other',
]

const resetForm = () => {
  formData.value = {
    submissionType: '',
    gradingSystem: 'point-range',
    pointRange: { min: 0, max: 100 },
    letterGrades: ['A', 'B', 'C', 'D', 'F'],
    customOptions: [],
    description: '',
    enabled: true,
  }
  editingId.value = null
  showAddForm.value = false
}

const handleAddStandard = () => {
  if (!formData.value.submissionType) {
    alert('Please select a submission type')
    return
  }
  if (editingId.value) {
    updateGradingStandard(editingId.value, formData.value)
  } else {
    addGradingStandard(formData.value)
  }
  resetForm()
}

const startEdit = (standard: GradingStandard) => {
  editingId.value = standard.id
  formData.value = {
    submissionType: standard.submissionType,
    gradingSystem: standard.gradingSystem,
    pointRange: standard.pointRange,
    letterGrades: standard.letterGrades,
    customOptions: standard.customOptions,
    description: standard.description,
    enabled: standard.enabled,
  }
  showAddForm.value = true
}

const handleDeleteStandard = (id: string) => {
  if (confirm('Are you sure you want to delete this grading standard?')) {
    deleteGradingStandard(id)
  }
}

const addCustomOption = () => {
  if (!formData.value.customOptions) {
    formData.value.customOptions = []
  }
  formData.value.customOptions.push('')
}

const removeCustomOption = (index: number) => {
  if (formData.value.customOptions) {
    formData.value.customOptions.splice(index, 1)
  }
}

const updateCustomOption = (index: number, value: string) => {
  if (formData.value.customOptions) {
    formData.value.customOptions[index] = value
  }
}
</script>

<template>
  <div>
    <main class="px-4 sm:px-6 pb-6 pt-4 sm:pt-5">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Grading Standards</h1>
          <p class="mt-1 text-sm text-slate-600">
            Configure grading systems for different submission types
          </p>
        </div>
        <button
          v-if="!showAddForm"
          @click="showAddForm = true"
          type="button"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          + Add Standard
        </button>
      </div>

      <!-- Add/Edit Form -->
      <div v-if="showAddForm" class="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 class="mb-4 text-lg font-semibold text-slate-900">
          {{ editingId ? 'Edit' : 'Create' }} Grading Standard
        </h2>

        <div class="space-y-4">
          <!-- Submission Type -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Submission Type *
            </label>
            <select
              v-model="formData.submissionType"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select submission type</option>
              <option v-for="type in submissionTypes" :key="type" :value="type">
                {{ type }}
              </option>
            </select>
          </div>

          <!-- Grading System -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              Grading System *
            </label>
            <div class="flex gap-4">
              <label class="flex items-center gap-2">
                <input
                  type="radio"
                  v-model="formData.gradingSystem"
                  value="point-range"
                  class="h-4 w-4"
                />
                <span class="text-sm text-slate-700">Point Range</span>
              </label>
              <label class="flex items-center gap-2">
                <input
                  type="radio"
                  v-model="formData.gradingSystem"
                  value="letter-grade"
                  class="h-4 w-4"
                />
                <span class="text-sm text-slate-700">Letter Grade</span>
              </label>
              <label class="flex items-center gap-2">
                <input
                  type="radio"
                  v-model="formData.gradingSystem"
                  value="custom"
                  class="h-4 w-4"
                />
                <span class="text-sm text-slate-700">Custom</span>
              </label>
            </div>
          </div>

          <!-- Point Range Option -->
          <div v-if="formData.gradingSystem === 'point-range'" class="space-y-2">
            <label class="block text-sm font-medium text-slate-700">
              Point Range
            </label>
            <div class="flex gap-3">
              <div class="flex-1">
                <input
                  v-model.number="formData.pointRange!.min"
                  type="number"
                  placeholder="Min points"
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div class="flex items-center text-slate-600">to</div>
              <div class="flex-1">
                <input
                  v-model.number="formData.pointRange!.max"
                  type="number"
                  placeholder="Max points"
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <!-- Letter Grade Option -->
          <div v-if="formData.gradingSystem === 'letter-grade'" class="space-y-2">
            <label class="block text-sm font-medium text-slate-700 mb-2">
              Letter Grades
            </label>
            <div class="flex flex-wrap gap-2">
              <label v-for="grade in ['A', 'B', 'C', 'D', 'F']" :key="grade" class="flex items-center gap-2">
                <input
                  type="checkbox"
                  :checked="formData.letterGrades?.includes(grade)"
                  @change="(e) => {
                    if (!formData.letterGrades) formData.letterGrades = [];
                    if ((e.target as HTMLInputElement).checked) {
                      if (!formData.letterGrades.includes(grade)) {
                        formData.letterGrades.push(grade);
                      }
                    } else {
                      formData.letterGrades = formData.letterGrades.filter(g => g !== grade);
                    }
                  }"
                  class="h-4 w-4"
                />
                <span class="text-sm text-slate-700">{{ grade }}</span>
              </label>
            </div>
          </div>

          <!-- Custom Options -->
          <div v-if="formData.gradingSystem === 'custom'" class="space-y-2">
            <label class="block text-sm font-medium text-slate-700">
              Custom Options
            </label>
            <div class="space-y-2">
              <div v-for="(option, index) in formData.customOptions" :key="index" class="flex gap-2">
                <input
                  v-model="formData.customOptions![index]"
                  type="text"
                  placeholder="Option name"
                  class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button
                  @click="removeCustomOption(index)"
                  type="button"
                  class="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
                >
                  Remove
                </button>
              </div>
            </div>
            <button
              @click="addCustomOption"
              type="button"
              class="mt-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              + Add Option
            </button>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              v-model="formData.description"
              placeholder="Explain this grading standard..."
              rows="3"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <!-- Actions -->
          <div class="flex gap-2 pt-4">
            <button
              @click="handleAddStandard"
              type="button"
              class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
            >
              {{ editingId ? 'Update' : 'Create' }} Standard
            </button>
            <button
              @click="resetForm"
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <!-- Standards List -->
      <div class="space-y-3">
        <div
          v-for="standard in gradingStandards"
          :key="standard.id"
          class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-3">
                <h3 class="text-sm font-semibold text-slate-900">
                  {{ standard.submissionType }}
                </h3>
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                  :class="
                    standard.gradingSystem === 'point-range'
                      ? 'border border-blue-200 bg-blue-50 text-blue-700'
                      : standard.gradingSystem === 'letter-grade'
                        ? 'border border-purple-200 bg-purple-50 text-purple-700'
                        : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                  "
                >
                  {{
                    standard.gradingSystem === 'point-range'
                      ? 'Points'
                      : standard.gradingSystem === 'letter-grade'
                        ? 'Grades'
                        : 'Custom'
                  }}
                </span>
                <span
                  v-if="!standard.enabled"
                  class="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600"
                >
                  Disabled
                </span>
              </div>

              <p class="mt-1 text-xs text-slate-600">
                {{ standard.description }}
              </p>

              <!-- Grading Details -->
              <div class="mt-2 text-xs text-slate-600">
                <p v-if="standard.gradingSystem === 'point-range'" class="font-medium">
                  Range: {{ standard.pointRange?.min }} - {{ standard.pointRange?.max }} points
                </p>
                <p v-else-if="standard.gradingSystem === 'letter-grade'" class="font-medium">
                  Grades: {{ standard.letterGrades?.join(', ') }}
                </p>
                <p v-else-if="standard.gradingSystem === 'custom'" class="font-medium">
                  Options: {{ standard.customOptions?.join(', ') }}
                </p>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
              <button
                @click="toggleGradingStandard(standard.id)"
                type="button"
                :class="
                  standard.enabled
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200'
                "
                class="rounded-lg border px-3 py-1.5 text-xs font-medium transition"
              >
                {{ standard.enabled ? 'Enabled' : 'Disabled' }}
              </button>
              <button
                @click="startEdit(standard)"
                type="button"
                class="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
              >
                Edit
              </button>
              <button
                @click="handleDeleteStandard(standard.id)"
                type="button"
                class="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="gradingStandards.length === 0" class="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <p class="text-sm text-slate-600">No grading standards defined yet</p>
      </div>
    </main>
  </div>
</template>
