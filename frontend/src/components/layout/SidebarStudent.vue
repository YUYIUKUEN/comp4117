<script setup lang="ts">
import { useRouter } from 'vue-router'

const props = defineProps<{
  current?: string
}>()

const router = useRouter()

const items = [
  { id: 'home', label: 'Home', path: '/dashboard' },
  { id: 'topic', label: 'My Topic & Supervisor', path: '/topics' },
  { id: 'submissions', label: 'My Submissions', path: '/submissions' },
  { id: 'feedback', label: 'Feedback Received', path: '/feedback' },
  { id: 'archive', label: 'Topic Archive', path: '/archive' },
  { id: 'reminders', label: 'Reminders', path: '/reminders' },
]

const navigate = (path: string) => {
  router.push(path)
}
</script>

<template>
  <aside
    class="hidden md:flex md:flex-col w-60 border-r border-slate-200 bg-white"
    aria-label="Student sidebar"
  >
    <nav class="mt-3 px-3 space-y-1 text-sm">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        @click="navigate(item.path)"
        class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition hover:bg-slate-100 hover:text-slate-900"
        :class="item.id === (props.current || 'home') ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600'"
      >
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <div class="mt-auto px-4 py-3 text-[11px] text-slate-500">
      <span class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
        Student View
      </span>
    </div>
  </aside>
</template>

