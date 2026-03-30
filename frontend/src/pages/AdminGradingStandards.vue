<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import gradingStandardService from '../services/gradingStandardService'
import rubricTemplateService from '../services/rubricTemplateService'
import type { GradingStandard, GradingStandardInput } from '../services/gradingStandardService'
import type { RubricTemplate } from '../services/rubricTemplateService'

const gradingStandards = ref<GradingStandard[]>([])
const rubricTemplates = ref<RubricTemplate[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')

const showAddForm = ref(false)
const editingId = ref<string | null>(null)
const formContainerRef = ref<HTMLElement | null>(null)

const formData = ref<GradingStandardInput>({
  submissionType: '',
  gradingSystem: 'point-range',
  pointRange: { min: 0, max: 20, step: 1 },
  description: '',
  dueDate: null,
  enabled: true,
})

const fetchStandards = async () => {
  try {
    loading.value = true
    error.value = ''
    gradingStandards.value = await gradingStandardService.getAll()
    rubricTemplates.value = await rubricTemplateService.getAll()
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
    pointRange: { min: 0, max: 20, step: 1 },
    description: '',
    dueDate: null,
    enabled: true,
    templateName: null,
    rubricItems: [],
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
    
    console.log('🔵 Admin saving grading standard with pointRange:', dataToSave.pointRange);
    console.log('🔵 Full data being sent:', dataToSave);
    
    if (editingId.value) {
      const result = await gradingStandardService.update(editingId.value, dataToSave)
      console.log('🟢 Update response - pointRange received back:', result.pointRange);
    } else {
      const result = await gradingStandardService.create(dataToSave)
      console.log('🟢 Create response - pointRange received back:', result.pointRange);
    }
    resetForm()
    await fetchStandards()
    console.log('🔵 After fetch - grading standards:', gradingStandards.value);
  } catch (e: any) {
    console.error('🔴 Error saving grading standard:', e);
    error.value = e?.response?.data?.error || 'Failed to save grading standard'
  } finally {
    saving.value = false
  }
}

// Helper function to process rubric items
const ensureRubricItemsHavePoints = (items: any[]) => {
  if (!items) return []
  return items.map((item: any) => ({
    ...item,
    levels: (item.levels || []).map((level: any) => ({
      name: level.name,
      description: level.description,
    })),
  }))
}

const getGradingTypeLabel = (standard: GradingStandard): string => {
  switch (standard.gradingSystem) {
    case 'point-range':
      return 'Point range'
    case 'letter-grade':
      return 'Letter grades'
    case 'custom':
      return 'Custom'
    default:
      return standard.gradingSystem || 'Unknown'
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
    gradingSystem: 'point-range',
    pointRange: standard.pointRange || { min: 0, max: 20, step: 1 },
    description: standard.description || '',
    dueDate: formattedDueDate,
    enabled: standard.enabled,
    templateName: standard.templateName || null,
    rubricItems: ensureRubricItemsHavePoints(standard.rubricItems || []),
  }
  showAddForm.value = true
  
  // Scroll to form after DOM update
  nextTick(() => {
    formContainerRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
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



// Rubric management functions
const addRubricCriterion = () => {
  if (!formData.value.rubricItems) {
    formData.value.rubricItems = []
  }
  
  // Add new criterion with same number of levels as existing criteria
  const numLevels = formData.value.rubricItems?.[0]?.levels?.length || 5
  const levels = []
  for (let i = 0; i < numLevels; i++) {
    levels.push({ name: '', description: '' })
  }
  
  formData.value.rubricItems.push({
    title: '',
    description: '',
    minScore: 0,
    maxScore: 10,
    levels,
  })
}

const removeRubricCriterion = (index: number) => {
  if (formData.value.rubricItems) {
    formData.value.rubricItems.splice(index, 1)
  }
}

const addPerformanceLevelColumn = () => {
  if (!formData.value.rubricItems) return
  
  // Add new level to all criteria
  formData.value.rubricItems.forEach((criterion) => {
    if (!criterion.levels) criterion.levels = []
    criterion.levels.push({ name: '', description: '' })
  })
}

const removePerformanceLevelColumn = (levelIndex: number) => {
  if (!formData.value.rubricItems) return
  
  // Prevent removing if only 1 level remains
  if ((formData.value.rubricItems[0]?.levels?.length ?? 0) <= 1) return
  
  // Remove level from all criteria
  formData.value.rubricItems.forEach((criterion) => {
    if (criterion.levels && criterion.levels.length > levelIndex) {
      criterion.levels.splice(levelIndex, 1)
    }
  })
}

const updateCellValue = (criterionIndex: number, levelIndex: number, field: string, value: string) => {
  if (formData.value.rubricItems?.[criterionIndex]?.levels?.[levelIndex]) {
    const level = formData.value.rubricItems[criterionIndex].levels[levelIndex]
    if (field === 'name') level.name = value
    else if (field === 'description') level.description = value
  }
}

const updateCriterionTitle = (criterionIndex: number, value: string) => {
  if (formData.value.rubricItems?.[criterionIndex]) {
    formData.value.rubricItems[criterionIndex].title = value
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

const loadTemplate = async (templateId: string) => {
  if (!templateId) {
    // Clear rubric items if no template selected
    formData.value.rubricItems = []
    return
  }

  try {
    const template = await rubricTemplateService.getById(templateId)
    if (template) {
      // Populate rubric items from template
      const items = JSON.parse(JSON.stringify(template.rubricItems || []))
      // Ensure all levels have points
      formData.value.rubricItems = ensureRubricItemsHavePoints(items)
    }
  } catch (e) {
    console.error('Failed to load template:', e)
    error.value = 'Failed to load template'
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
      <div v-if="showAddForm" ref="formContainerRef" class="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
              Grading System
            </label>
            <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p class="text-sm font-medium text-slate-900">Point Range (0-{{ formData.pointRange?.max || 20 }} points)</p>
              <p class="text-xs text-slate-600 mt-1">Supervisors will enter points directly within the set range.</p>
            </div>
          </div>

          <!-- Point Range Option -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-slate-700">
              Set Maximum Points for Supervisors
            </label>
            <div class="flex gap-3">
              <div class="flex-1">
                <label class="block text-xs text-slate-600 mb-1">Minimum</label>
                <input
                  v-model.number="formData.pointRange!.min"
                  type="number"
                  step="1"
                  placeholder="Min points"
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div class="flex items-end text-slate-600 pb-2">to</div>
              <div class="flex-1">
                <label class="block text-xs text-slate-600 mb-1">Maximum</label>
                <input
                  v-model.number="formData.pointRange!.max"
                  type="number"
                  step="1"
                  placeholder="Max points"
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <p class="mt-1 text-xs text-slate-500">
              Supervisors will enter points between {{ formData.pointRange?.min || 0 }} and {{ formData.pointRange?.max || 20 }} when grading.
            </p>
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
            <div class="mb-4">
              <h3 class="text-sm font-semibold text-slate-900">Rubric (Optional)</h3>
              <p class="text-xs text-slate-600 mt-1">Define grading criteria with performance levels for structured evaluation</p>
            </div>

            <!-- Template Selector -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-slate-700 mb-2">
                Use a template (optional)
              </label>
              <select
                @change="(e) => loadTemplate((e.target as HTMLSelectElement).value)"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Choose a template or create custom --</option>
                <option v-for="template in rubricTemplates" :key="template._id" :value="template._id">
                  {{ template.name }}{{ template.isDefault ? ' (Default)' : '' }}
                </option>
              </select>
              <p class="text-xs text-slate-500 mt-1">
                Selected templates will populate the criteria below. You can still add, edit, or remove criteria.
              </p>
            </div>

            <div class="flex items-center justify-between mb-4">
              <span></span>
              <button
                @click="addRubricCriterion"
                type="button"
                class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                + Add Criterion
              </button>
            </div>

            <!-- Rubric Criteria Table Editor -->
            <div v-if="formData.rubricItems && formData.rubricItems.length > 0" class="space-y-3">
              <!-- Rubric Controls -->
              <div class="flex gap-2 items-center mb-4">
                <button
                  @click="addPerformanceLevelColumn"
                  type="button"
                  class="rounded-lg bg-blue-50 border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                >
                  + Add Performance Level
                </button>
                <span class="text-xs text-slate-600">
                  {{ formData.rubricItems[0]?.levels?.length || 0 }} levels
                </span>
              </div>

              <!-- Rubric Table -->
              <div class="rounded-lg border border-slate-300 overflow-x-auto">
                <table class="w-full text-xs border-collapse">
                  <!-- Header Row: Performance Levels -->
                  <thead>
                    <tr class="bg-slate-100 border-b border-slate-300">
                      <th class="px-4 py-3 text-left font-semibold text-slate-700 bg-slate-50 w-48 border-r border-slate-300">
                        Criteria
                      </th>
                      <th
                        v-for="(level, levelIndex) in formData.rubricItems[0]?.levels || []"
                        :key="`header-${levelIndex}`"
                        class="px-3 py-2 text-center font-medium text-slate-700 bg-slate-100 border-r border-slate-300 min-w-max group relative"
                      >
                        <div class="flex flex-col items-center gap-1">
                          <input
                            :value="level.name"
                            @input="updateCellValue(0, levelIndex, 'name', ($event.target as HTMLInputElement).value)"
                            type="text"
                            placeholder="Level"
                            class="w-full rounded border border-slate-300 px-2 py-1 text-center text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            v-if="(formData.rubricItems[0]?.levels?.length || 0) > 1"
                            @click="removePerformanceLevelColumn(levelIndex)"
                            type="button"
                            class="text-red-600 hover:text-red-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ✕
                          </button>
                        </div>
                      </th>
                    </tr>
                  </thead>

                  <!-- Data Rows: Criteria -->
                  <tbody>
                    <tr
                      v-for="(criterion, criterionIndex) in formData.rubricItems"
                      :key="`row-${criterionIndex}`"
                      class="border-b border-slate-300 hover:bg-slate-50"
                    >
                      <!-- Criterion Name Cell -->
                      <td class="px-4 py-3 bg-slate-50 border-r border-slate-300 font-medium text-slate-700">
                        <div class="flex items-center gap-2">
                          <input
                            :value="criterion.title"
                            @input="updateCriterionTitle(criterionIndex, ($event.target as HTMLInputElement).value)"
                            type="text"
                            placeholder="Criterion Title"
                            class="flex-1 rounded border border-slate-300 px-2 py-1 text-xs font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            v-if="formData.rubricItems.length > 1"
                            @click="removeRubricCriterion(criterionIndex)"
                            type="button"
                            class="text-red-600 hover:text-red-700 font-bold h-6 w-6 flex items-center justify-center hover:bg-red-50 rounded"
                            title="Remove criterion row"
                          >
                            ✕
                          </button>
                        </div>
                      </td>

                      <!-- Level Description Cells -->
                      <td
                        v-for="(level, levelIndex) in criterion.levels || []"
                        :key="`cell-${criterionIndex}-${levelIndex}`"
                        class="px-3 py-2 border-r border-slate-300"
                      >
                        <input
                          :value="level.description"
                          @input="updateCellValue(criterionIndex, levelIndex, 'description', ($event.target as HTMLInputElement).value)"
                          type="text"
                          placeholder="Level description"
                          class="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Add Criterion Row Button -->
              <div class="flex justify-center">
                <button
                  @click="addRubricCriterion"
                  type="button"
                  class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  + Add Criterion
                </button>
              </div>
            </div>

            <!-- Empty Rubric State -->
            <div v-else class="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
              <p class="text-xs text-slate-600 mb-3">No criteria defined yet.</p>
              <button
                @click="addRubricCriterion"
                type="button"
                class="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500"
              >
                + Add First Criterion
              </button>
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
                <p class="font-medium">
                  Type: {{ getGradingTypeLabel(standard) }}
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
