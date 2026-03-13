<script setup lang="ts">
import { ref, onMounted } from 'vue'
import gradingStandardService from '../services/gradingStandardService'
import type { GradingStandard, GradingStandardInput } from '../services/gradingStandardService'

const gradingStandards = ref<GradingStandard[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')

const showAddForm = ref(false)
const editingId = ref<string | null>(null)

const formData = ref<GradingStandardInput>({
  submissionType: '',
  gradingSystem: 'point-range',
  pointRange: { min: 0, max: 100 },
  letterGrades: ['A', 'B', 'C', 'D', 'F'],
  customOptions: [],
  description: '',
  dueDate: null,
  enabled: true,
})

const fetchStandards = async () => {
  try {
    loading.value = true
    error.value = ''
    gradingStandards.value = await gradingStandardService.getAll()
  } catch (e: any) {
    error.value = e?.response?.data?.error || 'Failed to load grading standards'
  } finally {
    loading.value = false
  }
}

onMounted(fetchStandards)

const resetForm = () => {
  formData.value = {
    submissionType: '',
    gradingSystem: 'point-range',
    pointRange: { min: 0, max: 100, step: 0.5 },
    letterGrades: ['A', 'B', 'C', 'D', 'F'],
    customOptions: [],
    description: '',
    dueDate: null,
    enabled: true,
    templateName: null,
    rubricItems: [],
    hkbuGradingScale: null,
    gradeRangeMapping: [],
  }
  editingId.value = null
  showAddForm.value = false
}

const handleAddStandard = async () => {
  if (!formData.value.submissionType) {
    alert('Please select a submission type')
    return
  }
  try {
    saving.value = true
    error.value = ''
    
    // Convert dueDate to ISO format if it exists
    const dataToSave = {
      ...formData.value,
      dueDate: formData.value.dueDate ? new Date(formData.value.dueDate).toISOString() : null,
    }
    
    if (editingId.value) {
      await gradingStandardService.update(editingId.value, dataToSave)
    } else {
      await gradingStandardService.create(dataToSave)
    }
    resetForm()
    await fetchStandards()
  } catch (e: any) {
    error.value = e?.response?.data?.error || 'Failed to save grading standard'
  } finally {
    saving.value = false
  }
}

const startEdit = (standard: GradingStandard) => {
  editingId.value = standard._id
  // Convert ISO date to YYYY-MM-DD format for the date input
  let formattedDueDate = null
  if (standard.dueDate) {
    const date = new Date(standard.dueDate)
    formattedDueDate = date.toISOString().split('T')[0]
  }
  
  formData.value = {
    submissionType: standard.submissionType,
    gradingSystem: standard.gradingSystem,
    pointRange: standard.pointRange || { min: 0, max: 100, step: 0.5 },
    letterGrades: standard.letterGrades || ['A', 'B', 'C', 'D', 'F'],
    customOptions: standard.customOptions || [],
    description: standard.description || '',
    dueDate: formattedDueDate,
    enabled: standard.enabled,
    templateName: standard.templateName || null,
    rubricItems: standard.rubricItems || [],
    hkbuGradingScale: standard.hkbuGradingScale || null,
    gradeRangeMapping: standard.gradeRangeMapping || [],
  }
  showAddForm.value = true
}

const handleDeleteStandard = async (id: string) => {
  if (confirm('Are you sure you want to delete this grading standard?')) {
    try {
      error.value = ''
      await gradingStandardService.delete(id)
      await fetchStandards()
    } catch (e: any) {
      error.value = e?.response?.data?.error || 'Failed to delete grading standard'
    }
  }
}

const toggleEnabled = async (standard: GradingStandard) => {
  try {
    error.value = ''
    await gradingStandardService.update(standard._id, { enabled: !standard.enabled })
    await fetchStandards()
  } catch (e: any) {
    error.value = e?.response?.data?.error || 'Failed to toggle grading standard'
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

// Rubric management functions
const addRubricCriterion = () => {
  if (!formData.value.rubricItems) {
    formData.value.rubricItems = []
  }
  formData.value.rubricItems.push({
    title: '',
    description: '',
    minScore: 0,
    maxScore: 10,
    levels: [
      { name: 'Poor', description: 'Needs improvement' },
      { name: 'Fair', description: 'Meets minimum requirements' },
      { name: 'Good', description: 'Meets expectations' },
      { name: 'Excellent', description: 'Exceeds expectations' },
    ],
  })
}

const removeRubricCriterion = (index: number) => {
  if (formData.value.rubricItems) {
    formData.value.rubricItems.splice(index, 1)
  }
}

const addPerformanceLevel = (criterionIndex: number) => {
  if (formData.value.rubricItems && formData.value.rubricItems[criterionIndex]) {
    if (!formData.value.rubricItems[criterionIndex].levels) {
      formData.value.rubricItems[criterionIndex].levels = []
    }
    formData.value.rubricItems[criterionIndex].levels.push({
      name: '',
      description: '',
    })
  }
}

const removePerformanceLevel = (criterionIndex: number, levelIndex: number) => {
  if (formData.value.rubricItems && formData.value.rubricItems[criterionIndex]?.levels) {
    formData.value.rubricItems[criterionIndex].levels!.splice(levelIndex, 1)
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

      <!-- Error Banner -->
      <div v-if="error" class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {{ error }}
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <span class="loading loading-spinner loading-md text-blue-600"></span>
        <span class="ml-2 text-sm text-slate-600">Loading grading standards...</span>
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
            <input
              v-model="formData.submissionType"
              type="text"
              placeholder="e.g. Initial Statement, Progress Report 1, Final Dissertation"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <p class="mt-1 text-xs text-slate-500">
              Type the name of the submission phase. This will appear in the student submission checklist.
            </p>
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
              Point Range (supports 0.5 increments)
            </label>
            <div class="flex gap-3">
              <div class="flex-1">
                <input
                  v-model.number="formData.pointRange!.min"
                  type="number"
                  step="0.5"
                  placeholder="Min points"
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div class="flex items-center text-slate-600">to</div>
              <div class="flex-1">
                <input
                  v-model.number="formData.pointRange!.max"
                  type="number"
                  step="0.5"
                  placeholder="Max points"
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <!-- Letter Grade Option -->
          <div v-if="formData.gradingSystem === 'letter-grade'" class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">
                HKBU Grading Scale
              </label>
              <select 
                v-model="formData.hkbuGradingScale"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Select Template --</option>
                <option value="hkbu-standard">HKBU Standard (A, B+, B, C+, C, D)</option>
                <option value="hkbu-honors">HKBU Honors (A+, A, B+, B, C)</option>
                <option value="custom">Custom Grades</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">
                Letter Grades
              </label>
              <div class="flex flex-wrap gap-2">
                <label v-for="grade in ['A', 'A+', 'B+', 'B', 'C+', 'C', 'D', 'F']" :key="grade" class="flex items-center gap-2">
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

          <!-- Due Date -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Due Date
            </label>
            <input
              v-model="formData.dueDate"
              type="date"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <p class="mt-1 text-xs text-slate-500">
              Set a deadline for this submission type. Leave blank if no specific deadline applies.
            </p>
          </div>

          <!-- Rubric Section -->
          <div class="border-t border-slate-200 pt-4">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-sm font-semibold text-slate-900">Rubric (Optional)</h3>
                <p class="text-xs text-slate-600 mt-1">Define grading criteria with performance levels for structured evaluation</p>
              </div>
              <button
                @click="addRubricCriterion"
                type="button"
                class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                + Add Criterion
              </button>
            </div>

            <!-- Rubric Criteria -->
            <div v-if="formData.rubricItems && formData.rubricItems.length > 0" class="space-y-4">
              <div
                v-for="(criterion, criterionIndex) in formData.rubricItems"
                :key="criterionIndex"
                class="rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <!-- Criterion Header -->
                <div class="space-y-3 mb-4">
                  <div>
                    <label class="block text-xs font-medium text-slate-700 mb-1">
                      Criterion {{ criterionIndex + 1 }} Title *
                    </label>
                    <input
                      v-model="criterion.title"
                      type="text"
                      placeholder="e.g. Clarity, Originality, Technical Quality"
                      class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-700 mb-1">
                      Description
                    </label>
                    <textarea
                      v-model="criterion.description"
                      placeholder="Brief description of what this criterion evaluates"
                      rows="2"
                      class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <!-- Performance Levels Header -->
                <div class="mb-3 flex items-center justify-between">
                  <h4 class="text-xs font-semibold text-slate-700">Performance Levels</h4>
                  <button
                    @click="addPerformanceLevel(criterionIndex)"
                    type="button"
                    class="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    + Add Level
                  </button>
                </div>

                <!-- Performance Levels Table -->
                <div class="rounded-lg border border-slate-300 overflow-hidden">
                  <table class="w-full text-xs">
                    <thead class="bg-slate-200">
                      <tr>
                        <th class="px-3 py-2 text-left font-medium text-slate-700">Level Name</th>
                        <th class="px-3 py-2 text-left font-medium text-slate-700">Description</th>
                        <th class="px-3 py-2 text-center font-medium text-slate-700 w-16">Points</th>
                        <th class="px-3 py-2 text-center font-medium text-slate-700 w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(level, levelIndex) in criterion.levels || []"
                        :key="levelIndex"
                        class="border-t border-slate-200 hover:bg-slate-100"
                      >
                        <td class="px-3 py-2">
                          <input
                            v-model="level.name"
                            type="text"
                            placeholder="e.g. Excellent"
                            class="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td class="px-3 py-2">
                          <input
                            v-model="level.description"
                            type="text"
                            placeholder="Description"
                            class="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td class="px-3 py-2 text-center">
                          <input
                            :value="criterion.levels && criterion.levels.length > 0 ? levelIndex * Math.max(1, Math.floor(((criterion.maxScore || 10) - (criterion.minScore || 0)) / Math.max(1, criterion.levels.length - 1))) : 0"
                            type="number"
                            disabled
                            class="w-full rounded border border-slate-300 px-2 py-1 text-xs text-center bg-slate-100 text-slate-600"
                          />
                        </td>
                        <td class="px-3 py-2 text-center">
                          <button
                            v-if="criterion.levels && criterion.levels.length > 1"
                            @click="removePerformanceLevel(criterionIndex, levelIndex)"
                            type="button"
                            class="text-red-600 hover:text-red-700 font-medium"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Criterion Actions -->
                <div class="mt-4 flex justify-end">
                  <button
                    @click="removeRubricCriterion(criterionIndex)"
                    type="button"
                    class="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                  >
                    Remove Criterion
                  </button>
                </div>
              </div>
            </div>

            <!-- Empty Rubric State -->
            <div v-else class="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
              <p class="text-xs text-slate-600">No criteria defined yet. Click "Add Criterion" to start building your rubric.</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-2 pt-4">
            <button
              @click="handleAddStandard"
              type="button"
              :disabled="saving"
              class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {{ saving ? 'Saving...' : editingId ? 'Update' : 'Create' }} Standard
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
      <div v-if="!loading" class="space-y-3">
        <div
          v-for="standard in gradingStandards"
          :key="standard._id"
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
                  v-if="standard.dueDate"
                  class="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-[11px] font-medium text-orange-700"
                >
                  Due: {{ new Date(standard.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }}
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
                <p v-if="standard.dueDate" class="font-medium mt-1">
                  Due: {{ new Date(standard.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }}
                </p>
              </div>

              <!-- Rubric Preview -->
              <div v-if="standard.rubricItems && standard.rubricItems.length > 0" class="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                <p class="text-xs font-semibold text-blue-900 mb-2">📋 Rubric ({{ standard.rubricItems.length }} criteria)</p>
                <div class="space-y-2">
                  <div v-for="(criterion, idx) in standard.rubricItems.slice(0, 2)" :key="idx" class="text-xs text-blue-800">
                    <p class="font-medium">{{ criterion.title }}</p>
                    <p v-if="criterion.levels && criterion.levels.length > 0" class="text-blue-700 ml-2">
                      Levels: {{ criterion.levels.map(l => l.name).join(', ') }}
                    </p>
                  </div>
                  <p v-if="standard.rubricItems.length > 2" class="text-xs text-blue-700 italic">
                    + {{ standard.rubricItems.length - 2 }} more criteria
                  </p>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
              <button
                @click="toggleEnabled(standard)"
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
                @click="handleDeleteStandard(standard._id)"
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
      <div v-if="!loading && gradingStandards.length === 0" class="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <p class="text-sm text-slate-600">No grading standards defined yet</p>
      </div>
    </main>
  </div>
</template>
