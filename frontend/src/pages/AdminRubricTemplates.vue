<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { PencilIcon, TrashIcon } from '@heroicons/vue/24/outline'
import rubricTemplateService from '../services/rubricTemplateService'
import type { RubricTemplate, RubricTemplateInput } from '../services/rubricTemplateService'

const templates = ref<RubricTemplate[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const showForm = ref(false)
const editingId = ref<string | null>(null)

const formData = ref<RubricTemplateInput>({
  name: '',
  description: '',
  rubricItems: [],
  isDefault: false,
})

const fetchTemplates = async () => {
  try {
    loading.value = true
    error.value = ''
    templates.value = await rubricTemplateService.getAll()
  } catch (e: any) {
    error.value = e?.response?.data?.error || 'Failed to load templates'
  } finally {
    loading.value = false
  }
}

onMounted(fetchTemplates)

const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    rubricItems: [],
    isDefault: false,
  }
  editingId.value = null
  showForm.value = false
}

const startEdit = (template: RubricTemplate) => {
  editingId.value = template._id
  formData.value = {
    name: template.name,
    description: template.description || '',
    rubricItems: JSON.parse(JSON.stringify(template.rubricItems || [])),
    isDefault: template.isDefault,
  }
  showForm.value = true
}

const handleSave = async () => {
  if (!formData.value.name.trim()) {
    alert('Please enter a template name')
    return
  }

  try {
    saving.value = true
    error.value = ''

    if (editingId.value) {
      await rubricTemplateService.update(editingId.value, formData.value)
    } else {
      await rubricTemplateService.create(formData.value)
    }

    resetForm()
    await fetchTemplates()
  } catch (e: any) {
    error.value = e?.response?.data?.error || 'Failed to save template'
  } finally {
    saving.value = false
  }
}

const handleDelete = async (id: string, name: string) => {
  if (!confirm(`Delete template "${name}"?`)) return

  try {
    error.value = ''
    await rubricTemplateService.delete(id)
    await fetchTemplates()
  } catch (e: any) {
    error.value = e?.response?.data?.error || 'Failed to delete template'
  }
}

const addRubricCriterion = () => {
  if (!formData.value.rubricItems) {
    formData.value.rubricItems = []
  }

  // Use existing level count or default to 4
  const existingLevelCount = formData.value.rubricItems[0]?.levels?.length ?? 4
  const levels = Array.from({ length: existingLevelCount }, () => ({
    name: '',
    description: '',
  }))

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

const addPerformanceLevel = (criterionIndex: number) => {
  if (formData.value.rubricItems && formData.value.rubricItems[criterionIndex]) {
    if (!formData.value.rubricItems[criterionIndex].levels) {
      formData.value.rubricItems[criterionIndex].levels = []
    }
    formData.value.rubricItems[criterionIndex].levels!.push({
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

// Rubric management functions for table-based editor
const addPerformanceLevelColumn = () => {
  if (!formData.value.rubricItems) return
  formData.value.rubricItems.forEach((criterion) => {
    if (!criterion.levels) criterion.levels = []
    criterion.levels.push({ name: '', description: '' })
  })
}

const removePerformanceLevelColumn = (levelIndex: number) => {
  if (!formData.value.rubricItems) return
  if ((formData.value.rubricItems[0]?.levels?.length ?? 0) <= 1) return
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
</script>

<template>
  <div>
    <main class="px-4 sm:px-6 pb-6 pt-4 sm:pt-5">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Rubric Templates</h1>
          <p class="mt-1 text-sm text-slate-600">
            Create and manage reusable rubric templates for grading standards
          </p>
        </div>
        <button
          v-if="!showForm"
          @click="showForm = true"
          type="button"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          + Create Template
        </button>
      </div>

      <!-- Error Banner -->
      <div v-if="error" class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {{ error }}
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <span class="loading loading-spinner loading-md text-blue-600"></span>
        <span class="ml-2 text-sm text-slate-600">Loading templates...</span>
      </div>

      <!-- Create/Edit Form -->
      <div v-if="showForm" class="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 class="mb-4 text-lg font-semibold text-slate-900">
          {{ editingId ? 'Edit' : 'Create' }} Rubric Template
        </h2>

        <div class="space-y-4">
          <!-- Template Name -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Template Name *
            </label>
            <input
              v-model="formData.name"
              type="text"
              placeholder="e.g. Research Quality, Writing Skills"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              v-model="formData.description"
              placeholder="Brief description of what this template is for"
              rows="2"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            ></textarea>
          </div>

          <!-- Rubric Criteria -->
          <div>
            <!-- Rubric Controls -->
            <div class="flex gap-2 items-center justify-between mb-3">
              <label class="block text-sm font-semibold text-slate-700">
                Rubric Criteria
              </label>
              <div class="flex gap-2">
                <button
                  @click="addPerformanceLevelColumn"
                  type="button"
                  class="rounded-lg bg-blue-50 border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                >
                  + Add Performance Level
                </button>
                <button
                  @click="addRubricCriterion"
                  type="button"
                  class="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                >
                  + Add Criterion
                </button>
              </div>
            </div>

            <!-- Rubric Table Editor -->
            <div v-if="formData.rubricItems && formData.rubricItems.length > 0" class="rounded-lg border border-slate-300 overflow-x-auto">
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
              @click="handleSave"
              type="button"
              :disabled="saving"
              class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {{ saving ? 'Saving...' : editingId ? 'Update' : 'Create' }} Template
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

      <!-- Templates List -->
      <div v-if="!loading" class="space-y-3">
        <div
          v-for="template in templates"
          :key="template._id"
          class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-semibold text-slate-900">{{ template.name }}</h3>
                <span
                  v-if="template.isDefault"
                  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-green-50 text-green-700 border border-green-200"
                >
                  Default
                </span>
              </div>
              <p v-if="template.description" class="mt-1 text-xs text-slate-600">
                {{ template.description }}
              </p>
              <div v-if="template.rubricItems && template.rubricItems.length > 0" class="mt-2 text-xs text-slate-600">
                <strong>{{ template.rubricItems.length }}</strong> criteria
              </div>
            </div>
            <div class="flex gap-2">
              <button
                @click="startEdit(template)"
                type="button"
                class="rounded-lg border border-blue-300 bg-blue-50 p-2 text-blue-700 hover:bg-blue-100"
              >
                <PencilIcon class="h-4 w-4" />
              </button>
              <button
                @click="handleDelete(template._id, template.name)"
                type="button"
                class="rounded-lg border border-red-300 bg-red-50 p-2 text-red-700 hover:bg-red-100"
              >
                <TrashIcon class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="templates.length === 0" class="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <p class="text-sm text-slate-600">No rubric templates yet. Create one to get started!</p>
        </div>
      </div>
    </main>
  </div>
</template>
