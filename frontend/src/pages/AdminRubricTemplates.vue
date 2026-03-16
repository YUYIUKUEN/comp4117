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

  const levels = [
    { name: 'Poor', description: 'Needs improvement', points: 0 },
    { name: 'Fair', description: 'Meets minimum requirements', points: 3 },
    { name: 'Good', description: 'Meets expectations', points: 6 },
    { name: 'Excellent', description: 'Exceeds expectations', points: 10 },
  ]

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
      points: 0,
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
            <div class="flex items-center justify-between mb-3">
              <label class="block text-sm font-semibold text-slate-700">
                Rubric Criteria
              </label>
              <button
                @click="addRubricCriterion"
                type="button"
                class="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
              >
                + Add Criterion
              </button>
            </div>

            <!-- Criteria List -->
            <div v-if="formData.rubricItems && formData.rubricItems.length > 0" class="space-y-6">
              <div
                v-for="(criterion, criterionIndex) in formData.rubricItems"
                :key="criterionIndex"
                class="rounded-lg border border-slate-300 p-4"
              >
                <div class="space-y-3">
                  <!-- Criterion Title -->
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">
                      Criterion Title *
                    </label>
                    <input
                      v-model="criterion.title"
                      type="text"
                      placeholder="e.g. Research Quality"
                      class="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <!-- Criterion Description -->
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">
                      Description
                    </label>
                    <textarea
                      v-model="criterion.description"
                      placeholder="What does this criterion evaluate?"
                      rows="2"
                      class="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    ></textarea>
                  </div>

                  <!-- Performance Levels -->
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <label class="block text-xs font-semibold text-slate-700">
                        Performance Levels
                      </label>
                      <button
                        @click="addPerformanceLevel(criterionIndex)"
                        type="button"
                        class="text-xs text-blue-600 hover:text-blue-700"
                      >
                        + Add Level
                      </button>
                    </div>

                    <div class="rounded-lg border border-slate-300 overflow-hidden">
                      <table class="w-full text-xs">
                        <thead class="bg-slate-200">
                          <tr>
                            <th class="px-3 py-2 text-left font-medium text-slate-700">Name</th>
                            <th class="px-3 py-2 text-left font-medium text-slate-700">Description</th>
                            <th class="px-3 py-2 text-center font-medium text-slate-700 w-20">Points</th>
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
                                v-model.number="level.points"
                                type="number"
                                min="0"
                                class="w-full rounded border border-slate-300 px-2 py-1 text-xs text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td class="px-3 py-2 text-center">
                              <button
                                v-if="(criterion.levels?.length || 0) > 1"
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
                  </div>

                  <!-- Remove Criterion -->
                  <div class="flex justify-end pt-2">
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
            </div>

            <!-- Empty State -->
            <div v-else class="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
              <p class="text-xs text-slate-600">No criteria defined yet. Click "Add Criterion" to start building your rubric.</p>
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
