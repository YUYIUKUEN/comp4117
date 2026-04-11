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
  enabledByPathway: { 'Research-Based': true, 'Solution-Based': true },
  pathways: ['Research-Based', 'Solution-Based'],
  rubricTemplatesByPathway: { 'Research-Based': null, 'Solution-Based': null },
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
    enabledByPathway: { 'Research-Based': true, 'Solution-Based': true },
    pathways: ['Research-Based', 'Solution-Based'],
    rubricTemplatesByPathway: { 'Research-Based': null, 'Solution-Based': null },
  }
  editingId.value = null
  showAddForm.value = false
}

const openAddForm = () => {
  showAddForm.value = true
  nextTick(() => {
    formContainerRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
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
    enabledByPathway: standard.enabledByPathway || { 'Research-Based': true, 'Solution-Based': true },
    pathways: standard.pathways || ['Research-Based', 'Solution-Based'],
    rubricTemplatesByPathway: standard.rubricTemplatesByPathway || { 'Research-Based': null, 'Solution-Based': null },
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
          @click="openAddForm"
          type="button"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 active:bg-blue-700"
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

          <!-- Pathway Selection -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-3">
              Enable Assessment for Pathways
            </label>
            <div class="space-y-2">
              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  :checked="formData.pathways?.includes('Research-Based')"
                  @change="(e) => {
                    if ((e.target as HTMLInputElement).checked) {
                      if (!formData.pathways) formData.pathways = [];
                      if (!formData.pathways.includes('Research-Based')) {
                        formData.pathways.push('Research-Based');
                      }
                      if (formData.enabledByPathway) {
                        formData.enabledByPathway['Research-Based'] = true;
                      }
                    } else {
                      if (formData.pathways) {
                        formData.pathways = formData.pathways.filter((p: string) => p !== 'Research-Based');
                      }
                      if (formData.enabledByPathway) {
                        formData.enabledByPathway['Research-Based'] = false;
                      }
                    }
                  }"
                  class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span class="text-sm text-slate-700">Research-Based Pathway</span>
              </label>
              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  :checked="formData.pathways?.includes('Solution-Based')"
                  @change="(e) => {
                    if ((e.target as HTMLInputElement).checked) {
                      if (!formData.pathways) formData.pathways = [];
                      if (!formData.pathways.includes('Solution-Based')) {
                        formData.pathways.push('Solution-Based');
                      }
                      if (formData.enabledByPathway) {
                        formData.enabledByPathway['Solution-Based'] = true;
                      }
                    } else {
                      if (formData.pathways) {
                        formData.pathways = formData.pathways.filter((p: string) => p !== 'Solution-Based');
                      }
                      if (formData.enabledByPathway) {
                        formData.enabledByPathway['Solution-Based'] = false;
                      }
                    }
                  }"
                  class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span class="text-sm text-slate-700">Solution-Based Pathway</span>
              </label>
            </div>
            <p class="mt-2 text-xs text-slate-500">
              Select which pathways should have this assessment enabled. Students will only see enabled assessments for their pathway.
            </p>
          </div>

          <!-- Pathway-Specific Rubric Templates -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-3">
              Rubric Templates by Pathway
            </label>
            <div class="space-y-3">
              <!-- Research-Based Template -->
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">
                  Research-Based Pathway
                </label>
                <select
                  v-model="formData.rubricTemplatesByPathway!['Research-Based']"
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option :value="null">No specific template</option>
                  <option v-for="template in rubricTemplates" :key="template._id" :value="template._id">
                    {{ template.name }}
                  </option>
                </select>
              </div>

              <!-- Solution-Based Template -->
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">
                  Solution-Based Pathway
                </label>
                <select
                  v-model="formData.rubricTemplatesByPathway!['Solution-Based']"
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option :value="null">No specific template</option>
                  <option v-for="template in rubricTemplates" :key="template._id" :value="template._id">
                    {{ template.name }}
                  </option>
                </select>
              </div>
            </div>
            <p class="mt-2 text-xs text-slate-500">
              <strong>Optional:</strong> Select a rubric template for each pathway. If left empty, supervisors can create rubrics on-demand.
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
                <!-- Pathway indicators -->
                <span
                  v-if="standard.pathways?.includes('Research-Based') && !standard.pathways?.includes('Solution-Based')"
                  class="inline-flex items-center rounded-full border border-pink-200 bg-pink-50 px-2.5 py-0.5 text-[11px] font-medium text-pink-700"
                >
                  🔬 Research-Based Only
                </span>
                <span
                  v-else-if="standard.pathways?.includes('Solution-Based') && !standard.pathways?.includes('Research-Based')"
                  class="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-medium text-indigo-700"
                >
                  💡 Solution-Based Only
                </span>
                <span
                  v-else-if="standard.pathways?.includes('Research-Based') && standard.pathways?.includes('Solution-Based')"
                  class="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700"
                >
                  ✓ Both Pathways
                </span>
                <span
                  v-if="standard.rubricTemplatesByPathway?.['Research-Based']"
                  class="inline-flex items-center rounded-full border border-pink-200 bg-pink-50 px-2.5 py-0.5 text-[11px] font-medium text-pink-700"
                >
                  Research-Based Template
                </span>
                <span
                  v-if="standard.rubricTemplatesByPathway?.['Solution-Based']"
                  class="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-medium text-indigo-700"
                >
                  Solution-Based Template
                </span>
                <span
                  v-if="!standard.rubricTemplatesByPathway?.['Research-Based'] && !standard.rubricTemplatesByPathway?.['Solution-Based']"
                  class="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-[11px] font-medium text-gray-700"
                >
                  Generic (Both Pathways)
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
                <p v-if="standard.rubricItems[0]?.levels && standard.rubricItems[0].levels.length > 0" class="text-xs text-blue-700 mb-2">
                  Levels: {{ standard.rubricItems[0].levels.map(l => l.name).join(', ') }}
                </p>
                <div class="space-y-1">
                  <div v-for="(criterion, idx) in standard.rubricItems" :key="idx" class="text-xs text-blue-800">
                    <p class="font-medium">{{ criterion.title }}</p>
                  </div>
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
