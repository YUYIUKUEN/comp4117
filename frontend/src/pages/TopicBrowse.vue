<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  AcademicCapIcon,
} from '@heroicons/vue/24/outline'

const sidebarOpen = ref(false)

const keyword = ref('')
const selectedConcentration = ref<'All' | 'Geography' | 'Sociology' | 'Psychology'>('All')
const selectedSupervisor = ref<'All' | 'Lee' | 'Chan' | 'Ng' | 'Wong'>('All')

const concentrations = ['All', 'Geography', 'Sociology', 'Psychology'] as const
const supervisors = ['All', 'Lee', 'Chan', 'Ng', 'Wong'] as const

const topics = ref([
  {
    id: 1,
    title: 'Digital Platforms and Youth Political Participation in Hong Kong',
    supervisor: 'Dr. Kelvin Chan',
    supervisorCode: 'Chan',
    concentration: 'Sociology',
    recommended: true,
    description:
      'Explores how social media and messaging apps influence political engagement among Hong Kong youth, using mixed‑methods research.',
    capacity: { taken: 2, total: 4 },
    tags: ['Youth Studies', 'Social Media', 'Quantitative + Qualitative'],
  },
  {
    id: 2,
    title: 'Mapping Thermal Inequality: Urban Heat Island Effects in Sham Shui Po',
    supervisor: 'Dr. Emily Lee',
    supervisorCode: 'Lee',
    concentration: 'Geography',
    recommended: false,
    description:
      'Uses remote sensing and field measurements to examine micro‑climate variations and the social distribution of heat stress.',
    capacity: { taken: 3, total: 3 },
    tags: ['GIS', 'Climate Justice', 'Fieldwork'],
  },
  {
    id: 3,
    title: 'Work‑from‑Home and Family Dynamics in Post‑Pandemic Hong Kong',
    supervisor: 'Prof. Agnes Ng',
    supervisorCode: 'Ng',
    concentration: 'Sociology',
    recommended: false,
    description:
      'Investigates how hybrid work arrangements reshape domestic labour, parenting, and inter‑generational relationships.',
    capacity: { taken: 1, total: 3 },
    tags: ['Family Studies', 'Qualitative Interviews'],
  },
  {
    id: 4,
    title: 'Gamified Mental Health Interventions for First‑Year University Students',
    supervisor: 'Dr. Henry Wong',
    supervisorCode: 'Wong',
    concentration: 'Psychology',
    recommended: false,
    description:
      'Designs and evaluates a low‑intensity gamified intervention to support stress management and adjustment in first‑year students.',
    capacity: { taken: 0, total: 2 },
    tags: ['Experimental Design', 'App Prototype'],
  },
])

const filteredTopics = computed(() =>
  topics.value.filter((t) => {
    const matchKeyword =
      !keyword.value ||
      t.title.toLowerCase().includes(keyword.value.toLowerCase()) ||
      t.description.toLowerCase().includes(keyword.value.toLowerCase())
    const matchConc =
      selectedConcentration.value === 'All' ||
      t.concentration === selectedConcentration.value
    const matchSup =
      selectedSupervisor.value === 'All' ||
      t.supervisorCode === selectedSupervisor.value
    return matchKeyword && matchConc && matchSup
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
                  Concentration
                </label>
                <button
                  type="button"
                  class="inline-flex w-44 items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-xs text-slate-700 hover:border-blue-500 hover:bg-blue-50"
                >
                  <span>{{ selectedConcentration }}</span>
                  <ChevronDownIcon class="h-4 w-4 text-slate-400" />
                </button>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="c in concentrations"
                    :key="c"
                    type="button"
                    class="rounded-full px-2.5 py-0.5 text-[11px] border"
                    :class="selectedConcentration === c
                      ? 'bg-blue-50 text-blue-700 border-blue-500/60'
                      : 'bg-slate-50 text-slate-600 border-slate-300 hover:border-blue-500/60 hover:text-blue-700'"
                    @click="selectedConcentration = c"
                  >
                    {{ c }}
                  </button>
                </div>
              </div>

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

          <div class="mt-4 flex items-center justify-between text-[11px] text-slate-500">
            <div class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
              <FunnelIcon class="h-3.5 w-3.5 text-slate-500" />
              <span>Filters are illustrative only · No backend</span>
            </div>
          </div>
        </section>

        <section
          class="mt-4 sm:mt-6 space-y-3"
          aria-label="Available topics"
        >
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold text-slate-900">
              Matching suggestions for you
            </h2>
            <span class="text-[11px] text-slate-500">
              Based on your concentration and indicated interests.
            </span>
          </div>

          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <article
              v-for="topic in filteredTopics"
              :key="topic.id"
              class="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 transition hover:-translate-y-0.5 hover:border-blue-500/70 hover:shadow-blue-200/70"
            >
              <header class="flex items-start justify-between gap-2">
                <div>
                  <p class="text-[11px] uppercase tracking-[0.18em] text-sky-600">
                    {{ topic.concentration }}
                  </p>
                  <h3 class="mt-1 text-sm font-semibold text-slate-900 leading-snug">
                    {{ topic.title }}
                  </h3>
                </div>
                <span
                  v-if="topic.recommended"
                  class="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700 border border-blue-200"
                >
                  Recommended
                </span>
              </header>

              <p class="mt-2 text-xs text-slate-600 line-clamp-3">
                {{ topic.description }}
              </p>

              <div class="mt-3 flex items-center justify-between gap-3 text-[11px] text-slate-500">
                <div class="flex items-center gap-2">
                  <div
                    class="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium"
                  >
                    {{ topic.supervisor.split(' ')[1]?.[0] ?? '' }}{{ topic.supervisor.split(' ')[1]?.[1] ?? '' }}
                  </div>
                  <div>
                    <p class="font-medium text-slate-900">
                      {{ topic.supervisor }}
                    </p>
                    <p class="text-slate-500">Dept. of Social Sciences</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-slate-500">Capacity</p>
                  <p class="font-medium text-slate-900">
                    {{ topic.capacity.taken }}/{{ topic.capacity.total }} taken
                  </p>
                </div>
              </div>

              <div class="mt-2 flex items-center gap-2 text-[11px] flex-wrap">
                <span
                  v-for="tag in topic.tags"
                  :key="tag"
                  class="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700 border border-slate-200"
                >
                  {{ tag }}
                </span>
              </div>

              <div class="mt-3 flex items-center justify-between text-[11px]">
                <div class="flex items-center gap-1.5 text-slate-500">
                  <span class="inline-flex h-1.5 w-1.5 rounded-full"
                    :class="topic.capacity.taken >= topic.capacity.total ? 'bg-rose-400' : 'bg-emerald-400'"
                  ></span>
                  <span>
                    {{ topic.capacity.taken >= topic.capacity.total ? 'Waitlist only' : 'Slots available' }}
                  </span>
                </div>
                <button
                  type="button"
                  class="inline-flex items-center justify-center rounded-full border border-blue-500/70 bg-blue-600 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm shadow-blue-300/70 group-hover:bg-blue-500"
                >
                  {{ topic.capacity.taken >= topic.capacity.total ? 'Preview details' : 'Apply for this topic' }}
                </button>
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

