<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  AcademicCapIcon,
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '../stores/authStore'
import topicService from '../services/topicService'

const authStore = useAuthStore()
const sidebarOpen = ref(false)

const keyword = ref('')
const selectedSupervisor = ref<string>('All')
const supervisors = ['All', 'Lee', 'Chan', 'Ng', 'Wong'] as const

const topics = ref<any[]>([])
const loading = ref(false)
const error = ref('')

onMounted(async () => {
  loading.value = true
  try {
    const studentConcentration = authStore.user?.concentration
    if (!studentConcentration) {
      error.value = 'Unable to determine your concentration'
      loading.value = false
      return
    }

    const response = await topicService.getTopicsByConcentration(studentConcentration, {
      page: 1,
      limit: 100
    })
    topics.value = response.data
  } catch (e: any) {
    error.value = e?.response?.data?.error || 'Failed to load topics'
  } finally {
    loading.value = false
  }
})

const filteredTopics = computed(() =>
  topics.value.filter((t) => {
    const matchKeyword =
      !keyword.value ||
      t.title.toLowerCase().includes(keyword.value.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(keyword.value.toLowerCase()))
    const matchSup =
      selectedSupervisor.value === 'All' ||
      t.supervisorName?.includes(selectedSupervisor.value)
    return matchKeyword && matchSup
  }),
)
</script>

<template>
  <div class="min-h-[calc(100vh-3.25rem)] bg-slate-50 text-slate-900 flex">
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-20 bg-black/40 lg:hidden"
      @click="sidebarOpen = false"
      aria-hidden="true"
    ></div>

    <aside
      class="fixed z-30 inset-y-0 left-0 w-64 transform bg-white border-r border-slate-200 transition-transform duration-200 ease-out
             lg:static lg:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
      aria-label="Student navigation"
    >
      <div class="flex h-14 items-center gap-2 px-4 border-b border-slate-200">
        <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 shadow-sm shadow-blue-500/40">
          <AcademicCapIcon class="h-5 w-5 text-white" aria-hidden="true" />
        </div>
        <div class="flex flex-col">
          <span class="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            Topics
          </span>
          <span class="text-xs font-semibold text-slate-900">
            Browse Library
          </span>
        </div>
      </div>
    </aside>

    <div class="flex-1 flex flex-col min-w-0">
      <header
        class="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur"
      >
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            @click="sidebarOpen = !sidebarOpen"
            aria-label="Toggle navigation"
          >
            <Bars3Icon class="h-6 w-6" aria-hidden="true" />
          </button>
          <div>
            <p class="text-[11px] uppercase tracking-[0.2em] text-slate-500">
              Topics
            </p>
            <p class="text-sm font-semibold text-slate-900">
              Browse available FYP topics
            </p>
          </div>
        </div>
      </header>

      <main class="flex-1 px-4 sm:px-6 pb-6 pt-4 sm:pt-5">
        <section
          aria-label="Search and filter topics"
          class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70"
        >
          <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div class="flex-1 space-y-2">
              <label for="keyword" class="text-xs font-medium text-slate-800">
                Search by keyword
              </label>
              <div class="relative">
                <MagnifyingGlassIcon
                  class="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="keyword"
                  v-model="keyword"
                  type="search"
                  class="block w-full rounded-lg border border-slate-300 bg-white px-9 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                  placeholder="e.g. smart city, youth, mental health"
                />
              </div>
              <p class="text-[11px] text-slate-500">
                Showing
                <span class="font-medium text-slate-100">
                  {{ filteredTopics.length }}
                </span>
                of {{ topics.length }} topics based on your filters.
              </p>
            </div>

            <div class="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div class="space-y-1.5 text-xs">
                <label class="font-medium text-slate-800">
                  Supervisor
                </label>
                <button
                  type="button"
                  class="inline-flex w-40 items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-xs text-slate-700 hover:border-blue-500 hover:bg-blue-50"
                >
                  <span>{{ selectedSupervisor === 'All' ? 'Any supervisor' : selectedSupervisor }}</span>
                  <ChevronDownIcon class="h-4 w-4 text-slate-400" />
                </button>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="s in supervisors"
                    :key="s"
                    type="button"
                    class="rounded-full px-2.5 py-0.5 text-[11px] border"
                    :class="selectedSupervisor === s
                      ? 'bg-blue-50 text-blue-700 border-blue-500/60'
                      : 'bg-slate-50 text-slate-600 border-slate-300 hover:border-blue-500/60 hover:text-blue-700'"
                    @click="selectedSupervisor = s"
                  >
                    {{ s }}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </section>

        <!-- Loading State -->
        <div v-if="loading" class="mt-4 sm:mt-6 flex items-center justify-center py-12">
          <span class="loading loading-spinner loading-md text-blue-600"></span>
          <span class="ml-2 text-sm text-slate-600">Loading topics...</span>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="mt-4 sm:mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <p class="text-sm font-medium text-red-700">{{ error }}</p>
        </div>

        <!-- Topics Section -->
        <section v-else class="mt-4 sm:mt-6 space-y-3" aria-label="Available topics">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold text-slate-900">
              Available topics for your concentration
            </h2>
          </div>

          <div v-if="filteredTopics.length === 0" class="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p class="text-sm text-slate-600">No topics found matching your filters.</p>
          </div>

          <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <article
              v-for="topic in filteredTopics"
              :key="topic._id"
              class="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 transition hover:-translate-y-0.5 hover:border-blue-500/70 hover:shadow-blue-200/70"
            >
              <header>
                <h3 class="text-sm font-semibold text-slate-900 leading-snug">
                  {{ topic.title }}
                </h3>
              </header>

              <p class="mt-2 text-xs text-slate-600 line-clamp-3">
                {{ topic.description }}
              </p>

              <div class="mt-3 flex items-center gap-3 text-[11px] text-slate-500">
                <div class="flex items-center gap-2">
                  <div
                    class="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium"
                  >
                    {{ topic.supervisorName?.split(' ')[0]?.[0] ?? '' }}
                  </div>
                  <div>
                    <p class="font-medium text-slate-900">
                      {{ topic.supervisorName || 'Unknown' }}
                    </p>
                  </div>
                </div>
              </div>

              <div v-if="topic.keywords && topic.keywords.length > 0" class="mt-2 flex items-center gap-2 text-[11px] flex-wrap">
                <span
                  v-for="keyword in topic.keywords.slice(0, 3)"
                  :key="keyword"
                  class="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700 border border-slate-200"
                >
                  {{ keyword }}
                </span>
              </div>

              <div class="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  class="inline-flex items-center justify-center rounded-full border border-blue-500/70 bg-blue-600 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm shadow-blue-300/70 group-hover:bg-blue-500 transition"
                >
                  View topic
                </button>
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

