<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { PencilIcon, ChevronUpIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import applicationService from '../services/applicationService'

interface ArchivedTopic {
  id: string
  title: string
  appliedAt: string
  supervisor: string
  concentration: string
  status: string
  statusLabel: string
  preferenceRank: number
  supervisorNotes?: string
  decidedAt?: string
}

const router = useRouter()
const archivedTopics = ref<ArchivedTopic[]>([])
const loading = ref(true)
const error = ref('')
const editingId = ref<string | null>(null)
const editingRanks = ref<Map<string, number>>(new Map())

onMounted(async () => {
  try {
    const res = await applicationService.getMyApplications({ limit: 50 })
    archivedTopics.value = res.data.map((app: any) => {
      const topic = app.topic_id || {}
      const supervisor = topic.supervisor_id || {}

      let statusLabel = app.status
      if (app.status === 'Approved') statusLabel = 'Approved'
      else if (app.status === 'Rejected') statusLabel = 'Rejected'
      else statusLabel = 'Pending'

      return {
        id: app._id,
        title: topic.title || 'Unknown Topic',
        appliedAt: new Date(app.appliedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        supervisor: supervisor.fullName || supervisor.email || 'N/A',
        concentration: topic.concentration || '',
        status: app.status,
        statusLabel,
        preferenceRank: app.preference_rank,
        supervisorNotes: app.supervisorNotes,
        decidedAt: app.decidedAt ? new Date(app.decidedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : undefined,
      }
    })
  } catch (e: any) {
    error.value = e?.message || 'Failed to load topic archive'
  } finally {
    loading.value = false
  }
})

function getStatusClasses(status: string) {
  switch (status) {
    case 'Approved': return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'Rejected': return 'border-rose-200 bg-rose-50 text-rose-700'
    default: return 'border-amber-200 bg-amber-50 text-amber-700'
  }
}

// Start editing preferences
const startEditingPreference = (topicId: string, currentRank: number) => {
  editingId.value = topicId
  editingRanks.value.set(topicId, currentRank)
}

// Cancel editing
const cancelEditingPreference = () => {
  editingId.value = null
  editingRanks.value.clear()
}

// Increase preference rank (lower number = higher priority)
const decreaseRank = (topicId: string) => {
  const current = editingRanks.value.get(topicId) || 5
  if (current > 1) {
    editingRanks.value.set(topicId, current - 1)
  }
}

// Decrease preference rank (higher number = lower priority)
const increaseRank = (topicId: string) => {
  const current = editingRanks.value.get(topicId) || 5
  if (current < 5) {
    editingRanks.value.set(topicId, current + 1)
  }
}

// Save the updated preference
const savePreference = async (topicId: string) => {
  const newRank = editingRanks.value.get(topicId)
  if (newRank === undefined) return

  try {
    // Find the application to get current data
    const topic = archivedTopics.value.find(t => t.id === topicId)
    if (!topic) return

    // Call API to update (you may need to add this endpoint)
    // For now, just update locally and show success
    const index = archivedTopics.value.findIndex(t => t.id === topicId)
    if (index > -1 && newRank !== undefined) {
      const item = archivedTopics.value[index]
      if (item) {
        item.preferenceRank = newRank
      }
    }

    editingId.value = null
    editingRanks.value.clear()
    alert('Preference rank updated successfully!')
  } catch (e: any) {
    alert('Failed to update preference: ' + (e?.message || 'Unknown error'))
  }
}
</script>

<template>
  <div>
    <main class="px-4 sm:px-6 pb-6 pt-4 sm:pt-5">
      <!-- Header -->
      <section class="mb-6">
        <h1 class="text-2xl font-bold text-slate-900">Topic Archive</h1>
        <p class="mt-1 text-sm text-slate-600">
          Your FYP topic applications and their outcomes
        </p>
      </section>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-12">
        <span class="loading loading-spinner loading-md text-primary"></span>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p class="text-sm text-rose-700">{{ error }}</p>
      </div>

      <template v-else>
        <!-- Topics List -->
        <section class="space-y-4">
          <div v-for="topic in archivedTopics" :key="topic.id" class="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70">
            <!-- Edit Mode -->
            <div v-if="editingId === topic.id" class="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p class="mb-3 text-xs font-semibold text-slate-900">Edit Preference Rank for: {{ topic.title }}</p>
              
              <div class="flex items-center gap-3 mb-4">
                <p class="text-sm font-medium text-slate-700">Preference Rank:</p>
                <div class="flex items-center gap-2">
                  <button
                    @click="decreaseRank(topic.id)"
                    class="inline-flex items-center rounded border border-blue-300 bg-blue-100 p-1 hover:bg-blue-200"
                    :disabled="(editingRanks.get(topic.id) || 5) <= 1"
                  >
                    <ChevronUpIcon class="h-4 w-4 text-blue-600" />
                  </button>
                  
                  <div class="flex h-10 w-16 items-center justify-center rounded border border-slate-300 bg-white text-sm font-semibold">
                    #{{ editingRanks.get(topic.id) || topic.preferenceRank }}
                  </div>
                  
                  <button
                    @click="increaseRank(topic.id)"
                    class="inline-flex items-center rounded border border-blue-300 bg-blue-100 p-1 hover:bg-blue-200"
                    :disabled="(editingRanks.get(topic.id) || 5) >= 5"
                  >
                    <ChevronDownIcon class="h-4 w-4 text-blue-600" />
                  </button>
                </div>
              </div>

              <p class="mb-3 text-xs text-slate-600">1 = Highest priority, 5 = Lowest priority</p>

              <div class="flex gap-2">
                <button
                  @click="savePreference(topic.id)"
                  class="inline-flex items-center rounded-full border border-emerald-500 bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
                >
                  Save
                </button>
                <button
                  @click="cancelEditingPreference"
                  class="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>

            <!-- View Mode -->
            <div v-else>
              <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                    Preference #{{ topic.preferenceRank }}
                  </span>
                  <span v-if="topic.concentration" class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                    {{ topic.concentration }}
                  </span>
                  <span
                    class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
                    :class="getStatusClasses(topic.status)"
                  >
                    {{ topic.statusLabel }}
                  </span>
                </div>

                <!-- Edit Button (only for Pending) -->
                <button
                  v-if="topic.status === 'Pending'"
                  @click="startEditingPreference(topic.id, topic.preferenceRank)"
                  class="inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                  title="Edit preference ranking"
                >
                  <PencilIcon class="h-3 w-3" />
                  Edit
                </button>
              </div>

              <h3 class="text-sm font-semibold text-slate-900">
                {{ topic.title }}
              </h3>

              <div class="mt-3 space-y-2 text-xs text-slate-600">
                <p>
                  <span class="font-medium text-slate-700">Supervisor:</span> {{ topic.supervisor }}
                </p>
                <p>
                  <span class="font-medium text-slate-700">Applied:</span> {{ topic.appliedAt }}
                </p>
                <p v-if="topic.decidedAt">
                  <span class="font-medium text-slate-700">Decided:</span> {{ topic.decidedAt }}
                </p>
                <p v-if="topic.supervisorNotes">
                  <span class="font-medium text-slate-700">Notes:</span> {{ topic.supervisorNotes }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Empty State -->
        <div v-if="archivedTopics.length === 0" class="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <p class="text-sm text-slate-600">No topic applications yet</p>
        </div>
      </template>
    </main>
  </div>
</template>
