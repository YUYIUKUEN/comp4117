<script setup lang="ts">
import { ref, computed } from 'vue'
import { Bars3Icon, UserIcon, UserGroupIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'

type Mode = 'individual' | 'pair'

const sidebarOpen = ref(false)
const step = ref<1 | 2 | 3>(1)
const mode = ref<Mode>('individual')
const partnerId = ref('')
const partnerEmail = ref('')

const topics = [
  {
    id: 1,
    title: 'Smart City Walkability in Kowloon East',
    type: 'Individual or Pair',
    capacity: '0 / 2 students',
  },
  {
    id: 2,
    title: 'Urban Farming and Community Resilience in Sham Shui Po',
    type: 'Pair only',
    capacity: '1 / 2 students',
  },
  {
    id: 3,
    title: 'Digital Platforms and Youth Political Participation',
    type: 'Individual only',
    capacity: '1 / 1 student',
  },
]

const selectedTopicId = ref<number | null>(1)

const canContinueStep1 = computed(() => !!mode.value)
const canContinueStep2 = computed(() => {
  if (mode.value === 'individual') return true
  return partnerId.value.trim().length > 0 && partnerEmail.value.trim().length > 0
})
const canConfirm = computed(() => selectedTopicId.value !== null)
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
        <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white">
          <UserGroupIcon class="h-5 w-5" />
        </div>
        <div class="flex flex-col">
          <span class="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            Matching
          </span>
          <span class="text-xs font-semibold text-slate-900">
            Choose FYP mode
          </span>
        </div>
      </div>

      <div class="px-4 py-4 text-xs text-slate-600 space-y-2">
        <p class="font-medium text-slate-800">
          Grouping rules
        </p>
        <ul class="space-y-1 list-disc pl-4">
          <li>Projects are either <span class="font-semibold">individual</span> or in a group of <span class="font-semibold">two</span>.</li>
          <li>No groups larger than two are allowed.</li>
          <li>You and your partner must submit the same choice.</li>
        </ul>
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
              Matching wizard
            </p>
            <p class="text-sm font-semibold text-slate-900">
              Set up your Final Year Project group
            </p>
          </div>
        </div>
      </header>

      <main class="flex-1 px-4 sm:px-6 pb-6 pt-4 sm:pt-5">
        <!-- Step indicator -->
        <ol class="flex items-center gap-3 text-xs mb-5">
          <li class="flex items-center gap-2">
            <span
              class="flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-medium"
              :class="step === 1 ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-600'"
            >
              1
            </span>
            <span class="hidden sm:inline text-slate-700">Choose individual / pair</span>
          </li>
          <div class="h-px flex-1 bg-slate-200"></div>
          <li class="flex items-center gap-2">
            <span
              class="flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-medium"
              :class="step === 2 ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-600'"
            >
              2
            </span>
            <span class="hidden sm:inline text-slate-700">Confirm partner (if any)</span>
          </li>
          <div class="h-px flex-1 bg-slate-200"></div>
          <li class="flex items-center gap-2">
            <span
              class="flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-medium"
              :class="step === 3 ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-600'"
            >
              3
            </span>
            <span class="hidden sm:inline text-slate-700">Select topic preference</span>
          </li>
        </ol>

        <!-- Step 1: choose mode -->
        <section
          v-if="step === 1"
          class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70 space-y-4"
        >
          <header>
            <h2 class="text-sm font-semibold text-slate-900">
              Step 1 · How would you like to complete your FYP?
            </h2>
            <p class="mt-1 text-xs text-slate-600">
              You can choose to work alone, or with exactly one partner.
            </p>
          </header>

          <div class="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              class="flex items-center gap-3 rounded-lg border px-3 py-3 text-left text-xs transition hover:border-blue-500 hover:bg-blue-50"
              :class="mode === 'individual' ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white'"
              @click="mode = 'individual'"
            >
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                <UserIcon class="h-4 w-4" />
              </div>
              <div>
                <p class="font-medium text-slate-900">Individual project</p>
                <p class="mt-0.5 text-[11px] text-slate-600">
                  You are the only student in this project (1 / 1).
                </p>
              </div>
            </button>

            <button
              type="button"
              class="flex items-center gap-3 rounded-lg border px-3 py-3 text-left text-xs transition hover:border-blue-500 hover:bg-blue-50"
              :class="mode === 'pair' ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white'"
              @click="mode = 'pair'"
            >
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                <UserGroupIcon class="h-4 w-4" />
              </div>
              <div>
                <p class="font-medium text-slate-900">Pair project (2 students)</p>
                <p class="mt-0.5 text-[11px] text-slate-600">
                  You and <span class="font-medium">one</span> partner share the same topic (2 / 2).
                </p>
              </div>
            </button>
          </div>

          <div class="flex justify-end">
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-full border border-blue-500 bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="!canContinueStep1"
              @click="step = 2"
            >
              Continue
            </button>
          </div>
        </section>

        <!-- Step 2: confirm partner -->
        <section
          v-else-if="step === 2"
          class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70 space-y-4"
        >
          <header class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-sm font-semibold text-slate-900">
                Step 2 · Confirm grouping details
              </h2>
              <p class="mt-1 text-xs text-slate-600" v-if="mode === 'individual'">
                You have chosen to complete your FYP as an <span class="font-medium">individual</span>.
              </p>
              <p class="mt-1 text-xs text-slate-600" v-else>
                You have chosen a <span class="font-medium">pair project</span>. Please enter your partner’s details.
              </p>
            </div>
            <span
              class="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] text-slate-600"
            >
              <CheckCircleIcon class="h-3.5 w-3.5 text-emerald-500" />
              {{ mode === 'individual' ? '1 student' : '2 students' }} total
            </span>
          </header>

          <div v-if="mode === 'pair'" class="space-y-3 text-xs">
            <div>
              <label class="block text-[11px] font-medium text-slate-800">
                Partner student ID
              </label>
              <input
                v-model="partnerId"
                type="text"
                class="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                placeholder="e.g. 22123456"
              />
            </div>
            <div>
              <label class="block text-[11px] font-medium text-slate-800">
                Partner university email
              </label>
              <input
                v-model="partnerEmail"
                type="email"
                class="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                placeholder="e.g. s22xxxx@life.hkbu.edu.hk"
              />
            </div>

            <p class="mt-1 flex items-center gap-1 text-[11px]" :class="canContinueStep2 ? 'text-emerald-600' : 'text-amber-600'">
              <CheckCircleIcon v-if="canContinueStep2" class="h-3.5 w-3.5" />
              <ExclamationCircleIcon v-else class="h-3.5 w-3.5" />
              <span v-if="canContinueStep2">
                Make sure your partner selects the same mode and topic to complete the pairing.
              </span>
              <span v-else>
                Please fill in both your partner’s student ID and email.
              </span>
            </p>
          </div>

          <div v-else class="text-[11px] text-slate-600">
            <p>
              No partner details are required for individual projects. You will appear as a group of
              <span class="font-medium">one</span>.
            </p>
          </div>

          <div class="flex items-center justify-between pt-2 text-xs">
            <button
              type="button"
              class="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:border-slate-400"
              @click="step = 1"
            >
              Back
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-full border border-blue-500 bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="!canContinueStep2"
              @click="step = 3"
            >
              Continue to topic
            </button>
          </div>
        </section>

        <!-- Step 3: select topic -->
        <section
          v-else
          class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70 space-y-4"
        >
          <header class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-sm font-semibold text-slate-900">
                Step 3 · Select your topic preference
              </h2>
              <p class="mt-1 text-xs text-slate-600">
                Choose one topic that matches your selected mode (individual or pair).
              </p>
            </div>
            <div class="text-[11px] text-right text-slate-500">
              <p class="font-medium text-slate-800">
                Choice: {{ mode === 'individual' ? 'Individual project' : 'Pair project (2 students)' }}
              </p>
              <p>Groups larger than 2 are not allowed.</p>
            </div>
          </header>

          <div class="space-y-2 text-xs">
            <div
              v-for="topic in topics"
              :key="topic.id"
              class="flex items-start gap-3 rounded-lg border px-3 py-3 cursor-pointer transition hover:border-blue-500 hover:bg-blue-50"
              :class="selectedTopicId === topic.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'"
              @click="selectedTopicId = topic.id"
            >
              <input
                type="radio"
                class="mt-1 h-3.5 w-3.5 text-blue-600 border-slate-300 focus:ring-blue-500"
                :checked="selectedTopicId === topic.id"
                @change="selectedTopicId = topic.id"
              />
              <div class="flex-1">
                <p class="text-xs font-medium text-slate-900">
                  {{ topic.title }}
                </p>
                <p class="mt-0.5 text-[11px] text-slate-600">
                  {{ topic.type }} · {{ topic.capacity }}
                </p>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between pt-2 text-xs">
            <button
              type="button"
              class="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:border-slate-400"
              @click="step = 2"
            >
              Back
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-full border border-emerald-500 bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="!canConfirm"
            >
              <CheckCircleIcon class="h-4 w-4" />
              Confirm grouping & topic
            </button>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

