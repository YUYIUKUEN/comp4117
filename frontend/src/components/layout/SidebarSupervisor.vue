<script setup lang="ts">
import { useRouter } from 'vue-router'

const props = defineProps<{
  current?: string
}>()

const router = useRouter()

const items = [
  { id: 'dashboard', label: 'Dashboard', path: '/supervisor/dashboard' },
  { id: 'students', label: 'All Students', path: '/supervisor/students' },
  { id: 'topics', label: 'My Topics', path: '/supervisor/topics' },
  { id: 'feedback', label: 'Feedback & Grading', path: '/supervisor/feedback' },
  { id: 'activity', label: 'Activity Logs', path: '/supervisor/activity' },
]

const navigate = (path: string) => {
  router.push(path)
}
</script>

<template>
  <aside
    class="hidden md:flex md:flex-col w-60 border-r border-slate-200 bg-white"
    aria-label="Supervisor sidebar"
  >
    <nav class="mt-3 px-3 space-y-1 text-sm">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        @click="navigate(item.path)"
        class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition hover:bg-slate-100 hover:text-slate-900"
        :class="item.id === (props.current || 'dashboard') ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600'"
      >
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <div class="mt-auto px-4 py-3 text-[11px] text-slate-500">
      <span class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
        Supervisor View
      </span>
    </div>
  </aside>
</template>
