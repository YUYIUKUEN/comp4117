<script setup lang="ts">
import { ref, onMounted } from 'vue'
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

const archivedTopics = ref<ArchivedTopic[]>([])
const loading = ref(true)
const error = ref('')

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
            <div class="mb-3 flex flex-wrap items-center gap-2">
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
        </section>

        <!-- Empty State -->
        <div v-if="archivedTopics.length === 0" class="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <p class="text-sm text-slate-600">No topic applications yet</p>
        </div>
      </template>
    </main>
  </div>
</template>
